import { NextResponse } from 'next/server'
import { voiceRetrieval } from '@/lib/voice-emulator/steps/retrieval'

export async function POST(request: Request) {
  try {
    const { query, creatorName, options = {} } = await request.json()
    
    if (!query || !creatorName) {
      return NextResponse.json(
        { error: 'Query and creatorName are required' },
        { status: 400 }
      )
    }

    const results = await voiceRetrieval.searchSimilarContent(query, creatorName, {
      limit: options.limit || 10,
      semanticWeight: options.semanticWeight || 0.7,
      lexicalWeight: options.lexicalWeight || 0.3,
      contentTypes: options.contentTypes || []
    })

    return NextResponse.json({
      success: true,
      results,
      count: results.length
    })
  } catch (error) {
    console.error('Voice search error:', error)
    return NextResponse.json(
      { error: 'Failed to search voice content' },
      { status: 500 }
    )
  }
}