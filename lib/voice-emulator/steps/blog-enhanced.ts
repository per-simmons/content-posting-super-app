export async function runEnhancedBlogStep(sessionId: string, context: any) {
  const { sources, creatorName } = context
  const blogUrl = sources?.blog || context.hints?.website
  
  if (!blogUrl) {
    return { articles: [], skipped: true, reason: 'No blog URL found' }
  }
  
  console.log(`Starting enhanced blog extraction for ${blogUrl}`)
  
  // Route 1: Use Firecrawl /map to discover blog posts
  const route1Result = await extractBlogPostsViaMap(blogUrl, creatorName)
  
  // Route 2: Use Perplexity to find popular posts
  const route2Result = await extractBlogPostsViaPerplexity(blogUrl, creatorName)
  
  // Combine and deduplicate results
  const allArticles = [...route1Result.articles, ...route2Result.articles]
  const uniqueArticles = deduplicateArticles(allArticles)
  
  return {
    articles: uniqueArticles,
    totalArticles: uniqueArticles.length,
    route1Count: route1Result.articles.length,
    route2Count: route2Result.articles.length,
    blogUrl,
    extractionMethods: {
      firecrawlMap: route1Result.success,
      perplexityPopular: route2Result.success
    }
  }
}

// Route 1: Use Firecrawl /map to get site structure and extract blog posts
async function extractBlogPostsViaMap(blogUrl: string, creatorName: string) {
  try {
    if (!process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY === 'mock') {
      console.log('No Firecrawl API key, using mock data')
      return {
        success: false,
        articles: [],
        error: 'No Firecrawl API key'
      }
    }
    
    console.log('Route 1: Mapping site structure with Firecrawl...')
    
    // Step 1: Map the site to discover URLs with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout for mapping
    
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: blogUrl,
        limit: 100, // Get up to 100 URLs
        ignoreSitemap: false // Use sitemap if available
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!mapResponse.ok) {
      throw new Error(`Firecrawl map error: ${mapResponse.statusText}`)
    }
    
    const mapData = await mapResponse.json()
    // Firecrawl returns {status: "success", links: [...]}
    const allUrls = mapData.links || []
    
    console.log(`Found ${allUrls.length} URLs on the site`)
    
    // Filter for blog post URLs (common patterns)
    const blogPatterns = [
      /\/blog\//i,
      /\/post\//i,
      /\/article\//i,
      /\/\d{4}\/\d{2}\//,  // Date-based URLs like /2024/01/
      /\/essays?\//i,
      /\/writing\//i,
      /\/podcast\//i  // For Tim Ferriss specifically
    ]
    
    const blogUrls = allUrls.filter((url: string) => {
      // Skip common non-article pages
      if (url.includes('/tag/') || 
          url.includes('/category/') || 
          url.includes('/page/') ||
          url.includes('/author/') ||
          url.includes('#') ||
          url.endsWith('/feed/') ||
          url.endsWith('.xml')) {
        return false
      }
      
      // Check if URL matches any blog pattern
      return blogPatterns.some(pattern => pattern.test(url))
    }).slice(0, 10) // Take first 10 blog posts
    
    console.log(`Filtered to ${blogUrls.length} blog post URLs`)
    
    if (blogUrls.length === 0) {
      // Fallback: just take some URLs that aren't obviously navigation
      const fallbackUrls = allUrls
        .filter((url: string) => !url.includes('#') && url !== blogUrl)
        .slice(0, 5)
      blogUrls.push(...fallbackUrls)
    }
    
    // Step 2: Extract content from the discovered blog posts
    const articles = []
    for (const url of blogUrls.slice(0, 5)) { // Extract first 5 for speed
      try {
        console.log(`Extracting content from: ${url}`)
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 2000
          })
        })
        
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json()
          const markdown = scrapeData.data?.markdown || ''
          
          // Extract title from markdown (usually first # heading)
          const titleMatch = markdown.match(/^#\s+(.+)$/m)
          const title = titleMatch ? titleMatch[1] : 'Untitled'
          
          articles.push({
            url,
            title,
            content: markdown.substring(0, 5000), // Limit content length
            extractedAt: new Date().toISOString(),
            source: 'firecrawl-map'
          })
        }
      } catch (error) {
        console.error(`Failed to extract ${url}:`, error)
      }
    }
    
    return {
      success: true,
      articles
    }
    
  } catch (error) {
    console.error('Route 1 (Firecrawl map) error:', error)
    return {
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Route 2: Use Perplexity to find popular/important blog posts
async function extractBlogPostsViaPerplexity(blogUrl: string, creatorName: string) {
  try {
    if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === 'mock') {
      console.log('No Perplexity API key, skipping Route 2')
      return {
        success: false,
        articles: [],
        error: 'No Perplexity API key'
      }
    }
    
    console.log('Route 2: Finding popular posts with Perplexity...')
    
    // Ask Perplexity for the most popular/important blog posts
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
            role: 'system',
            content: 'You are a research assistant helping to find popular and important blog posts.'
          },
          {
            role: 'user',
            content: `Find the 10 most popular, influential, or important blog posts/articles by ${creatorName} from their blog at ${blogUrl}. 
            
Return a JSON array with this exact format:
[
  {
    "title": "exact title of the article",
    "url": "full URL to the article",
    "description": "brief description of why this is popular/important",
    "topic": "main topic or theme"
  }
]

Focus on posts that are:
- Most shared or referenced
- Fundamental to their philosophy
- Breakthrough ideas
- Most practical/actionable
- Defining pieces of their work`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    })
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Extract JSON from response
    let popularPosts = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        popularPosts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse Perplexity JSON response')
    }
    
    console.log(`Perplexity found ${popularPosts.length} popular posts`)
    
    // Now extract content from these popular posts using Firecrawl
    const articles = []
    if (process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'mock') {
      for (const post of popularPosts.slice(0, 5)) { // Extract first 5
        try {
          console.log(`Extracting popular post: ${post.title}`)
          
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: post.url,
              formats: ['markdown'],
              onlyMainContent: true,
              waitFor: 2000
            })
          })
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json()
            const markdown = scrapeData.data?.markdown || ''
            
            articles.push({
              url: post.url,
              title: post.title,
              content: markdown.substring(0, 5000), // Limit content length
              description: post.description,
              topic: post.topic,
              extractedAt: new Date().toISOString(),
              source: 'perplexity-popular'
            })
          }
        } catch (error) {
          console.error(`Failed to extract ${post.url}:`, error)
        }
      }
    } else {
      // If no Firecrawl, just return the metadata
      articles.push(...popularPosts.map((post: any) => ({
        url: post.url,
        title: post.title,
        content: `[Content extraction requires Firecrawl API]\n\n${post.description}`,
        description: post.description,
        topic: post.topic,
        extractedAt: new Date().toISOString(),
        source: 'perplexity-metadata-only'
      })))
    }
    
    return {
      success: true,
      articles
    }
    
  } catch (error) {
    console.error('Route 2 (Perplexity popular) error:', error)
    return {
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Deduplicate articles based on URL
function deduplicateArticles(articles: any[]) {
  const seen = new Set()
  const unique = []
  
  for (const article of articles) {
    // Normalize URL for comparison
    const normalizedUrl = article.url
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/^https?:\/\//, '') // Remove protocol
      .toLowerCase()
    
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl)
      unique.push(article)
    }
  }
  
  // Sort by source priority (popular posts first)
  return unique.sort((a, b) => {
    if (a.source === 'perplexity-popular' && b.source !== 'perplexity-popular') return -1
    if (b.source === 'perplexity-popular' && a.source !== 'perplexity-popular') return 1
    return 0
  })
}