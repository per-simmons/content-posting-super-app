export async function runDiscoveryStep(sessionId: string, context: any) {
  const { targetName, hints = {} } = context
  const searchQuery = targetName || context.creatorName || 'Unknown'
  
  // Return mock data if no API key or in development
  if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === 'mock') {
    console.log('No Perplexity API key, using hints as sources')
    return {
      sources: {
        newsletter: hints.newsletter || null,
        twitter: hints.twitter || null,
        linkedin: hints.linkedin || null,
        blog: hints.website || null
      },
      mockData: true,
      message: 'Using provided hints as sources (no Perplexity API key configured)'
    }
  }
  
  try {
    // Use Perplexity API to discover sources
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
            content: 'You are a research assistant helping to find online content sources for creators.'
          },
          {
            role: 'user',
            content: `Find official content sources for ${searchQuery}. Return a JSON object with these exact keys:
{
  "newsletter_url": "full URL or null",
  "twitter_handle": "@handle or null", 
  "linkedin_url": "full URL or null",
  "blog_url": "full URL or null",
  "youtube_channel": "channel URL or null",
  "substack_url": "full URL or null"
}

Also provide a brief explanation of what you found. If you cannot find a specific source, set it to null. Always provide the complete URLs, not just domain names.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Perplexity API error: ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Try to extract JSON from the response
    let sources: {
      newsletter: string | null
      twitter: string | null
      linkedin: string | null
      blog: string | null
      youtube: string | null
      substack: string | null
    } = {
      newsletter: null,
      twitter: null,
      linkedin: null,
      blog: null,
      youtube: null,
      substack: null
    }
    
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        sources = {
          newsletter: jsonData.newsletter_url || jsonData.substack_url || null,
          twitter: jsonData.twitter_handle || null,
          linkedin: jsonData.linkedin_url || null,
          blog: jsonData.blog_url || null,
          youtube: jsonData.youtube_channel || null,
          substack: jsonData.substack_url || null
        }
      }
    } catch (e) {
      // Fallback to pattern matching if JSON parsing fails
      console.log('JSON parsing failed, using pattern matching')
      sources = {
        newsletter: extractUrl(content, 'newsletter|substack'),
        twitter: extractHandle(content),
        linkedin: extractUrl(content, 'linkedin'),
        blog: extractBlogUrl(content) || hints.website,
        youtube: extractUrl(content, 'youtube'),
        substack: extractUrl(content, 'substack')
      }
    }
    
    return {
      sources,
      rawResponse: content,
      citations: data.citations || []
    }
  } catch (error) {
    console.error('Discovery step error:', error)
    // Return empty sources but don't fail the pipeline
    return {
      sources: {},
      error: error instanceof Error ? error.message : 'Discovery failed'
    }
  }
}

function extractUrl(text: string, pattern: string): string | null {
  const regex = new RegExp(`(https?://[^\\s\\)\\]]+).*${pattern}`, 'i')
  const match = text.match(regex)
  return match ? match[1] : null
}

function extractBlogUrl(text: string): string | null {
  // Look for patterns like "Blog/Website URL: https://..."
  const patterns = [
    /Blog\/Website URL:\s*(https?:\/\/[^\s\)\[]+)/i,
    /official website.*?(https?:\/\/[^\s\)\[]+)/i,
    /website.*?(https?:\/\/[^\s\)\[]+)/i,
    /(https?:\/\/paulgraham\.com)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Remove citation markers like [1] from the URL
      return match[1].replace(/\[\d+\]$/, '')
    }
  }
  return null
}

function extractHandle(text: string): string | null {
  // Look for Twitter/X handles in various formats
  const patterns = [
    /Twitter\/X handle:\s*@?(\w+)/i,
    /X handle:\s*@?(\w+)/i,
    /Twitter:\s*@?(\w+)/i,
    /@(\w+)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return `@${match[1]}`
  }
  return null
}