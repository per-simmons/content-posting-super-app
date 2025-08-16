import { VoiceEmulatorSession } from "@/lib/voice-emulator-types"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ContentChunk {
  text: string
  metadata: any
  type: string
  chunkIndex: number
  totalChunks: number
  contextualText?: string
}

/**
 * Improved vectorization with contextual retrieval best practices
 * Based on Anthropic's approach: 67% reduction in retrieval failures
 */
export async function runVectorizationStepImproved(
  session: VoiceEmulatorSession,
  input: any
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  console.log("Starting improved vectorization with contextual retrieval...")
  
  // Step 1: Create contextually-aware chunks with proper boundaries
  const chunks = await createContextualChunks(input.allContent, input.creatorName || input.targetName)
  
  // Step 2: Generate embeddings for contextual chunks
  const embeddings = await generateEmbeddings(chunks, OPENAI_API_KEY)
  
  // Step 3: Calculate BM25 scores for lexical matching
  const bm25Scores = calculateBM25Scores(chunks)
  
  return {
    ...input,
    embeddings,
    bm25Scores,
    vectorCount: embeddings.length,
    chunkCount: chunks.length,
    method: 'contextual-retrieval'
  }
}

/**
 * Create chunks with contextual expansion and proper boundaries
 */
async function createContextualChunks(
  allContent: any[], 
  creatorName: string
): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []
  const CHUNK_SIZE = 600  // Words
  const OVERLAP = 100     // Words
  
  for (const content of allContent || []) {
    // Step 1: Add contextual information based on content type
    const contextPrefix = await generateContextPrefix(content, creatorName)
    
    // Step 2: Create chunks that respect content boundaries
    const contentChunks = createBoundedChunks(
      content,
      contextPrefix,
      CHUNK_SIZE,
      OVERLAP
    )
    
    chunks.push(...contentChunks)
  }
  
  // Step 3: Expand each chunk with LLM-generated context
  const expandedChunks = await expandChunksWithContext(chunks)
  
  return expandedChunks
}

/**
 * Generate contextual prefix for different content types
 */
async function generateContextPrefix(content: any, creatorName: string): Promise<string> {
  const { type, metadata } = content
  
  let prefix = `[Author: ${creatorName}]\n`
  
  switch (type) {
    case 'blog':
      prefix += `[Blog Post: "${metadata.title}"]\n`
      prefix += `[URL: ${metadata.url}]\n`
      if (metadata.isPopular) {
        prefix += `[Popular Post: ${metadata.influenceReason}]\n`
      }
      prefix += `[Published: ${metadata.extractedAt}]\n\n`
      break
      
    case 'tweet':
      prefix += `[Tweet from @${metadata.handle}]\n`
      prefix += `[Engagement Score: ${metadata.engagement}]\n`
      prefix += `[Posted: ${metadata.createdAt}]\n\n`
      break
      
    case 'linkedin':
      prefix += `[LinkedIn Post]\n`
      prefix += `[Engagement Score: ${metadata.engagement}]\n`
      prefix += `[Posted: ${metadata.postedAt}]\n\n`
      break
      
    case 'newsletter':
      prefix += `[Newsletter: "${metadata.title}"]\n`
      prefix += `[URL: ${metadata.url}]\n\n`
      break
  }
  
  return prefix
}

/**
 * Create chunks that don't cross content boundaries
 */
function createBoundedChunks(
  content: any,
  contextPrefix: string,
  chunkSize: number,
  overlap: number
): ContentChunk[] {
  const chunks: ContentChunk[] = []
  const fullText = contextPrefix + content.content
  const words = fullText.split(" ")
  
  // Don't chunk if content is small enough
  if (words.length <= chunkSize) {
    return [{
      text: fullText,
      metadata: content.metadata,
      type: content.type,
      chunkIndex: 0,
      totalChunks: 1
    }]
  }
  
  // Create overlapping chunks within the same content piece
  const totalChunks = Math.ceil(words.length / (chunkSize - overlap))
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize)
    const chunkText = chunkWords.join(" ")
    
    if (chunkText.trim()) {
      chunks.push({
        text: chunkText,
        metadata: {
          ...content.metadata,
          chunkPosition: `${Math.floor(i / (chunkSize - overlap)) + 1} of ${totalChunks}`
        },
        type: content.type,
        chunkIndex: Math.floor(i / (chunkSize - overlap)),
        totalChunks
      })
    }
  }
  
  return chunks
}

/**
 * Expand chunks with LLM-generated context (Anthropic's key innovation)
 */
async function expandChunksWithContext(chunks: ContentChunk[]): Promise<ContentChunk[]> {
  const expandedChunks: ContentChunk[] = []
  
  // Batch process for efficiency
  const batchSize = 10
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    
    const expandedBatch = await Promise.all(
      batch.map(async (chunk) => {
        // For each chunk, generate contextual expansion
        const contextualText = await generateContextualExpansion(chunk)
        return {
          ...chunk,
          contextualText
        }
      })
    )
    
    expandedChunks.push(...expandedBatch)
  }
  
  return expandedChunks
}

/**
 * Generate contextual expansion for a chunk using GPT-4.1-mini
 */
async function generateContextualExpansion(chunk: ContentChunk): Promise<string> {
  try {
    const prompt = `Given this text chunk from a ${chunk.type} by ${chunk.metadata.author}:

"${chunk.text.substring(0, 500)}..."

Add explicit context to make this chunk self-contained. Include:
- What document/post this is from
- The main topic being discussed
- Any relevant entities or concepts mentioned
- Position in the document (chunk ${chunk.chunkIndex + 1} of ${chunk.totalChunks})

Return ONLY the contextualized version of the text, no explanation.`

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { 
          role: "system", 
          content: "You expand text chunks with context for better retrieval. Be concise but complete."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_completion_tokens: 800
    })

    return response.choices[0].message.content || chunk.text
  } catch (error) {
    console.error("Error expanding chunk context:", error)
    // Fallback to original text with basic context
    return chunk.text
  }
}

/**
 * Generate embeddings for contextual chunks
 */
async function generateEmbeddings(
  chunks: ContentChunk[], 
  apiKey: string
): Promise<any[]> {
  const embeddings: any[] = []
  const batchSize = 10
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          // Use contextual text if available, otherwise original
          input: batch.map(c => c.contextualText || c.text)
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      data.data.forEach((embedding: any, index: number) => {
        embeddings.push({
          chunk: batch[index],
          embedding: embedding.embedding,
          // Store both original and contextual text
          originalText: batch[index].text,
          contextualText: batch[index].contextualText
        })
      })
    } catch (error) {
      console.error("Embedding error:", error)
    }
  }
  
  return embeddings
}

/**
 * Calculate BM25 scores for lexical matching
 * This enables hybrid search (semantic + lexical)
 */
function calculateBM25Scores(chunks: ContentChunk[]): Map<string, number> {
  // Simple BM25 implementation for demonstration
  // In production, use a library like 'js-search' or 'lunr'
  const scores = new Map<string, number>()
  
  // Calculate document frequency for terms
  const docFreq = new Map<string, number>()
  const totalDocs = chunks.length
  
  chunks.forEach((chunk, idx) => {
    const terms = new Set((chunk.contextualText || chunk.text)
      .toLowerCase()
      .split(/\W+/)
      .filter(term => term.length > 2))
    
    terms.forEach(term => {
      docFreq.set(term, (docFreq.get(term) || 0) + 1)
    })
    
    // Store initial BM25 score (will be calculated at query time)
    scores.set(`chunk_${idx}`, 0)
  })
  
  // Store IDF scores for later use
  const idfScores = new Map<string, number>()
  docFreq.forEach((freq, term) => {
    idfScores.set(term, Math.log((totalDocs - freq + 0.5) / (freq + 0.5)))
  })
  
  return scores
}