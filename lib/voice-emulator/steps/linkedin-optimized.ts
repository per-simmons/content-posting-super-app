export async function runLinkedInStep(sessionId: string, context: any) {
  const { sources, creatorName } = context
  const linkedinUrl = sources?.linkedin
  
  if (!linkedinUrl) {
    console.log("No LinkedIn URL found, skipping LinkedIn extraction")
    return { posts: [], skipped: true }
  }
  
  // Check if Apify API key is available
  if (!process.env.APIFY_API_KEY || process.env.APIFY_API_KEY === 'mock') {
    console.log('No Apify API key, returning mock data')
    return {
      posts: [],
      linkedinUrl,
      totalPosts: 0,
      mockData: true,
      error: 'LinkedIn scraping requires Apify API key'
    }
  }
  
  try {
    // Extract username from LinkedIn URL
    // https://www.linkedin.com/in/johndoe -> johndoe
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/)
    if (!usernameMatch) {
      throw new Error('Invalid LinkedIn URL format')
    }
    const username = usernameMatch[1]
    
    console.log(`LinkedIn step - extracting posts for: ${username}`)
    
    // Use Apify LinkedIn scraper actor
    const LINKEDIN_ACTOR_ID = 'apimaestro/linkedin-profile-posts'
    
    const response = await fetch(`https://api.apify.com/v2/acts/${LINKEDIN_ACTOR_ID}/runs?token=${process.env.APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profileUrl: linkedinUrl,
        username: username,
        maxPosts: 50, // Get up to 50 posts
        sortBy: 'recent', // Get most recent posts
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      })
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('Apify LinkedIn scraper requires paid plan')
        return {
          posts: [],
          linkedinUrl,
          totalPosts: 0,
          error: 'LinkedIn scraping requires Apify paid plan',
          requiresPaidPlan: true
        }
      }
      throw new Error(`Apify API error: ${response.statusText}`)
    }
    
    const run = await response.json()
    
    // Wait for the actor to complete (with timeout)
    const maxWaitTime = 60000 // 60 seconds
    const startTime = Date.now()
    let result = null
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // Check every 3 seconds
      
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
      throw new Error('Apify actor timed out')
    }
    
    // Process LinkedIn posts based on the actual Apify output structure
    const posts = processLinkedInPosts(result, creatorName)
    
    return {
      posts,
      linkedinUrl,
      totalPosts: posts.length,
      method: 'apify-linkedin-scraper'
    }
    
  } catch (error) {
    console.error('LinkedIn step error:', error)
    return {
      posts: [],
      linkedinUrl,
      error: error instanceof Error ? error.message : 'LinkedIn scraping failed'
    }
  }
}

function processLinkedInPosts(apiResponse: any, creatorName: string): any[] {
  // Handle the actual Apify response structure
  const rawPosts = apiResponse?.data?.posts || apiResponse?.posts || apiResponse || []
  
  if (!Array.isArray(rawPosts)) {
    console.error('Unexpected LinkedIn API response format')
    return []
  }
  
  // Process and calculate engagement scores
  const processedPosts = rawPosts
    .filter((post: any) => {
      // Filter out reshared posts unless they have original commentary
      if (post.post_type === 'quote' && post.text && post.text.length > 50) {
        return true // Keep reshares with substantial commentary
      }
      return post.post_type === 'regular' // Keep regular posts
    })
    .map((post: any) => {
      // Calculate engagement score
      // Formula: reactions + (comments × 2) + (reposts × 3)
      // Comments weighted 2x because they show deeper engagement
      // Reposts weighted 3x because they amplify reach
      const stats = post.stats || {}
      const engagementScore = (stats.total_reactions || 0) + 
                             ((stats.comments || 0) * 2) + 
                             ((stats.reposts || 0) * 3)
      
      return {
        id: post.urn || post.full_urn,
        text: post.text || '',
        engagement: engagementScore,
        engagementDetails: {
          reactions: stats.total_reactions || 0,
          comments: stats.comments || 0,
          reposts: stats.reposts || 0,
          breakdown: {
            like: stats.like || 0,
            support: stats.support || 0,
            love: stats.love || 0,
            insight: stats.insight || 0,
            celebrate: stats.celebrate || 0
          }
        },
        postedAt: post.posted_at?.timestamp || post.posted_at?.date || new Date().toISOString(),
        url: post.url,
        postType: post.post_type,
        author: creatorName,
        hasMedia: !!post.media,
        hasArticle: !!post.article,
        hasDocument: !!post.document
      }
    })
    .sort((a: any, b: any) => b.engagement - a.engagement) // Sort by engagement
    .slice(0, 20) // Get top 20 most engaged posts
  
  return processedPosts
}

export { runLinkedInStep as runLinkedInStepOptimized }