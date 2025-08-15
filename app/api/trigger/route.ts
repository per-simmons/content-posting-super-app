import { NextResponse } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Trigger the voice emulator pipeline with the provided data
    const result = await tasks.trigger(
      'voice-emulator-pipeline',
      body
    )
    
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