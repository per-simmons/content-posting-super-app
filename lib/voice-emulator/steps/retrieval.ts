import { Pool } from 'pg'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VoiceEmbedding {
  id: string
  creatorName: string
  chunkText: string
  contextualText?: string
  embedding: number[]
  metadata: any
  type: string
  chunkIndex: number
  totalChunks: number
  bm25Score?: number
}

interface SearchResult {
  embedding: VoiceEmbedding
  similarity: number
  bm25Score: number
  hybridScore: number
}

class VoiceRetrievalSystem {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  }

  /**
   * Initialize database tables for voice embeddings
   */
  async initializeDatabase() {
    const client = await this.pool.connect()
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector')
      
      // Create voice_embeddings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_name TEXT NOT NULL,
          chunk_text TEXT NOT NULL,
          contextual_text TEXT,
          embedding vector(1536),
          metadata JSONB,
          type TEXT NOT NULL,
          chunk_index INTEGER,
          total_chunks INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // Create indexes for efficient searching
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_embeddings_creator 
        ON voice_embeddings(creator_name)
      `)
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_embeddings_type 
        ON voice_embeddings(type)
      `)

      // Create vector similarity index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_embeddings_embedding 
        ON voice_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `)

      console.log('Voice embeddings database initialized')
    } finally {
      client.release()
    }
  }

  /**
   * Store embeddings from vectorization pipeline
   */
  async storeEmbeddings(embeddings: any[], creatorName: string) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Clear existing embeddings for this creator
      await client.query(
        'DELETE FROM voice_embeddings WHERE creator_name = $1',
        [creatorName]
      )

      // Insert new embeddings
      for (const embeddingData of embeddings) {
        const { chunk, embedding, originalText, contextualText } = embeddingData
        
        await client.query(`
          INSERT INTO voice_embeddings (
            creator_name, chunk_text, contextual_text, embedding, 
            metadata, type, chunk_index, total_chunks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          creatorName,
          originalText || chunk.text,
          contextualText,
          JSON.stringify(embedding),
          JSON.stringify(chunk.metadata),
          chunk.type,
          chunk.chunkIndex,
          chunk.totalChunks
        ])
      }

      await client.query('COMMIT')
      console.log(`Stored ${embeddings.length} embeddings for ${creatorName}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Search for similar content using hybrid approach (semantic + lexical)
   */
  async searchSimilarContent(
    query: string,
    creatorName: string,
    options: {
      limit?: number
      semanticWeight?: number
      lexicalWeight?: number
      contentTypes?: string[]
    } = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      semanticWeight = 0.7,
      lexicalWeight = 0.3,
      contentTypes = []
    } = options

    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query)
    
    const client = await this.pool.connect()
    try {
      // Build dynamic query based on filters
      let whereClause = 'WHERE creator_name = $1'
      const params: any[] = [creatorName]
      let paramIndex = 2

      if (contentTypes.length > 0) {
        whereClause += ` AND type = ANY($${paramIndex})`
        params.push(contentTypes)
        paramIndex++
      }

      // Semantic search using vector similarity
      const semanticQuery = `
        SELECT 
          id, creator_name, chunk_text, contextual_text, embedding, 
          metadata, type, chunk_index, total_chunks,
          1 - (embedding <=> $${paramIndex}) as similarity
        FROM voice_embeddings
        ${whereClause}
        ORDER BY embedding <=> $${paramIndex}
        LIMIT $${paramIndex + 1}
      `
      
      params.push(JSON.stringify(queryEmbedding))
      params.push(limit * 2) // Get more results for reranking

      const semanticResults = await client.query(semanticQuery, params)
      
      // Calculate BM25 scores for lexical matching
      const resultsWithBM25 = await this.calculateBM25Scores(
        semanticResults.rows,
        query
      )

      // Combine semantic and lexical scores
      const hybridResults = resultsWithBM25.map(row => ({
        embedding: {
          id: row.id,
          creatorName: row.creator_name,
          chunkText: row.chunk_text,
          contextualText: row.contextual_text,
          embedding: JSON.parse(row.embedding),
          metadata: row.metadata,
          type: row.type,
          chunkIndex: row.chunk_index,
          totalChunks: row.total_chunks
        },
        similarity: row.similarity,
        bm25Score: row.bm25_score,
        hybridScore: (semanticWeight * row.similarity) + (lexicalWeight * row.bm25_score)
      }))

      // Sort by hybrid score and return top results
      return hybridResults
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit)

    } finally {
      client.release()
    }
  }

  /**
   * Get voice traits and writing patterns for a creator
   */
  async getVoiceTraits(creatorName: string): Promise<any> {
    const client = await this.pool.connect()
    try {
      // Get content type distribution
      const typeDistribution = await client.query(`
        SELECT type, COUNT(*) as count
        FROM voice_embeddings
        WHERE creator_name = $1
        GROUP BY type
      `, [creatorName])

      // Get sample content from each type
      const sampleContent = await client.query(`
        SELECT DISTINCT ON (type) type, chunk_text, metadata
        FROM voice_embeddings
        WHERE creator_name = $1
        ORDER BY type, chunk_index
      `, [creatorName])

      return {
        creatorName,
        contentTypes: typeDistribution.rows,
        sampleContent: sampleContent.rows,
        totalChunks: typeDistribution.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      }
    } finally {
      client.release()
    }
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    })
    return response.data[0].embedding
  }

  /**
   * Calculate BM25 scores for lexical matching
   */
  private async calculateBM25Scores(rows: any[], query: string): Promise<any[]> {
    const queryTerms = query.toLowerCase().split(/\W+/).filter(term => term.length > 2)
    const k1 = 1.2
    const b = 0.75
    
    // Calculate average document length
    const avgDocLength = rows.reduce((sum, row) => {
      const text = row.contextual_text || row.chunk_text
      return sum + text.split(/\W+/).length
    }, 0) / rows.length

    return rows.map(row => {
      const text = (row.contextual_text || row.chunk_text).toLowerCase()
      const docLength = text.split(/\W+/).length
      
      let bm25Score = 0
      
      for (const term of queryTerms) {
        const termFreq = (text.match(new RegExp(term, 'g')) || []).length
        if (termFreq > 0) {
          // Simplified BM25 calculation
          const idf = Math.log((rows.length + 1) / (1 + 1)) // Simplified IDF
          const tf = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLength / avgDocLength)))
          bm25Score += idf * tf
        }
      }
      
      return {
        ...row,
        bm25_score: Math.max(0, bm25Score / queryTerms.length) // Normalize by query length
      }
    })
  }

  /**
   * Close database connections
   */
  async close() {
    await this.pool.end()
  }
}

// Export singleton instance
export const voiceRetrieval = new VoiceRetrievalSystem()

/**
 * Main function to run retrieval step
 */
export async function runRetrievalStep(
  sessionId: string,
  input: {
    targetName: string
    embeddings?: any[]
    query?: string
    options?: any
  }
) {
  await voiceRetrieval.initializeDatabase()
  
  // If embeddings are provided, store them
  if (input.embeddings && input.embeddings.length > 0) {
    await voiceRetrieval.storeEmbeddings(input.embeddings, input.targetName)
  }

  // If query is provided, search for similar content
  let searchResults = null
  if (input.query) {
    searchResults = await voiceRetrieval.searchSimilarContent(
      input.query,
      input.targetName,
      input.options || {}
    )
  }

  // Get voice traits
  const voiceTraits = await voiceRetrieval.getVoiceTraits(input.targetName)

  return {
    sessionId,
    targetName: input.targetName,
    searchResults,
    voiceTraits,
    status: 'completed'
  }
}