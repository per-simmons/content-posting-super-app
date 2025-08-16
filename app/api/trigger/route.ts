import { NextResponse } from 'next/server'
import { voiceEmulatorPipeline } from '@/jobs/voice-emulator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Generate a session ID and prepare the payload
    const sessionId = `voice-emulator-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const payload = {
      sessionId,
      targetName: body.targetName,
      hints: body.hints || {},
      sources: body.sources
    }
    
    // Trigger the voice emulator pipeline with the correct payload structure
    const result = await voiceEmulatorPipeline.trigger(payload)
    
    return NextResponse.json({
      success: true,
      runId: result.id,
      message: 'Voice emulator pipeline triggered successfully'
    })
  } catch (error) {
    console.error('Error triggering pipeline:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to trigger pipeline' 
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Trigger.dev endpoint is running'
  })
}

export const dynamic = 'force-dynamic'