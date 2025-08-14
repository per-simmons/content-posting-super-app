import { NextRequest, NextResponse } from 'next/server'

const JINA_API_KEY = process.env.JINA_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

interface ExtractedContent {
  title: string
  metaDescription?: string
  content: string
  wordCount: number
  hasContent: boolean
  headings?: string[]
  h2s?: string[]
  h3s?: string[]
}

async function searchWithJina(keyword: string, depth = 10): Promise<{ results: SearchResult[] }> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(keyword)}`
  
  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Accept': 'application/json',
        'X-Return-Format': 'json'
      }
    })

    if (!response.ok) {
      throw new Error(`Jina search failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Parse Jina's response format
    const results = (data.data || data.results || []).slice(0, depth).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.description || item.snippet || '',
      content: item.content || ''
    }))

    return { results }
  } catch (error) {
    console.error('Jina search error:', error)
    throw error
  }
}

async function extractContentWithJina(url: string): Promise<ExtractedContent | null> {
  const readerUrl = `https://r.jina.ai/${url}`
  
  try {
    const response = await fetch(readerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Accept': 'application/json',
        'X-Return-Format': 'json'
      }
    })

    if (!response.ok) {
      console.error(`Failed to extract content from ${url}: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    // Extract headings from content
    const headings = []
    const h2s = []
    const h3s = []
    const content = data.content || ''
    
    // Extract H2s
    const h2Regex = /^##\s+(.+)$/gm
    let match
    while ((match = h2Regex.exec(content)) !== null) {
      h2s.push(match[1].trim())
      headings.push(match[1].trim())
    }
    
    // Extract H3s
    const h3Regex = /^###\s+(.+)$/gm
    while ((match = h3Regex.exec(content)) !== null) {
      h3s.push(match[1].trim())
      headings.push(match[1].trim())
    }
    
    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length
    
    return {
      title: data.title || '',
      metaDescription: data.description || data.meta?.description || '',
      content: content.substring(0, 5000), // Limit content for OpenAI
      wordCount,
      hasContent: content.length > 100,
      headings,
      h2s,
      h3s
    }
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error)
    return null
  }
}

async function analyzeContentWithOpenAI(contents: ExtractedContent[], keyword: string) {
  try {
    const validContents = contents.filter(c => c && c.hasContent)
    
    if (validContents.length === 0) {
      return null
    }

    const prompt = `Analyze these top-ranking articles for the keyword "${keyword}" and provide insights:

${validContents.map((c, i) => `
Article ${i + 1}:
Title: ${c.title}
Word Count: ${c.wordCount}
Headings: ${c.headings?.join(', ') || 'None'}
Content Preview: ${c.content.substring(0, 500)}...
`).join('\n')}

Provide a JSON response with:
{
  "toneAndStyle": {
    "professional": 0-100,
    "casual": 0-100,
    "technical": 0-100,
    "educational": 0-100
  },
  "avgWordCount": number,
  "avgTitleLength": number,
  "dominantTone": "string",
  "topKeywords": [{"word": "string", "count": number}],
  "topTopics": [{"topic": "string", "mentions": number}],
  "contentStructure": {
    "avgH2Count": number,
    "avgH3Count": number,
    "commonSections": ["string"]
  },
  "contentGaps": ["Things competitors are missing"],
  "uniqueAngles": ["Potential differentiators"]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO content analyst. Analyze content patterns and provide structured insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    return null
  }
}

function generateRecommendations(analysis: any, keyword: string) {
  if (!analysis) {
    return {
      contentStrategy: {
        targetWordCount: 2000,
        recommendedTone: 'balanced',
        structure: 'standard blog format'
      }
    }
  }

  return {
    contentStrategy: {
      targetWordCount: Math.round(analysis.avgWordCount * 1.1), // Aim for 10% more than average
      recommendedTone: analysis.dominantTone,
      structure: `Include ${analysis.contentStructure?.avgH2Count || 5} main sections with clear headings`,
      differentiators: analysis.uniqueAngles || [],
      gaps: analysis.contentGaps || []
    },
    seoFactors: {
      titleLength: analysis.avgTitleLength,
      keywordDensity: 'Moderate (1-2%)',
      topKeywords: analysis.topKeywords || []
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      )
    }

    if (!JINA_API_KEY || !OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API keys not configured' },
        { status: 500 }
      )
    }

    // Step 1: Search with Jina
    const searchResults = await searchWithJina(keyword, 10)

    // Step 2: Extract content from top results
    const contentPromises = searchResults.results.slice(0, 5).map(result => 
      extractContentWithJina(result.url)
    )
    const extractedContents = await Promise.all(contentPromises)

    // Step 3: Analyze with OpenAI
    const analysis = await analyzeContentWithOpenAI(
      extractedContents.filter(c => c !== null) as ExtractedContent[],
      keyword
    )

    // Step 4: Generate recommendations
    const recommendations = generateRecommendations(analysis, keyword)

    // Create structured data for outline agent
    const structuredData = {
      keyword,
      commonTopics: analysis?.topTopics || [],
      gaps: analysis?.contentGaps || [],
      opportunities: analysis?.uniqueAngles || [],
      avgWordCount: analysis?.avgWordCount || 1500,
      writingStyle: analysis?.dominantTone || 'educational',
      primaryKeywords: [keyword],
      secondaryKeywords: analysis?.topKeywords?.map((k: any) => k.word) || [],
      semanticTopics: analysis?.topTopics?.map((t: any) => t.topic) || [],
      h2Sections: extractedContents
        .filter(c => c !== null)
        .flatMap(c => c?.h2s || [])
        .filter((h2, index, self) => self.indexOf(h2) === index), // unique h2s
      h3Sections: extractedContents
        .filter(c => c !== null)
        .flatMap(c => c?.h3s || [])
        .filter((h3, index, self) => self.indexOf(h3) === index) // unique h3s
    }

    // Format response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        keyword,
        totalResults: searchResults.results.length,
        topResults: searchResults.results.map((result, index) => ({
          ...result,
          extracted: extractedContents[index] || null
        })),
        contentInsights: analysis || {
          message: 'Analysis unavailable',
          toneAndStyle: {
            professional: 50,
            casual: 50,
            technical: 30,
            educational: 70
          },
          avgWordCount: 1500,
          dominantTone: 'educational'
        },
        recommendations,
        structuredData // Add structured data for outline agent
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('SERP analyzer error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}