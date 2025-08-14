import { NextRequest, NextResponse } from 'next/server'
import { runIntakeStep } from '@/lib/voice-emulator/steps/intake'
import { runDiscoveryStep } from '@/lib/voice-emulator/steps/discovery'
import { runNewsletterStep } from '@/lib/voice-emulator/steps/newsletter'
import { runTwitterStep } from '@/lib/voice-emulator/steps/twitter'
import { runLinkedInStep } from '@/lib/voice-emulator/steps/linkedin'
import { runEnhancedBlogStep } from '@/lib/voice-emulator/steps/blog-enhanced'
import { runConsolidationStep } from '@/lib/voice-emulator/steps/consolidation'
import { VoiceEmulatorSession } from '@/lib/voice-emulator-types'
import fs from 'fs/promises'
import path from 'path'

// Extend timeout for long-running API calls
export const maxDuration = 300 // 5 minutes

const OUTPUT_DIR = '/app/docs/voice-emulator-8-14-25/voice-emulator-test-run-8-14-25'

async function saveStepOutput(stepName: string, data: any, targetName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${stepName}-${targetName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`
  const filePath = path.join(OUTPUT_DIR, fileName)
  
  let content = `# ${stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step Output\n\n`
  content += `**Target:** ${targetName}\n`
  content += `**Timestamp:** ${new Date().toISOString()}\n\n`
  content += `---\n\n`
  
  if (stepName === 'discovery') {
    content += `## Sources Found\n\n`
    if (data.sources) {
      Object.entries(data.sources).forEach(([key, value]) => {
        content += `- **${key}:** ${value || 'Not found'}\n`
      })
    }
    content += `\n## Raw Response\n\n\`\`\`\n${data.rawResponse || 'No response'}\n\`\`\`\n\n`
    if (data.citations?.length) {
      content += `## Citations\n\n`
      data.citations.forEach((citation: string, i: number) => {
        content += `${i + 1}. ${citation}\n`
      })
    }
  } else if (stepName === 'twitter') {
    content += `## Twitter Handle\n\n${data.handle || 'Not found'}\n\n`
    content += `## Statistics\n\n`
    content += `- Total tweets scraped: ${data.totalScraped || 0}\n`
    content += `- Top tweets selected: ${data.totalTweets || 0}\n\n`
    if (data.tweets?.length) {
      content += `## Top Tweets by Engagement\n\n`
      data.tweets.slice(0, 10).forEach((tweet: any, i: number) => {
        content += `### Tweet ${i + 1}\n\n`
        content += `${tweet.text}\n\n`
        content += `**Engagement:** ${tweet.engagement.likes} likes, ${tweet.engagement.retweets} retweets, ${tweet.engagement.replies} replies\n`
        content += `**Score:** ${tweet.engagement.likes + tweet.engagement.retweets * 2 + tweet.engagement.replies}\n`
        content += `**Posted:** ${tweet.createdAt}\n\n---\n\n`
      })
    }
  } else if (stepName === 'linkedin') {
    content += `## LinkedIn Profile\n\n${data.profileUrl || 'Not found'}\n\n`
    content += `## Statistics\n\n`
    content += `- Profile name: ${data.profileName || 'Unknown'}\n`
    content += `- Total posts scraped: ${data.totalScraped || 0}\n`
    content += `- Top posts selected: ${data.totalPosts || 0}\n\n`
    if (data.posts?.length) {
      content += `## Top LinkedIn Posts by Engagement\n\n`
      data.posts.slice(0, 10).forEach((post: any, i: number) => {
        content += `### Post ${i + 1}\n\n`
        content += `${post.text}\n\n`
        content += `**Engagement:** ${post.engagement.likes} likes, ${post.engagement.comments} comments, ${post.engagement.shares} shares\n`
        content += `**Score:** ${post.engagement.likes + post.engagement.comments * 2 + post.engagement.shares * 3}\n`
        content += `**Posted:** ${post.postedAt}\n\n---\n\n`
      })
    }
  } else if (stepName === 'blog') {
    content += `## Blog URL\n\n${data.blogUrl || 'Not found'}\n\n`
    content += `## Extraction Methods\n\n`
    if (data.extractionMethods) {
      content += `- Firecrawl Map: ${data.extractionMethods.firecrawlMap ? '✅ Success' : '❌ Failed'}\n`
      content += `- Perplexity Popular: ${data.extractionMethods.perplexityPopular ? '✅ Success' : '❌ Failed'}\n\n`
    }
    content += `## Articles Summary\n\n`
    content += `- Total unique articles: ${data.totalArticles || 0}\n`
    content += `- From site mapping: ${data.route1Count || 0}\n`
    content += `- From popular posts: ${data.route2Count || 0}\n\n`
    if (data.articles?.length) {
      content += `## Extracted Articles\n\n`
      data.articles.forEach((article: any, i: number) => {
        content += `### ${i + 1}. ${article.title || 'Untitled'}\n\n`
        content += `**URL:** ${article.url}\n`
        content += `**Source:** ${article.source || 'Unknown'}\n`
        if (article.topic) content += `**Topic:** ${article.topic}\n`
        if (article.description) content += `**Why Popular:** ${article.description}\n`
        content += `**Extracted:** ${article.extractedAt || article.publishedAt}\n\n`
        content += `**Content Preview:**\n\n${article.content?.substring(0, 500)}...\n\n---\n\n`
      })
    }
  } else if (stepName === 'newsletter') {
    content += `## Newsletter Extraction\n\n`
    if (data.skipped) {
      content += `Newsletter step skipped (no newsletter URL found)\n\n`
    } else {
      content += `Total articles: ${data.articles?.length || 0}\n`
      content += `Total words: ${data.totalWords || 0}\n\n`
      if (data.articles?.length) {
        data.articles.forEach((article: any, i: number) => {
          content += `### Newsletter ${i + 1}\n\n`
          content += `**URL:** ${article.url}\n`
          content += `**Content Preview:**\n\n${article.content?.substring(0, 500)}...\n\n---\n\n`
        })
      }
    }
  } else if (stepName === 'consolidation') {
    content += `## Consolidation Summary\n\n`
    content += `- Total pieces collected: ${data.totalPieces || 0}\n`
    content += `- Google Docs URL: ${data.googleDocsUrl || 'Not created'}\n\n`
    
    if (data.allContent?.length) {
      const grouped = data.allContent.reduce((acc: any, item: any) => {
        if (!acc[item.type]) acc[item.type] = 0
        acc[item.type]++
        return acc
      }, {})
      
      content += `## Content Breakdown\n\n`
      Object.entries(grouped).forEach(([type, count]) => {
        content += `- ${type}: ${count} items\n`
      })
    }
  } else {
    content += `## Raw Output\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`
  }
  
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content)
    console.log(`Saved ${stepName} output to ${fileName}`)
    return fileName
  } catch (error) {
    console.error(`Failed to save ${stepName} output:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { targetName = 'Tim Ferriss', hints = {} } = body
  
  const sessionId = `test-detailed-${Date.now()}`
  const session: VoiceEmulatorSession = {
    id: sessionId,
    creatorName: targetName,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const outputs: Record<string, any> = {}
  const files: string[] = []
  
  try {
    // Step 1: Discovery (must run first to get sources)
    console.log('Running discovery step...')
    const discoveryResult = await runDiscoveryStep(sessionId, { targetName, hints })
    outputs.discovery = discoveryResult
    const discoveryFile = await saveStepOutput('discovery', discoveryResult, targetName)
    if (discoveryFile) files.push(discoveryFile)
    
    const context = {
      targetName,
      hints,
      sources: discoveryResult.sources || {},
      creatorName: targetName
    }
    
    // Steps 2-5: Run in parallel (all are independent of each other)
    console.log('Running Newsletter, Twitter, LinkedIn, and Blog steps in parallel...')
    const startTime = Date.now()
    
    const [newsletterResult, twitterResult, linkedinResult, blogResult] = await Promise.all([
      // Newsletter extraction
      runNewsletterStep(sessionId, context).catch(error => {
        console.error('Newsletter step failed:', error)
        return { articles: [], error: error.message, failed: true }
      }),
      
      // Twitter scraping
      runTwitterStep(sessionId, context).catch(error => {
        console.error('Twitter step failed:', error)
        return { tweets: [], error: error.message, failed: true }
      }),
      
      // LinkedIn scraping
      runLinkedInStep(sessionId, context).catch(error => {
        console.error('LinkedIn step failed:', error)
        return { posts: [], error: error.message, failed: true }
      }),
      
      // Blog extraction (dual route)
      runEnhancedBlogStep(sessionId, context).catch(error => {
        console.error('Blog step failed:', error)
        return { articles: [], error: error.message, failed: true }
      })
    ])
    
    const parallelTime = Math.round((Date.now() - startTime) / 1000)
    console.log(`Parallel steps completed in ${parallelTime} seconds`)
    
    // Save outputs from parallel steps
    outputs.newsletter = newsletterResult
    const newsletterFile = await saveStepOutput('newsletter', newsletterResult, targetName)
    if (newsletterFile) files.push(newsletterFile)
    
    outputs.twitter = twitterResult
    const twitterFile = await saveStepOutput('twitter', twitterResult, targetName)
    if (twitterFile) files.push(twitterFile)
    
    outputs.linkedin = linkedinResult
    const linkedinFile = await saveStepOutput('linkedin', linkedinResult, targetName)
    if (linkedinFile) files.push(linkedinFile)
    
    outputs.blog = blogResult
    const blogFile = await saveStepOutput('blog', blogResult, targetName)
    if (blogFile) files.push(blogFile)
    
    // Step 6: Consolidation
    console.log('Running consolidation step...')
    const consolidationInput = {
      newsletterContent: newsletterResult.articles || [],
      tweets: twitterResult.tweets || [],
      linkedinPosts: linkedinResult.posts || [],
      blogArticles: blogResult.articles || []
    }
    const consolidationResult = await runConsolidationStep(session, consolidationInput)
    outputs.consolidation = consolidationResult
    const consolidationFile = await saveStepOutput('consolidation', consolidationResult, targetName)
    if (consolidationFile) files.push(consolidationFile)
    
    // Create master summary
    const summaryContent = `# Voice Emulator Test Run - ${targetName}\n\n` +
      `**Date:** ${new Date().toISOString()}\n\n` +
      `## Summary\n\n` +
      `Successfully completed voice emulation pipeline for ${targetName}.\n\n` +
      `## Steps Completed\n\n` +
      `1. ✅ Discovery - Found sources\n` +
      `2. ✅ Newsletter - ${(newsletterResult as any).skipped ? 'Skipped (no source)' : 'Extracted'}\n` +
      `3. ✅ Twitter - ${twitterResult.tweets?.length || 0} tweets\n` +
      `4. ✅ LinkedIn - ${linkedinResult.posts?.length || 0} posts\n` +
      `5. ✅ Blog - ${blogResult.articles?.length || 0} articles\n` +
      `6. ✅ Consolidation - ${consolidationResult.totalPieces || 0} total pieces\n\n` +
      `## Output Files\n\n` +
      files.map(f => `- ${f}`).join('\n') + '\n\n' +
      `## Google Docs\n\n` +
      `${consolidationResult.googleDocsUrl || 'Not created'}\n`
    
    const summaryPath = path.join(OUTPUT_DIR, `summary-${targetName.toLowerCase().replace(/\s+/g, '-')}.md`)
    await fs.writeFile(summaryPath, summaryContent)
    
    return NextResponse.json({
      success: true,
      sessionId,
      targetName,
      outputs,
      files,
      summaryFile: path.basename(summaryPath),
      googleDocsUrl: consolidationResult.googleDocsUrl
    })
    
  } catch (error) {
    console.error('Test runner error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      outputs,
      files
    }, { status: 500 })
  }
}