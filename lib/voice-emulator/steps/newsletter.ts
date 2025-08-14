export async function runNewsletterStep(sessionId: string, context: any) {
  const { sources } = context
  
  if (!sources?.newsletter) {
    return { articles: [], skipped: true }
  }
  
  try {
    // Use Firecrawl to extract newsletter content with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: sources.newsletter,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000, // Increased wait time for content to load
        timeout: 45000 // Firecrawl's own timeout
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Extract articles (simplified for now)
    const articles = [{
      url: sources.newsletter,
      content: data.data?.markdown || '',
      extractedAt: new Date().toISOString()
    }]
    
    return {
      articles,
      totalWords: data.data?.markdown?.split(' ').length || 0
    }
  } catch (error) {
    console.error('Newsletter step error:', error)
    return { articles: [], error: error instanceof Error ? error.message : 'Newsletter extraction failed' }
  }
}