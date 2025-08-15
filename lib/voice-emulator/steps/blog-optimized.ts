import { URLClassifierAgent } from '../agents/url-classifier'

// Helper function to chunk arrays
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export async function runBlogStepOptimized(sessionId: string, context: any) {
  const { sources = {}, hints = {}, targetName } = context
  const blogUrl = sources?.blog || hints?.website
  
  if (!blogUrl) {
    console.log("No blog URL found, skipping blog extraction")
    return { articles: [], skipped: true }
  }

  console.log(`Blog step - starting optimized extraction for: ${targetName}`)
  console.log(`Blog URL: ${blogUrl}`)

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
        url: blogUrl,
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
      return { articles: [], blogUrl, totalArticles: 0 }
    }

    // Step 2: Classify URLs with GPT-4.1-mini (0.5 seconds)
    console.log("Step 2: Classifying URLs with GPT-4.1-mini...")
    const classifier = new URLClassifierAgent()
    const blogPostUrls = await classifier.classifyInChunks(allUrls, targetName)
    console.log(`Classified ${blogPostUrls.length} blog post URLs`)

    if (blogPostUrls.length === 0) {
      return { articles: [], blogUrl, totalArticles: 0 }
    }

    // Step 3: Extract content with Jina.ai in parallel batches (2-3 seconds)
    console.log("Step 3: Extracting content with Jina.ai...")
    const articles = await extractWithJina(blogPostUrls.slice(0, 50))
    
    console.log(`Successfully extracted ${articles.length} articles`)
    
    return {
      articles,
      blogUrl,
      totalArticles: articles.length,
      method: 'optimized-firecrawl-gpt-jina'
    }

  } catch (error) {
    console.error("Optimized blog extraction error:", error)
    
    // Fallback to Perplexity-based extraction
    console.log("Falling back to Perplexity extraction...")
    return await fallbackToPerplexity(blogUrl, targetName)
  }
}

async function extractWithJina(urls: string[]): Promise<any[]> {
  const BATCH_SIZE = 10
  const batches = chunk(urls, BATCH_SIZE)
  const articles: any[] = []

  for (const batch of batches) {
    const batchPromises = batch.map(async (url) => {
      try {
        const response = await fetch(`https://r.jina.ai/${url}`, {
          headers: {
            'Accept': 'text/markdown',
            'X-Return-Format': 'markdown',
            'X-Timeout': '30'
          },
          signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
          console.error(`Jina extraction failed for ${url}: ${response.status}`)
          return null
        }

        const content = await response.text()
        
        // Extract title from content or URL
        const titleMatch = content.match(/^#\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : url.split('/').pop()?.replace(/-/g, ' ') || 'Untitled'

        return {
          url,
          title,
          content: content.substring(0, 10000), // Limit content size
          extractedAt: new Date().toISOString()
        }
      } catch (error) {
        console.error(`Error extracting ${url}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    articles.push(...batchResults.filter(a => a !== null))
  }

  return articles
}

async function fallbackToPerplexity(blogUrl: string, targetName: string): Promise<any> {
  try {
    const prompt = `Find the 5 most popular or recent blog posts from ${blogUrl} by ${targetName}.
For each post provide:
1. Title
2. URL
3. Key themes/topics
4. Brief summary

Return as JSON array with these exact keys: title, url, themes, summary`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Try to parse as JSON
    try {
      const posts = JSON.parse(content)
      if (Array.isArray(posts)) {
        // Extract content for each post with Jina
        const urls = posts.map(p => p.url).filter(Boolean)
        const articles = await extractWithJina(urls)
        
        // Merge Perplexity metadata with extracted content
        return {
          articles: articles.map((article, i) => ({
            ...article,
            themes: posts[i]?.themes,
            summary: posts[i]?.summary
          })),
          blogUrl,
          totalArticles: articles.length,
          method: 'perplexity-fallback'
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Perplexity response as JSON")
    }

    return {
      articles: [],
      blogUrl,
      totalArticles: 0,
      error: 'Failed to extract blog posts'
    }

  } catch (error) {
    console.error("Perplexity fallback error:", error)
    return {
      articles: [],
      blogUrl,
      totalArticles: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}