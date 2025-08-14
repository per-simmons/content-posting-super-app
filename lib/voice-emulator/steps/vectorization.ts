import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"

export async function runVectorizationStep(
  session: VoiceEmulatorSession,
  input: any
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const chunks = []
  const CHUNK_SIZE = 600
  const OVERLAP = 100
  
  for (const content of input.allContent || []) {
    const text = content.content
    const words = text.split(" ")
    
    for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
      const chunk = words.slice(i, i + CHUNK_SIZE).join(" ")
      if (chunk.trim()) {
        chunks.push({
          text: chunk,
          metadata: content.metadata,
          type: content.type
        })
      }
    }
  }
  
  const embeddings: any[] = []
  const batchSize = 10
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: batch.map(c => c.text)
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      data.data.forEach((embedding: any, index: number) => {
        embeddings.push({
          chunk: batch[index],
          embedding: embedding.embedding
        })
      })
    } catch (error) {
      console.error("Embedding error:", error)
    }
  }
  
  return {
    ...input,
    embeddings,
    vectorCount: embeddings.length,
    chunkCount: chunks.length
  }
}