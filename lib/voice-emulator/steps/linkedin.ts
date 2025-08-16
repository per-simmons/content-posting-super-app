export async function runLinkedInStep(sessionId: string, context: any) {
  const { sources } = context
  
  if (!sources?.linkedin) {
    return { posts: [], skipped: true }
  }
  
  // Check if Apify API key is available
  if (!process.env.APIFY_API_KEY || process.env.APIFY_API_KEY === 'mock') {
    console.log('No Apify API key, returning mock data')
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      posts: [
        {
          id: 'mock-li-1',
          text: 'This is a mock LinkedIn post for development',
          engagement: { likes: 50, comments: 10, shares: 5 },
          createdAt: new Date().toISOString()
        }
      ],
      profileUrl: sources.linkedin,
      totalPosts: 1,
      mockData: true
    }
  }
  
  try {
    // Extract profile URL or username
    const profileUrl = sources.linkedin
    
    // Use apimaestro/linkedin-profile-posts actor  
    const response = await fetch(`https://api.apify.com/v2/acts/apimaestro~linkedin-profile-posts/runs?token=${process.env.APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: profileUrl, // The LinkedIn profile URL
        limit: 1, // Get 1 post for testing
        page_number: 1,
        timeoutSecs: 1800  // 30 minutes timeout for paid tier
      })
    })
    
    if (!response.ok) {
      // Check if this is a free plan limitation (403 Forbidden)
      if (response.status === 403) {
        console.log('Apify LinkedIn scraper requires paid plan - returning placeholder data')
        return {
          posts: [],
          profileUrl,
          totalPosts: 0,
          error: 'LinkedIn scraping requires Apify paid plan. The apimaestro~linkedin-profile-posts actor is not available on free tier.',
          requiresPaidPlan: true
        }
      }
      throw new Error(`Apify API error: ${response.statusText}`)
    }
    
    const run = await response.json()
    
    // Wait for the actor to complete (with timeout)
    const maxWaitTime = 1860000 // 31 minutes - matches Apify actor timeout of 30 minutes
    const startTime = Date.now()
    let result = null
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 4000)) // Check every 4 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/${run.actId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.APIFY_API_KEY}`
        }
      })
      
      const status = await statusResponse.json()
      
      if (status.status === 'SUCCEEDED') {
        // Get the results
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${status.defaultDatasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${process.env.APIFY_API_KEY}`
          }
        })
        
        result = await datasetResponse.json()
        break
      } else if (status.status === 'FAILED' || status.status === 'ABORTED') {
        throw new Error(`Apify actor failed: ${status.status}`)
      }
    }
    
    if (!result) {
      throw new Error('Apify actor timed out or returned no data')
    }
    
    // Extract and process posts with engagement metrics
    // NOTE: Apify actors don't have built-in parameters for sorting by popularity
    // We scrape all available posts then sort client-side by engagement metrics
    // Engagement score formula: likes + (comments × 2) + (shares × 3)
    const posts = (result || [])
      .map((post: any) => ({
        id: post.id || post.postId || post.url || `li-${Date.now()}-${Math.random()}`,
        text: post.text || post.content || post.postText || '',
        engagement: {
          likes: post.likes || post.likeCount || post.reactions || 0,
          comments: post.comments || post.commentCount || post.numComments || 0,
          shares: post.shares || post.shareCount || post.reposts || 0
        },
        postedAt: post.postedAt || post.publishedAt || post.createdAt || post.date
      }))
      .filter((post: any) => post.text && post.text.length > 0)
      .sort((a: any, b: any) => {
        // Sort by combined engagement (shares weighted 3x, comments 2x)
        const engA = a.engagement.likes + (a.engagement.comments * 2) + (a.engagement.shares * 3)
        const engB = b.engagement.likes + (b.engagement.comments * 2) + (b.engagement.shares * 3)
        return engB - engA
      })
      .slice(0, 25) // Get top 25 most engaged posts
    
    return {
      posts,
      profileUrl,
      profileName: result[0]?.userName || result[0]?.profileName || 'Unknown',
      totalPosts: posts.length,
      totalScraped: result.length
    }
  } catch (error) {
    console.error('LinkedIn step error:', error)
    // Return minimal data on error
    return {
      posts: [],
      profileUrl: sources.linkedin,
      error: error instanceof Error ? error.message : 'LinkedIn scraping failed'
    }
  }
}