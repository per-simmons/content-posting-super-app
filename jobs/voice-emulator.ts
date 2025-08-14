import { client } from "@/trigger"
import { eventTrigger } from "@trigger.dev/nextjs"
import { z } from "zod"
import { runDiscoveryStep } from "@/lib/voice-emulator/steps/discovery"
import { runNewsletterStep } from "@/lib/voice-emulator/steps/newsletter"
import { runTwitterStep } from "@/lib/voice-emulator/steps/twitter"
import { runLinkedInStep } from "@/lib/voice-emulator/steps/linkedin"
import { runBlogStep } from "@/lib/voice-emulator/steps/blog"
import { runConsolidationStep } from "@/lib/voice-emulator/steps/consolidation"
import { runAnalysisStep } from "@/lib/voice-emulator/steps/analysis"
import { runEmulationStep } from "@/lib/voice-emulator/steps/emulation"

client.defineJob({
  id: "voice-emulator-pipeline",
  name: "Voice Emulator Pipeline",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "voice.emulator.start",
    schema: z.object({
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
    }),
  }),
  run: async (payload, io, ctx) => {
    const { sessionId, targetName, hints, sources } = payload
    
    await io.logger.info("Starting Voice Emulator Pipeline", { sessionId, targetName })
    
    // Discovery step
    const discoveryResult = await io.runTask("discovery", async () => {
      return await runDiscoveryStep(sessionId, { targetName, hints, sources })
    })
    
    const context = {
      targetName,
      hints,
      sources: discoveryResult.sources || sources,
      creatorName: targetName,
    }
    
    // Run content collection steps in parallel
    const [newsletterResult, twitterResult, linkedinResult, blogResult] = await Promise.all([
      io.runTask("newsletter", async () => {
        await io.logger.info("Starting newsletter step")
        return await runNewsletterStep(sessionId, context)
      }),
      io.runTask("twitter", async () => {
        await io.logger.info("Starting Twitter step")
        return await runTwitterStep(sessionId, context)
      }),
      io.runTask("linkedin", async () => {
        await io.logger.info("Starting LinkedIn step")
        return await runLinkedInStep(sessionId, context)
      }),
      io.runTask("blog", async () => {
        await io.logger.info("Starting blog step")
        return await runBlogStep(sessionId, context)
      }),
    ])
    
    // Consolidation step
    const consolidationResult = await io.runTask("consolidation", async () => {
      await io.logger.info("Starting consolidation step")
      return await runConsolidationStep(sessionId, {
        ...context,
        newsletter: newsletterResult,
        twitter: twitterResult,
        linkedin: linkedinResult,
        blog: blogResult,
      })
    })
    
    // Analysis step
    const analysisResult = await io.runTask("analysis", async () => {
      await io.logger.info("Starting analysis step")
      return await runAnalysisStep(sessionId, {
        ...context,
        consolidation: consolidationResult,
      })
    })
    
    // Emulation step
    const emulationResult = await io.runTask("emulation", async () => {
      await io.logger.info("Starting emulation step")
      return await runEmulationStep(sessionId, {
        ...context,
        analysis: analysisResult,
      })
    })
    
    await io.logger.info("Voice Emulator Pipeline completed", { sessionId })
    
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
        analysis: analysisResult,
        emulation: emulationResult,
      },
    }
  },
})