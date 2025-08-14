import { VoiceEmulatorFormData, VoiceEmulatorSession, PipelineStep } from "@/lib/voice-emulator-types"
import { 
  createVoiceEmulatorSession, 
  updateSessionStep,
  updateVoiceEmulatorSession 
} from "./session-store"

// Pipeline step implementations
import { runIntakeStep } from "./steps/intake"
import { runDiscoveryStep } from "./steps/discovery"
import { runNewsletterStep } from "./steps/newsletter"
import { runTwitterStep } from "./steps/twitter"
import { runLinkedInStep } from "./steps/linkedin"
import { runBlogStep } from "./steps/blog"
import { runConsolidationStep } from "./steps/consolidation"
import { runVectorizationStep } from "./steps/vectorization"
import { runRetrievalStep } from "./steps/retrieval"
import { runAnalysisStep } from "./steps/analysis"
import { runSynthesisStep } from "./steps/synthesis"

const PIPELINE_STEPS: PipelineStep[] = [
  "intake",
  "discovery",
  "newsletter",
  "twitter",
  "linkedin",
  "blog",
  "consolidation",
  "vectorization",
  "retrieval",
  "analysis",
  "synthesis"
]

export async function startVoiceEmulatorPipeline(
  formData: VoiceEmulatorFormData
): Promise<VoiceEmulatorSession> {
  // Create new session
  const session = await createVoiceEmulatorSession(
    formData.creatorName,
    {
      website: formData.website,
      handle: formData.handle,
      niche: formData.niche
    }
  )
  
  // Start pipeline execution in background
  executePipeline(session.id).catch(error => {
    console.error("Pipeline execution failed:", error)
    updateSessionStep(session.id, "intake", "error", {
      error: error.message || "Pipeline execution failed"
    })
  })
  
  return session
}

async function executePipeline(sessionId: string) {
  console.log(`Starting pipeline execution for session ${sessionId}`)
  
  let context: any = {}
  
  for (const step of PIPELINE_STEPS) {
    try {
      // Update step status to running
      await updateSessionStep(sessionId, step, "running")
      
      // Execute step
      const result = await executeStep(sessionId, step, context)
      
      // Update context with result
      context = { ...context, ...result }
      
      // Update step status to completed
      await updateSessionStep(sessionId, step, "completed", {
        output: result,
        preview: generatePreview(step, result)
      })
      
    } catch (error: any) {
      console.error(`Error in step ${step}:`, error)
      
      // Update step status to error
      await updateSessionStep(sessionId, step, "error", {
        error: error.message || `Failed to execute ${step}`
      })
      
      // Update session status to error
      await updateVoiceEmulatorSession(sessionId, {
        status: "error"
      })
      
      // Stop pipeline execution
      return
    }
  }
  
  // Mark session as completed
  await updateVoiceEmulatorSession(sessionId, {
    status: "completed",
    completedAt: new Date().toISOString(),
    systemPrompt: context.systemPrompt,
    totalTokensProcessed: context.totalTokens || 0,
    totalContentPieces: context.totalContent || 0,
    sources: context.sources || []
  })
}

async function executeStep(
  sessionId: string,
  step: PipelineStep,
  context: any
): Promise<any> {
  switch (step) {
    case "intake":
      return await runIntakeStep(sessionId, context)
    case "discovery":
      return await runDiscoveryStep(sessionId, context)
    case "newsletter":
      return await runNewsletterStep(sessionId, context)
    case "twitter":
      return await runTwitterStep(sessionId, context)
    case "linkedin":
      return await runLinkedInStep(sessionId, context)
    case "blog":
      return await runBlogStep(sessionId, context)
    case "consolidation":
      // Create a minimal session object for consolidation
      const session = { id: sessionId, creatorName: context.creatorName || 'Unknown' } as VoiceEmulatorSession
      return await runConsolidationStep(session, context)
    case "vectorization":
      const sessionVec = { id: sessionId, creatorName: context.creatorName || 'Unknown' } as VoiceEmulatorSession
      return await runVectorizationStep(sessionVec, context)
    case "retrieval":
      const sessionRet = { id: sessionId, creatorName: context.creatorName || 'Unknown' } as VoiceEmulatorSession
      return await runRetrievalStep(sessionRet, context)
    case "analysis":
      return await runAnalysisStep(sessionId, context)
    case "synthesis":
      const sessionSyn = { id: sessionId, creatorName: context.creatorName || 'Unknown' } as VoiceEmulatorSession
      return await runSynthesisStep(sessionSyn, context)
    default:
      throw new Error(`Unknown pipeline step: ${step}`)
  }
}

function generatePreview(step: PipelineStep, result: any): string {
  switch (step) {
    case "intake":
      return `Identified creator: ${result.creatorName}`
    case "discovery":
      return `Found ${result.sources?.length || 0} potential sources`
    case "newsletter":
      return `Extracted ${result.articles?.length || 0} newsletter articles`
    case "twitter":
      return `Retrieved ${result.tweets?.length || 0} tweets`
    case "linkedin":
      return `Retrieved ${result.posts?.length || 0} LinkedIn posts`
    case "blog":
      return `Extracted ${result.articles?.length || 0} blog posts`
    case "consolidation":
      return `Consolidated ${result.totalPieces || 0} content pieces`
    case "vectorization":
      return `Created ${result.embeddings?.length || 0} embeddings`
    case "retrieval":
      return `Retrieved ${result.examples?.length || 0} representative examples`
    case "analysis":
      return `Completed voice profile analysis`
    case "synthesis":
      return `Generated system prompt (${result.systemPrompt?.length || 0} characters)`
    default:
      return "Processing..."
  }
}