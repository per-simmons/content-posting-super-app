import { NextRequest, NextResponse } from 'next/server'
import { runIntakeStep } from '@/lib/voice-emulator/steps/intake'
import { runDiscoveryStep } from '@/lib/voice-emulator/steps/discovery'
import { runNewsletterStep } from '@/lib/voice-emulator/steps/newsletter'
import { runTwitterStep } from '@/lib/voice-emulator/steps/twitter'
import { runLinkedInStep } from '@/lib/voice-emulator/steps/linkedin'
import { runEnhancedBlogStep } from '@/lib/voice-emulator/steps/blog-enhanced'
import { runConsolidationStep } from '@/lib/voice-emulator/steps/consolidation'
import { VoiceEmulatorSession } from '@/lib/voice-emulator-types'

// Maximum timeout for Vercel Pro (10 minutes for Enterprise)
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { targetName = 'Tim Ferriss', hints = {} } = body
  
  const sessionId = `test-parallel-${Date.now()}`
  const session: VoiceEmulatorSession = {
    id: sessionId,
    creatorName: targetName,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const outputs: Record<string, any> = {}
  const timings: Record<string, number> = {}
  
  try {
    // Step 1: Discovery (must run first to get sources)
    console.log('🔍 Starting discovery step...')
    const discoveryStart = Date.now()
    const discoveryResult = await runDiscoveryStep(sessionId, { targetName, hints })
    timings.discovery = Math.round((Date.now() - discoveryStart) / 1000)
    outputs.discovery = discoveryResult
    console.log(`✅ Discovery completed in ${timings.discovery}s`)
    
    const context = {
      targetName,
      hints,
      sources: discoveryResult.sources || {},
      creatorName: targetName
    }
    
    // Steps 2-5: Run in parallel
    console.log('🚀 Starting parallel execution of Newsletter, Twitter, LinkedIn, and Blog...')
    const parallelStart = Date.now()
    
    const [newsletterResult, twitterResult, linkedinResult, blogResult] = await Promise.allSettled([
      // Newsletter extraction
      (async () => {
        const start = Date.now()
        const result = await runNewsletterStep(sessionId, context)
        const duration = Math.round((Date.now() - start) / 1000)
        console.log(`📧 Newsletter completed in ${duration}s`)
        return { ...result, duration }
      })(),
      
      // Twitter scraping
      (async () => {
        const start = Date.now()
        const result = await runTwitterStep(sessionId, context)
        const duration = Math.round((Date.now() - start) / 1000)
        console.log(`🐦 Twitter completed in ${duration}s`)
        return { ...result, duration }
      })(),
      
      // LinkedIn scraping
      (async () => {
        const start = Date.now()
        const result = await runLinkedInStep(sessionId, context)
        const duration = Math.round((Date.now() - start) / 1000)
        console.log(`💼 LinkedIn completed in ${duration}s`)
        return { ...result, duration }
      })(),
      
      // Blog extraction
      (async () => {
        const start = Date.now()
        const result = await runEnhancedBlogStep(sessionId, context)
        const duration = Math.round((Date.now() - start) / 1000)
        console.log(`📝 Blog completed in ${duration}s`)
        return { ...result, duration }
      })()
    ])
    
    timings.parallel = Math.round((Date.now() - parallelStart) / 1000)
    console.log(`✅ All parallel steps completed in ${timings.parallel}s`)
    
    // Process results
    outputs.newsletter = newsletterResult.status === 'fulfilled' ? newsletterResult.value : { error: 'Failed', failed: true }
    outputs.twitter = twitterResult.status === 'fulfilled' ? twitterResult.value : { error: 'Failed', failed: true }
    outputs.linkedin = linkedinResult.status === 'fulfilled' ? linkedinResult.value : { error: 'Failed', failed: true }
    outputs.blog = blogResult.status === 'fulfilled' ? blogResult.value : { error: 'Failed', failed: true }
    
    // Extract individual timings
    if (newsletterResult.status === 'fulfilled') timings.newsletter = newsletterResult.value.duration
    if (twitterResult.status === 'fulfilled') timings.twitter = twitterResult.value.duration
    if (linkedinResult.status === 'fulfilled') timings.linkedin = linkedinResult.value.duration
    if (blogResult.status === 'fulfilled') timings.blog = blogResult.value.duration
    
    // Step 6: Consolidation
    console.log('📚 Starting consolidation step...')
    const consolidationStart = Date.now()
    const consolidationInput = {
      newsletterContent: outputs.newsletter?.articles || [],
      tweets: outputs.twitter?.tweets || [],
      linkedinPosts: outputs.linkedin?.posts || [],
      blogArticles: outputs.blog?.articles || []
    }
    const consolidationResult = await runConsolidationStep(session, consolidationInput)
    timings.consolidation = Math.round((Date.now() - consolidationStart) / 1000)
    outputs.consolidation = consolidationResult
    console.log(`✅ Consolidation completed in ${timings.consolidation}s`)
    
    // Calculate total time
    timings.total = Math.round((Date.now() - discoveryStart) / 1000)
    
    // Summary statistics
    const stats = {
      totalTime: timings.total,
      parallelTime: timings.parallel,
      timeSaved: Math.max(...[timings.newsletter || 0, timings.twitter || 0, timings.linkedin || 0, timings.blog || 0]) * 3 - timings.parallel,
      steps: {
        successful: Object.values(outputs).filter(o => !o.failed).length,
        failed: Object.values(outputs).filter(o => o.failed).length,
        total: Object.keys(outputs).length
      },
      content: {
        tweets: outputs.twitter?.tweets?.length || 0,
        linkedinPosts: outputs.linkedin?.posts?.length || 0,
        blogArticles: outputs.blog?.articles?.length || 0,
        newsletterArticles: outputs.newsletter?.articles?.length || 0,
        totalPieces: outputs.consolidation?.totalPieces || 0
      }
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      targetName,
      timings,
      stats,
      outputs,
      googleDocsUrl: consolidationResult.googleDocsUrl
    })
    
  } catch (error) {
    console.error('❌ Test runner error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timings,
      outputs
    }, { status: 500 })
  }
}