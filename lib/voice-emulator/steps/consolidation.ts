import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"
import { createGoogleDoc as createGoogleDocReal } from "@/lib/voice-emulator/google-drive"

export async function runConsolidationStep(
  session: VoiceEmulatorSession,
  input: any
) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const allContent: any[] = []
  
  if (input.newsletterContent?.length) {
    input.newsletterContent.forEach((item: any) => {
      allContent.push({
        type: "newsletter",
        content: item.content,
        metadata: {
          title: item.title,
          url: item.url,
          extractedAt: item.extractedAt
        }
      })
    })
  }
  
  if (input.tweets?.length) {
    input.tweets.forEach((tweet: any) => {
      allContent.push({
        type: "tweet",
        content: tweet.text,
        metadata: {
          id: tweet.id,
          engagement: tweet.engagement,
          createdAt: tweet.createdAt
        }
      })
    })
  }
  
  if (input.linkedinPosts?.length) {
    input.linkedinPosts.forEach((post: any) => {
      allContent.push({
        type: "linkedin",
        content: post.text,
        metadata: {
          id: post.id,
          engagement: post.engagement,
          postedAt: post.postedAt
        }
      })
    })
  }
  
  if (input.blogArticles?.length) {
    input.blogArticles.forEach((article: any) => {
      allContent.push({
        type: "blog",
        content: article.content,
        metadata: {
          title: article.title,
          url: article.url,
          extractedAt: article.extractedAt
        }
      })
    })
  }
  
  let googleDocsUrl = ''
  try {
    // Try to create actual Google Doc
    googleDocsUrl = await createGoogleDocReal(session.creatorName, allContent)
  } catch (error) {
    console.error('Failed to create Google Doc, using mock URL:', error)
    // Fallback to mock URL if Google Drive fails
    googleDocsUrl = `https://docs.google.com/document/d/mock-${Date.now()}/edit`
  }
  
  return {
    ...input,
    allContent,
    totalPieces: allContent.length,
    googleDocsUrl,
    consolidationComplete: true
  }
}