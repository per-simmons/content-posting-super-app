export async function runBlogStep(sessionId: string, context: any) {
  const { sources = {}, hints = {} } = context
  const blogUrl = sources?.blog || hints?.website
  
  if (!blogUrl) {
    return { articles: [], skipped: true }
  }
  
  // For now, return mock data - Firecrawl crawl would go here
  await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
  
  return {
    articles: [
      {
        url: blogUrl,
        title: 'Mock Blog Post',
        content: 'This is mock blog content for development purposes.',
        publishedAt: new Date().toISOString()
      }
    ],
    blogUrl,
    totalArticles: 1
  }
}