import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"

export async function runSynthesisStep(
  session: VoiceEmulatorSession,
  input: any
) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured")
  }

  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const voiceProfileSummary = JSON.stringify(input.voiceProfile, null, 2)
  
  const synthesisPrompt = `Based on this voice analysis of ${session.creatorName}, create a comprehensive system prompt that would enable an AI to emulate their writing style accurately.

Voice Profile:
${voiceProfileSummary}

Key Examples:
${input.evidencePack?.slice(0, 2).map((pack: any) => 
  `${pack.category}: ${pack.examples[0]?.content}`
).join("\n\n")}

Create a system prompt that:
1. Captures their unique voice and tone
2. Includes their common phrases and expressions
3. Reflects their expertise and perspective
4. Maintains their structural patterns
5. Uses their rhetorical techniques
6. Incorporates their cultural references
7. Applies their argumentation style

The system prompt should be detailed, actionable, and include specific examples.`

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: synthesisPrompt
          }
        ]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }
    
    const data = await response.json()
    const systemPrompt = data.content[0].text
    
    const totalTokens = (input.totalTokensProcessed || 0) + 
      (voiceProfileSummary.length / 4) + 
      (systemPrompt.length / 4)
    
    return {
      ...input,
      systemPrompt,
      synthesisComplete: true,
      totalTokensProcessed: Math.floor(totalTokens),
      totalContentPieces: input.totalPieces || 0,
      sources: input.sources
    }
  } catch (error) {
    console.error("Synthesis error:", error)
    
    const fallbackPrompt = `You are writing in the style of ${session.creatorName}. 
    
Key characteristics:
- Professional and thoughtful tone
- Clear and structured arguments
- Industry expertise
- Engaging storytelling
- Data-driven insights

Write in their voice, maintaining their unique perspective and communication style.`
    
    return {
      ...input,
      systemPrompt: fallbackPrompt,
      synthesisError: error instanceof Error ? error.message : "Synthesis failed",
      totalTokensProcessed: 1000,
      totalContentPieces: input.totalPieces || 0,
      sources: input.sources
    }
  }
}