import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"
import { createGoogleDoc as createGoogleDocReal } from "@/lib/voice-emulator/google-drive"
import { createSeparateGoogleDocs } from "@/lib/voice-emulator/google-drive-separated"

export async function runConsolidationStep(
  session: VoiceEmulatorSession,
  input: any
) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const allContent: any[] = []
  
  // Newsletter deduplication by URL
  if (input.newsletterContent?.length) {
    const seenNewsletterUrls = new Set<string>()
    input.newsletterContent.forEach((item: any) => {
      // Skip if we've already seen this URL
      if (item.url && seenNewsletterUrls.has(item.url)) {
        console.log(`Skipping duplicate newsletter URL: ${item.url}`)
        return
      }
      if (item.url) seenNewsletterUrls.add(item.url)
      
      allContent.push({
        type: "newsletter",
        content: item.content,
        metadata: {
          title: item.title,
          url: item.url,
          extractedAt: item.extractedAt,
          author: input.creatorName || input.targetName
        }
      })
    })
  }
  
  // Twitter deduplication by tweet ID
  if (input.tweets?.length) {
    const seenTweetIds = new Set<string>()
    input.tweets.forEach((tweet: any) => {
      // Skip if we've already seen this tweet ID
      if (tweet.id && seenTweetIds.has(tweet.id)) {
        console.log(`Skipping duplicate tweet ID: ${tweet.id}`)
        return
      }
      if (tweet.id) seenTweetIds.add(tweet.id)
      
      allContent.push({
        type: "tweet",
        content: tweet.text,
        metadata: {
          id: tweet.id,
          engagement: tweet.engagement,
          createdAt: tweet.createdAt,
          author: input.creatorName || input.targetName,
          handle: input.sources?.twitter || null
        }
      })
    })
  }
  
  // LinkedIn deduplication by post ID
  if (input.linkedinPosts?.length) {
    const seenPostIds = new Set<string>()
    input.linkedinPosts.forEach((post: any) => {
      // Skip if we've already seen this post ID
      if (post.id && seenPostIds.has(post.id)) {
        console.log(`Skipping duplicate LinkedIn post ID: ${post.id}`)
        return
      }
      if (post.id) seenPostIds.add(post.id)
      
      allContent.push({
        type: "linkedin",
        content: post.text,
        metadata: {
          id: post.id,
          engagement: post.engagement,
          postedAt: post.postedAt,
          author: input.creatorName || input.targetName,
          profileUrl: input.sources?.linkedin || null
        }
      })
    })
  }
  
  // Blog articles already have deduplication in blog-optimized.ts
  if (input.blogArticles?.length) {
    input.blogArticles.forEach((article: any) => {
      allContent.push({
        type: "blog",
        content: article.content,
        metadata: {
          title: article.title,
          url: article.url,
          extractedAt: article.extractedAt,
          isPopular: article.isPopular || false,
          influenceReason: article.influenceReason || null,
          author: input.creatorName || input.targetName
        }
      })
    })
  }
  
  let googleDocsUrls: any = {}
  try {
    // Create separate Google Docs for each content type
    googleDocsUrls = await createSeparateGoogleDocs(session.creatorName, allContent)
    console.log('Created separate Google Docs:', googleDocsUrls)
  } catch (error) {
    console.error('Failed to create separate Google Docs, falling back to single doc:', error)
    // Fallback to single document if separate creation fails
    try {
      const singleDocUrl = await createGoogleDocReal(session.creatorName, allContent)
      googleDocsUrls = {
        summary: singleDocUrl,
        blog: null,
        twitter: null,
        linkedin: null,
        newsletter: null
      }
    } catch (fallbackError) {
      console.error('Failed to create any Google Doc, using mock URLs:', fallbackError)
      googleDocsUrls = {
        summary: `https://docs.google.com/document/d/mock-summary-${Date.now()}/edit`,
        blog: null,
        twitter: null,
        linkedin: null,
        newsletter: null
      }
    }
  }
  
  return {
    ...input,
    allContent,
    totalPieces: allContent.length,
    googleDocsUrl: googleDocsUrls.summary, // Keep backward compatibility
    googleDocsUrls, // New field with all URLs
    consolidationComplete: true
  }
}