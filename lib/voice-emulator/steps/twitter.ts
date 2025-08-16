export async function runTwitterStep(sessionId: string, context: any) {
  const { sources, creatorName } = context
  const handle = sources?.twitter || context.hints?.handle
  
  if (!handle) {
    return { tweets: [], skipped: true }
  }
  
  // Check if Apify API key is available
  if (!process.env.APIFY_API_KEY || process.env.APIFY_API_KEY === 'mock') {
    console.log('No Apify API key, returning mock data')
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      tweets: [
        {
          id: 'mock-1',
          text: 'This is a mock tweet for development',
          engagement: { likes: 100, retweets: 20, replies: 5 },
          createdAt: new Date().toISOString()
        }
      ],
      handle,
      totalTweets: 1,
      mockData: true
    }
  }
  
  try {
    // Clean handle (remove @ if present)
    const cleanHandle = handle.replace('@', '')
    
    // Use kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest
    const response = await fetch(`https://api.apify.com/v2/acts/kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest/runs?token=${process.env.APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchTerms: [`from:${cleanHandle}`],
        lang: "en",
        tweetLanguage: "en", 
        maxItems: 1,
        addUserInfo: true,
        onlyVerifiedUsers: false,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        },
        timeoutSecs: 1200  // 20 minutes timeout for paid tier
      })
    })
    
    if (!response.ok) {
      // Check if this is a free plan limitation (403 Forbidden)
      if (response.status === 403) {
        console.log('Apify Twitter scraper requires paid plan - returning placeholder data')
        return {
          tweets: [],
          handle,
          totalTweets: 0,
          error: 'Twitter scraping requires Apify paid plan. The kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest actor is not available on free tier.',
          requiresPaidPlan: true
        }
      }
      throw new Error(`Apify API error: ${response.statusText}`)
    }
    
    const run = await response.json()
    
    // Wait for the actor to complete (with timeout)
    const maxWaitTime = 1260000 // 21 minutes - matches Apify actor timeout of 20 minutes
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
    
    // Process and filter tweets by engagement
    // NOTE: Apify actors don't have built-in parameters for sorting by popularity
    // We scrape all available tweets then sort client-side by engagement metrics
    // Engagement score formula: likes + (retweets × 2) + replies
    const tweets = (result || [])
      .map((tweet: any) => ({
        id: tweet.id || tweet.tweetId,
        text: tweet.text || tweet.full_text || tweet.tweetText,
        engagement: {
          likes: tweet.likeCount || tweet.favorite_count || tweet.likes || 0,
          retweets: tweet.retweetCount || tweet.retweet_count || tweet.retweets || 0,
          replies: tweet.replyCount || tweet.reply_count || tweet.replies || 0
        },
        createdAt: tweet.created_at || tweet.createdAt || tweet.tweetCreatedAt
      }))
      .sort((a: any, b: any) => {
        // Sort by combined engagement (retweets weighted 2x)
        const engA = a.engagement.likes + (a.engagement.retweets * 2) + a.engagement.replies
        const engB = b.engagement.likes + (b.engagement.retweets * 2) + b.engagement.replies
        return engB - engA
      })
      .slice(0, 50) // Get top 50 most engaged tweets
    
    return {
      tweets,
      handle,
      totalTweets: tweets.length,
      totalScraped: result.length
    }
  } catch (error) {
    console.error('Twitter step error:', error)
    // Return minimal mock data on error
    return {
      tweets: [],
      handle,
      error: error instanceof Error ? error.message : 'Twitter scraping failed'
    }
  }
}