import { NextRequest, NextResponse } from 'next/server'
import { runContentGenerationStep } from '@/lib/voice-emulator/steps/synthesis'

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, platform, topic, length } = await request.json()
    
    if (!systemPrompt || !platform || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: systemPrompt, platform, topic' },
        { status: 400 }
      )
    }
    
    const result = await runContentGenerationStep(systemPrompt, platform, topic, length)
    
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Content generation API error:', error)
    return NextResponse.json(
      { error: 'Content generation failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}