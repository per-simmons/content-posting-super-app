import { NextRequest, NextResponse } from "next/server"
import { getVoiceEmulatorSession } from "@/lib/voice-emulator/session-store"

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getVoiceEmulatorSession(params.sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error fetching session status:", error)
    return NextResponse.json(
      { error: "Failed to fetch session status" },
      { status: 500 }
    )
  }
}