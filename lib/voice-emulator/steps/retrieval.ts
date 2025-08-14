import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"

export async function runRetrievalStep(
  session: VoiceEmulatorSession,
  input: any
) {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const evidencePack = []
  
  if (input.tweets?.length) {
    const topTweets = input.tweets.slice(0, 10)
    evidencePack.push({
      category: "High-Engagement Tweets",
      examples: topTweets.map((t: any) => ({
        content: t.text,
        metadata: {
          engagement: t.engagement,
          createdAt: t.createdAt
        }
      }))
    })
  }
  
  if (input.linkedinPosts?.length) {
    const topPosts = input.linkedinPosts.slice(0, 5)
    evidencePack.push({
      category: "Top LinkedIn Posts",
      examples: topPosts.map((p: any) => ({
        content: p.text,
        metadata: {
          engagement: p.engagement,
          postedAt: p.postedAt
        }
      }))
    })
  }
  
  if (input.blogArticles?.length) {
    const recentArticles = input.blogArticles.slice(0, 3)
    evidencePack.push({
      category: "Blog Articles",
      examples: recentArticles.map((a: any) => ({
        content: a.content.substring(0, 2000),
        metadata: {
          title: a.title,
          url: a.url
        }
      }))
    })
  }
  
  if (input.newsletterContent?.length) {
    const newsletters = input.newsletterContent.slice(0, 3)
    evidencePack.push({
      category: "Newsletter Content",
      examples: newsletters.map((n: any) => ({
        content: n.content.substring(0, 2000),
        metadata: {
          title: n.title,
          url: n.url
        }
      }))
    })
  }
  
  const totalExamples = evidencePack.reduce((sum, pack) => sum + pack.examples.length, 0)
  
  return {
    ...input,
    evidencePack,
    evidenceCount: totalExamples,
    retrievalComplete: true
  }
}