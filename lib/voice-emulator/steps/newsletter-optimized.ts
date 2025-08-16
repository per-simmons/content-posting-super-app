import { URLClassifierAgent } from '../agents/url-classifier'

// Helper function to chunk arrays
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export async function runNewsletterStepOptimized(sessionId: string, context: any) {
  const { sources = {}, hints = {}, targetName } = context
  const newsletterUrl = sources?.newsletter || hints?.newsletter || sources?.substack
  
  if (!newsletterUrl) {
    console.log("No newsletter URL found, skipping newsletter extraction")
    return { articles: [], skipped: true }
  }

  console.log(`Newsletter step - starting optimized extraction for: ${targetName}`)
  console.log(`Newsletter URL: ${newsletterUrl}`)

  try {
    // Step 1: Discover all URLs using Firecrawl /map (1-2 seconds)
    console.log("Step 1: Discovering URLs with Firecrawl /map...")
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: newsletterUrl,
        search: '',
        limit: 100, // Get up to 100 URLs for classification
        ignoreSitemap: false
      })
    })

    if (!mapResponse.ok) {
      throw new Error(`Firecrawl map failed: ${mapResponse.status}`)
    }

    const mapData = await mapResponse.json()
    const allUrls = mapData.links || []
    console.log(`Found ${allUrls.length} total URLs`)

    if (allUrls.length === 0) {
      return { articles: [], newsletterUrl, totalArticles: 0 }
    }

    // Step 2: Classify URLs with GPT-4.1-mini to identify newsletter issues (0.5 seconds)
    console.log("Step 2: Classifying URLs with GPT-4.1-mini...")
    const classifier = new URLClassifierAgent()
    const newsletterUrls = await classifier.classifyNewsletterUrls(allUrls, targetName)
    console.log(`Classified ${newsletterUrls.length} newsletter issue URLs`)

    if (newsletterUrls.length === 0) {
      return { articles: [], newsletterUrl, totalArticles: 0 }
    }

    // Step 3: Extract content with Jina.ai in parallel batches (2-3 seconds)
    console.log("Step 3: Extracting content with Jina.ai...")
    const articles = await extractNewslettersWithJina(newsletterUrls.slice(0, 30)) // Limit to 30 newsletters
    
    console.log(`Successfully extracted ${articles.length} newsletter issues`)
    
    return {
      articles,
      newsletterUrl,
      totalArticles: articles.length,
      method: 'optimized-firecrawl-gpt-jina'
    }

  } catch (error) {
    console.error("Optimized newsletter extraction error:", error)
    
    // Fallback to simple Firecrawl scrape of the main page
    console.log("Falling back to simple newsletter extraction...")
    return await fallbackToSimpleExtraction(newsletterUrl, targetName)
  }
}

async function extractNewslettersWithJina(urls: string[]): Promise<any[]> {
  const BATCH_SIZE = 1  // Process one URL at a time to respect 20 RPM limit
  const DELAY_BETWEEN_REQUESTS = 3100  // 3.1 seconds = ~19 requests per minute (under 20 RPM)
  const batches = chunk(urls, BATCH_SIZE)
  const articles: any[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`Processing newsletter batch ${i + 1}/${batches.length} (${batch.length} URLs)`)
    
    // Add delay between requests to respect 20 RPM limit  
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
    }
    
    const batchPromises = batch.map(async (url) => {
      return await extractSingleNewsletterWithRetry(url, 3)
    })

    const batchResults = await Promise.all(batchPromises)
    articles.push(...batchResults.filter(result => result !== null))
  }

  return articles
}

async function extractSingleNewsletterWithRetry(url: string, maxRetries: number): Promise<any | null> {
  let retryDelay = 1000  // Start with 1 second
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Accept': 'text/markdown',
          'X-Return-Format': 'markdown',
          'X-Timeout': '30'
        },
        signal: AbortSignal.timeout(30000)
        })

      if (response.status === 429) {
        // Rate limited - use exponential backoff
        console.log(`Rate limited for newsletter ${url}, attempt ${attempt + 1}/${maxRetries}, waiting ${retryDelay}ms`)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay + Math.random() * 500))
          retryDelay *= 2  // Exponential backoff
          continue
        }
        return null
      }

      if (!response.ok) {
        console.error(`Jina extraction failed for ${url}: ${response.status}`)
        return null
      }

      const content = await response.text()
      
      // Extract title from content or URL
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : extractTitleFromUrl(url)
      
      // Extract date if available
      const dateMatch = url.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})|(\w+[-_]\d{1,2}[-_]\d{4})/i)
      const publishedDate = dateMatch ? dateMatch[0] : null

      return {
        url,
        title,
        content: content.substring(0, 15000), // Limit content size for newsletters
        publishedDate,
        extractedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error extracting newsletter ${url}:`, error)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        retryDelay *= 2
      }
    }
  }
  
  return null
}

function extractTitleFromUrl(url: string): string {
  // Extract meaningful title from URL
  const urlParts = url.split('/')
  const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2]
  
  // Remove common patterns and clean up
  return lastPart
    .replace(/\.html?$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case
    || 'Newsletter Issue'
}

async function fallbackToSimpleExtraction(newsletterUrl: string, targetName: string): Promise<any> {
  try {
    // Simple scrape of the main newsletter page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: newsletterUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
        timeout: 45000
      })
    })

    if (!response.ok) {
      throw new Error(`Firecrawl scrape failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      articles: [{
        url: newsletterUrl,
        title: `${targetName} Newsletter`,
        content: data.data?.markdown || '',
        extractedAt: new Date().toISOString()
      }],
      newsletterUrl,
      totalArticles: 1,
      method: 'simple-firecrawl-fallback'
    }

  } catch (error) {
    console.error("Newsletter fallback error:", error)
    return {
      articles: [],
      newsletterUrl,
      totalArticles: 0,
      error: error instanceof Error ? error.message : 'Newsletter extraction failed'
    }
  }
}