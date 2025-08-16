import { task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { runDiscoveryStep } from "@/lib/voice-emulator/steps/discovery"
import { runNewsletterStepOptimized } from "@/lib/voice-emulator/steps/newsletter-optimized"
import { runTwitterStep } from "@/lib/voice-emulator/steps/twitter"
import { runLinkedInStepOptimized } from "@/lib/voice-emulator/steps/linkedin-optimized"
import { runBlogStepOptimized } from "@/lib/voice-emulator/steps/blog-optimized"
import { runConsolidationStep } from "@/lib/voice-emulator/steps/consolidation"
import { runVectorizationStepImproved } from "@/lib/voice-emulator/steps/vectorization-improved"
import { runAnalysisStep } from "@/lib/voice-emulator/steps/analysis"
// Emulation step not yet implemented
// import { runEmulationStep } from "@/lib/voice-emulator/steps/emulation"

// Define the payload schema
const VoiceEmulatorPayload = z.object({
  sessionId: z.string(),
  targetName: z.string(),
  hints: z.any().optional(),
  sources: z.object({
    newsletter: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    blog: z.string().optional(),
    youtube: z.string().optional(),
    substack: z.string().optional(),
  }).optional(),
})

type VoiceEmulatorPayloadType = z.infer<typeof VoiceEmulatorPayload>

export const voiceEmulatorPipeline = task({
  id: "voice-emulator-pipeline",
  run: async (payload: VoiceEmulatorPayloadType, { ctx }) => {
    const { sessionId, targetName, hints, sources } = payload
    
    console.log("Starting Voice Emulator Pipeline", { sessionId, targetName })
    
    // Discovery step
    const discoveryResult = await runDiscoveryStep(sessionId, { targetName, hints, sources })
    
    const context = {
      targetName,
      hints,
      sources: discoveryResult.sources || sources,
      creatorName: targetName,
    }
    
    // Run content collection steps in parallel
    const [newsletterResult, twitterResult, linkedinResult, blogResult] = await Promise.all([
      (async () => {
        console.log("Starting newsletter step (optimized)")
        return await runNewsletterStepOptimized(sessionId, context)
      })(),
      (async () => {
        console.log("Starting Twitter step")
        return await runTwitterStep(sessionId, context)
      })(),
      (async () => {
        console.log("Starting LinkedIn step")
        return await runLinkedInStepOptimized(sessionId, context)
      })(),
      (async () => {
        console.log("Starting blog step (optimized)")
        return await runBlogStepOptimized(sessionId, context)
      })(),
    ])
    
    // Consolidation step
    const consolidationResult = await (async () => {
      console.log("Starting consolidation step")
      return await runConsolidationStep({ id: sessionId, creatorName: targetName } as any, {
        ...context,
        newsletterContent: newsletterResult?.articles || [],
        tweets: twitterResult?.tweets || [],
        linkedinPosts: linkedinResult?.posts || [],
        blogArticles: blogResult?.articles || [],
      })
    })()
    
    // Vectorization step with contextual retrieval
    const vectorizationResult = await (async () => {
      console.log("Starting vectorization step (improved with contextual retrieval)")
      return await runVectorizationStepImproved({ id: sessionId, creatorName: targetName } as any, consolidationResult)
    })()
    
    // Analysis step
    const analysisResult = await (async () => {
      console.log("Starting analysis step")
      return await runAnalysisStep(sessionId, {
        ...context,
        consolidation: consolidationResult,
        vectorization: vectorizationResult,
      })
    })()
    
    // Emulation step - skip for now as not implemented
    const emulationResult = null
    /*
    const emulationResult = await (async () => {
      console.log("Starting emulation step")
      return await runEmulationStep(sessionId, {
        ...context,
        analysis: analysisResult,
      })
    })()
    */
    
    console.log("Voice Emulator Pipeline completed", { sessionId })
    
    return {
      sessionId,
      targetName,
      outputs: {
        discovery: discoveryResult,
        newsletter: newsletterResult,
        twitter: twitterResult,
        linkedin: linkedinResult,
        blog: blogResult,
        consolidation: consolidationResult,
        vectorization: vectorizationResult,
        analysis: analysisResult,
        emulation: emulationResult,
      },
    }
  },
})