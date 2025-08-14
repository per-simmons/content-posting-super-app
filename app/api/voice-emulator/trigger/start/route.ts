import { NextRequest, NextResponse } from "next/server"
import { client } from "@/trigger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetName, hints, sources } = body
    
    if (!targetName) {
      return NextResponse.json(
        { success: false, error: "targetName is required" },
        { status: 400 }
      )
    }
    
    const sessionId = `voice-emulator-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Send event to trigger.dev
    const event = await client.sendEvent({
      name: "voice.emulator.start",
      payload: {
        sessionId,
        targetName,
        hints,
        sources,
      },
    })
    
    return NextResponse.json({
      success: true,
      sessionId,
      eventId: event.id,
      message: "Voice emulation pipeline started via trigger.dev",
    })
  } catch (error) {
    console.error("Error starting voice emulator pipeline:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to start pipeline" 
      },
      { status: 500 }
    )
  }
}