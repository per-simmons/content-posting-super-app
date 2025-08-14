import { NextRequest, NextResponse } from 'next/server'
import { jobQueue } from '@/lib/queue/simple-job-queue'
import { runDiscoveryStep } from '@/lib/voice-emulator/steps/discovery'
import { runNewsletterStep } from '@/lib/voice-emulator/steps/newsletter'
import { runTwitterStep } from '@/lib/voice-emulator/steps/twitter'
import { runLinkedInStep } from '@/lib/voice-emulator/steps/linkedin'
import { runEnhancedBlogStep } from '@/lib/voice-emulator/steps/blog-enhanced'
import { runConsolidationStep } from '@/lib/voice-emulator/steps/consolidation'
import { VoiceEmulatorSession } from '@/lib/voice-emulator-types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetName, hints = {} } = body
    
    if (!targetName) {
      return NextResponse.json(
        { error: 'Target name is required' },
        { status: 400 }
      )
    }
    
    // Generate a session ID
    const sessionId = `voice-emulator-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Create a job
    const jobId = jobQueue.createJob({
      targetName,
      hints,
      sessionId
    })
    
    // Process the job asynchronously (don't await)
    processVoiceEmulatorJob(jobId, sessionId, targetName, hints)
    
    // Return immediately with job handle
    return NextResponse.json({
      success: true,
      sessionId,
      jobId,
      status: 'queued',
      message: 'Voice emulation pipeline started in background',
      statusUrl: `/api/voice-emulator/async/status/${jobId}`
    })
    
  } catch (error) {
    console.error('Error starting voice emulator:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start voice emulator',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processVoiceEmulatorJob(
  jobId: string,
  sessionId: string,
  targetName: string,
  hints: any
) {
  await jobQueue.processJob(jobId, async (job) => {
    try {
      console.log(`Starting Voice Emulator pipeline for ${targetName}`)
      
      // Step 1: Discovery (must run first)
      jobQueue.updateProgress(jobId, 'Running discovery step...', 10)
      const discoveryResult = await runDiscoveryStep(sessionId, { targetName, hints })
      
      const context = {
        targetName,
        hints,
        sources: discoveryResult.sources || {},
        creatorName: targetName
      }
      
      // Steps 2-5: Run in parallel
      jobQueue.updateProgress(jobId, 'Gathering content from multiple sources...', 30)
      const [newsletterResult, twitterResult, linkedinResult, blogResult] = await Promise.all([
        runNewsletterStep(sessionId, context).catch(error => {
          console.error("Newsletter step failed:", error)
          return { articles: [], error: error.message, failed: true }
        }),
        
        runTwitterStep(sessionId, context).catch(error => {
          console.error("Twitter step failed:", error)
          return { tweets: [], error: error.message, failed: true }
        }),
        
        runLinkedInStep(sessionId, context).catch(error => {
          console.error("LinkedIn step failed:", error)
          return { posts: [], error: error.message, failed: true }
        }),
        
        runEnhancedBlogStep(sessionId, context).catch(error => {
          console.error("Blog step failed:", error)
          return { articles: [], error: error.message, failed: true }
        })
      ])
      
      // Step 6: Consolidation
      jobQueue.updateProgress(jobId, 'Consolidating and creating Google Doc...', 80)
      const session: VoiceEmulatorSession = {
        id: sessionId,
        creatorName: targetName,
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const consolidationInput = {
        newsletterContent: newsletterResult.articles || [],
        tweets: twitterResult.tweets || [],
        linkedinPosts: linkedinResult.posts || [],
        blogArticles: blogResult.articles || []
      }
      
      const consolidationResult = await runConsolidationStep(session, consolidationInput)
      
      jobQueue.updateProgress(jobId, 'Pipeline completed!', 100)
      
      return {
        success: true,
        sessionId,
        targetName,
        discovery: discoveryResult,
        newsletter: newsletterResult,
        twitter: twitterResult,
        linkedin: linkedinResult,
        blog: blogResult,
        consolidation: consolidationResult,
        googleDocsUrl: consolidationResult.googleDocsUrl
      }
    } catch (error) {
      console.error('Pipeline error:', error)
      throw error
    }
  })
}