import { NextRequest, NextResponse } from "next/server"
import { VoiceEmulatorFormData } from "@/lib/voice-emulator-types"
import { startVoiceEmulatorPipeline } from "@/lib/voice-emulator/pipeline"

export async function POST(request: NextRequest) {
  try {
    const body: VoiceEmulatorFormData = await request.json()
    
    if (!body.creatorName?.trim()) {
      return NextResponse.json(
        { error: "Creator name is required" },
        { status: 400 }
      )
    }

    const session = await startVoiceEmulatorPipeline({
      creatorName: body.creatorName.trim(),
      website: body.website?.trim(),
      handle: body.handle?.trim(),
      niche: body.niche?.trim()
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error starting voice emulator pipeline:", error)
    return NextResponse.json(
      { error: "Failed to start voice emulator pipeline" },
      { status: 500 }
    )
  }
}