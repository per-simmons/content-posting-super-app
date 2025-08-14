import { NextRequest, NextResponse } from "next/server"
import { runIntakeStep } from "@/lib/voice-emulator/steps/intake"
import { runDiscoveryStep } from "@/lib/voice-emulator/steps/discovery"
import { runNewsletterStep } from "@/lib/voice-emulator/steps/newsletter"
import { runTwitterStep } from "@/lib/voice-emulator/steps/twitter"
import { runLinkedInStep } from "@/lib/voice-emulator/steps/linkedin"
import { runBlogStep } from "@/lib/voice-emulator/steps/blog"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetName, hints = {} } = body
    
    if (!targetName) {
      return NextResponse.json(
        { error: "targetName is required" },
        { status: 400 }
      )
    }

    const sessionId = `test-${Date.now()}`
    let context: any = { targetName, hints }
    const results: any = {}
    
    // Run intake step
    try {
      results.intake = await runIntakeStep(sessionId, context)
      context = { ...context, ...results.intake }
    } catch (error) {
      results.intake = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    // Run discovery step
    try {
      results.discovery = await runDiscoveryStep(sessionId, context)
      context = { ...context, ...results.discovery }
    } catch (error) {
      results.discovery = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    // Run newsletter step
    try {
      results.newsletter = await runNewsletterStep(sessionId, context)
      context = { ...context, ...results.newsletter }
    } catch (error) {
      results.newsletter = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    // Run twitter step
    try {
      results.twitter = await runTwitterStep(sessionId, context)
      context = { ...context, ...results.twitter }
    } catch (error) {
      results.twitter = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    // Run linkedin step
    try {
      results.linkedin = await runLinkedInStep(sessionId, context)
      context = { ...context, ...results.linkedin }
    } catch (error) {
      results.linkedin = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    // Run blog step
    try {
      results.blog = await runBlogStep(sessionId, context)
      context = { ...context, ...results.blog }
    } catch (error) {
      results.blog = { error: error instanceof Error ? error.message : "Failed" }
    }
    
    return NextResponse.json({
      sessionId,
      success: true,
      results,
      context,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}