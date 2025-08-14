import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface StrategyRequest {
  keyword: string
  serpAnalysis: any
}

async function generateStrategy(keyword: string, serpAnalysis: any) {
  try {
    const prompt = `You are a content strategist creating a unique angle for an SEO article.

Target Keyword: ${keyword}

SERP Analysis Summary:
- Average word count: ${serpAnalysis?.contentInsights?.avgWordCount || 1500}
- Dominant tone: ${serpAnalysis?.contentInsights?.dominantTone || 'educational'}
- Top topics: ${serpAnalysis?.contentInsights?.topTopics?.map((t: any) => t.topic).join(', ') || 'general information'}
- Content gaps identified: ${serpAnalysis?.recommendations?.contentStrategy?.gaps?.join(', ') || 'none identified'}
- Top-ranking content patterns: ${JSON.stringify(serpAnalysis?.contentInsights?.contentStructure || {})}

Based on this analysis, create a distinct content strategy that will help this article stand out.

Provide a JSON response with:
{
  "angle": "A 1-2 sentence description of the unique editorial angle",
  "positioning": "One-line positioning statement to guide the writing",
  "differentiation": ["3-4 specific ways this content will differ from competitors"],
  "targetAudience": "Specific audience segment this targets",
  "contentApproach": "The writing style and approach",
  "uniqueElements": ["4-5 unique content elements to include"],
  "missedOpportunities": ["3-4 gaps in competitor content to fill"],
  "structure": {
    "intro": "How to open the article",
    "mainSections": ["List of main sections"],
    "callouts": ["Special elements like boxes, lists, examples"]
  }
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
            content: 'You are an expert content strategist specializing in SEO and audience engagement. Your role is to analyze SERP results, competitive content, and provided keywords to create unique, defensible content strategies that will help articles rank highly and deliver exceptional value to readers. Focus on finding an original angle that differentiates from existing top-ranking content, aligns with search intent, and supports the broader brand positioning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    console.error('Strategy generation error:', error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword, serpAnalysis } = await req.json()

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      )
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Generate strategy based on SERP analysis
    const strategy = await generateStrategy(keyword, serpAnalysis)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: strategy
    })
  } catch (error) {
    console.error('Strategy agent error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}