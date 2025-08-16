import { Pool } from 'pg'

interface VoiceTrait {
  id: string
  creatorName: string
  category: string
  trait: string
  description: string
  examples: string[]
  strength: number // 1-10 scale
  frequency: number // How often this trait appears
  contextTypes: string[] // Which content types this trait appears in
}

interface VoiceProfile {
  creatorName: string
  overallTone: string
  writingStyle: string
  vocabularyLevel: string
  sentenceStructure: string
  topics: string[]
  traits: VoiceTrait[]
  lastUpdated: Date
}

class VoiceTraitsManager {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  }

  /**
   * Initialize voice traits database tables
   */
  async initializeDatabase() {
    const client = await this.pool.connect()
    try {
      // Create voice_traits table
      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_traits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_name TEXT NOT NULL,
          category TEXT NOT NULL,
          trait TEXT NOT NULL,
          description TEXT,
          examples JSONB DEFAULT '[]',
          strength INTEGER CHECK (strength >= 1 AND strength <= 10),
          frequency REAL DEFAULT 0.0,
          context_types JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // Create voice_profiles table for aggregated profiles
      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_name TEXT UNIQUE NOT NULL,
          overall_tone TEXT,
          writing_style TEXT,
          vocabulary_level TEXT,
          sentence_structure TEXT,
          topics JSONB DEFAULT '[]',
          profile_data JSONB,
          last_updated TIMESTAMP DEFAULT NOW()
        )
      `)

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_traits_creator 
        ON voice_traits(creator_name)
      `)
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_traits_category 
        ON voice_traits(category)
      `)

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_voice_profiles_creator 
        ON voice_profiles(creator_name)
      `)

      console.log('Voice traits database initialized')
    } finally {
      client.release()
    }
  }

  /**
   * Store voice traits for a creator
   */
  async storeVoiceTraits(creatorName: string, traits: VoiceTrait[]) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Clear existing traits for this creator
      await client.query(
        'DELETE FROM voice_traits WHERE creator_name = $1',
        [creatorName]
      )

      // Insert new traits
      for (const trait of traits) {
        await client.query(`
          INSERT INTO voice_traits (
            creator_name, category, trait, description, examples, 
            strength, frequency, context_types
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          creatorName,
          trait.category,
          trait.trait,
          trait.description,
          JSON.stringify(trait.examples),
          trait.strength,
          trait.frequency,
          JSON.stringify(trait.contextTypes)
        ])
      }

      await client.query('COMMIT')
      console.log(`Stored ${traits.length} voice traits for ${creatorName}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Generate and store voice profile from traits
   */
  async generateVoiceProfile(creatorName: string): Promise<VoiceProfile> {
    const client = await this.pool.connect()
    try {
      // Get all traits for this creator
      const traitsResult = await client.query(`
        SELECT category, trait, description, examples, strength, frequency, context_types
        FROM voice_traits 
        WHERE creator_name = $1 
        ORDER BY strength DESC, frequency DESC
      `, [creatorName])

      const traits = traitsResult.rows.map(row => ({
        id: '',
        creatorName,
        category: row.category,
        trait: row.trait,
        description: row.description,
        examples: JSON.parse(row.examples),
        strength: row.strength,
        frequency: row.frequency,
        contextTypes: JSON.parse(row.context_types)
      }))

      // Analyze traits to create profile summary
      const profile = this.analyzeTraitsIntoProfile(creatorName, traits)

      // Store or update profile
      await client.query(`
        INSERT INTO voice_profiles (
          creator_name, overall_tone, writing_style, vocabulary_level,
          sentence_structure, topics, profile_data, last_updated
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (creator_name) 
        DO UPDATE SET
          overall_tone = $2,
          writing_style = $3,
          vocabulary_level = $4,
          sentence_structure = $5,
          topics = $6,
          profile_data = $7,
          last_updated = NOW()
      `, [
        creatorName,
        profile.overallTone,
        profile.writingStyle,
        profile.vocabularyLevel,
        profile.sentenceStructure,
        JSON.stringify(profile.topics),
        JSON.stringify(profile)
      ])

      return profile
    } finally {
      client.release()
    }
  }

  /**
   * Get voice profile for a creator
   */
  async getVoiceProfile(creatorName: string): Promise<VoiceProfile | null> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT profile_data 
        FROM voice_profiles 
        WHERE creator_name = $1
      `, [creatorName])

      if (result.rows.length === 0) {
        return null
      }

      return JSON.parse(result.rows[0].profile_data)
    } finally {
      client.release()
    }
  }

  /**
   * Get voice traits by category
   */
  async getTraitsByCategory(creatorName: string, category: string): Promise<VoiceTrait[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM voice_traits 
        WHERE creator_name = $1 AND category = $2
        ORDER BY strength DESC, frequency DESC
      `, [creatorName, category])

      return result.rows.map(row => ({
        id: row.id,
        creatorName: row.creator_name,
        category: row.category,
        trait: row.trait,
        description: row.description,
        examples: JSON.parse(row.examples),
        strength: row.strength,
        frequency: row.frequency,
        contextTypes: JSON.parse(row.context_types)
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Get top traits across all categories
   */
  async getTopTraits(creatorName: string, limit: number = 10): Promise<VoiceTrait[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM voice_traits 
        WHERE creator_name = $1
        ORDER BY (strength * frequency) DESC
        LIMIT $2
      `, [creatorName, limit])

      return result.rows.map(row => ({
        id: row.id,
        creatorName: row.creator_name,
        category: row.category,
        trait: row.trait,
        description: row.description,
        examples: JSON.parse(row.examples),
        strength: row.strength,
        frequency: row.frequency,
        contextTypes: JSON.parse(row.context_types)
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Search traits by natural language query
   */
  async searchTraits(creatorName: string, query: string): Promise<VoiceTrait[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM voice_traits 
        WHERE creator_name = $1 
        AND (
          trait ILIKE $2 OR 
          description ILIKE $2 OR 
          category ILIKE $2
        )
        ORDER BY strength DESC, frequency DESC
      `, [creatorName, `%${query}%`])

      return result.rows.map(row => ({
        id: row.id,
        creatorName: row.creator_name,
        category: row.category,
        trait: row.trait,
        description: row.description,
        examples: JSON.parse(row.examples),
        strength: row.strength,
        frequency: row.frequency,
        contextTypes: JSON.parse(row.context_types)
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Analyze traits to create a comprehensive voice profile
   */
  private analyzeTraitsIntoProfile(creatorName: string, traits: VoiceTrait[]): VoiceProfile {
    const categories = this.groupTraitsByCategory(traits)
    
    // Determine overall tone from tone-related traits
    const toneTraits = categories['tone'] || categories['voice'] || []
    const overallTone = toneTraits.length > 0 
      ? toneTraits[0].trait 
      : 'conversational'

    // Determine writing style from structure-related traits  
    const styleTraits = categories['style'] || categories['structure'] || []
    const writingStyle = styleTraits.length > 0 
      ? styleTraits[0].trait 
      : 'narrative'

    // Determine vocabulary level from language-related traits
    const vocabTraits = categories['vocabulary'] || categories['language'] || []
    const vocabularyLevel = vocabTraits.length > 0 
      ? vocabTraits[0].trait 
      : 'accessible'

    // Determine sentence structure from rhythm-related traits
    const rhythmTraits = categories['rhythm'] || categories['pacing'] || []
    const sentenceStructure = rhythmTraits.length > 0 
      ? rhythmTraits[0].trait 
      : 'varied'

    // Extract topics from content-related traits
    const topicTraits = categories['topics'] || categories['themes'] || []
    const topics = topicTraits.map(t => t.trait)

    return {
      creatorName,
      overallTone,
      writingStyle,
      vocabularyLevel,
      sentenceStructure,
      topics,
      traits,
      lastUpdated: new Date()
    }
  }

  /**
   * Group traits by category for analysis
   */
  private groupTraitsByCategory(traits: VoiceTrait[]): Record<string, VoiceTrait[]> {
    return traits.reduce((groups, trait) => {
      if (!groups[trait.category]) {
        groups[trait.category] = []
      }
      groups[trait.category].push(trait)
      return groups
    }, {} as Record<string, VoiceTrait[]>)
  }

  /**
   * Close database connections
   */
  async close() {
    await this.pool.end()
  }
}

// Export singleton instance
export const voiceTraitsManager = new VoiceTraitsManager()

/**
 * Voice trait categories for organization
 */
export const VOICE_TRAIT_CATEGORIES = {
  TONE: 'tone',
  STYLE: 'style', 
  VOCABULARY: 'vocabulary',
  RHYTHM: 'rhythm',
  STRUCTURE: 'structure',
  TOPICS: 'topics',
  PERSONALITY: 'personality',
  EXPERTISE: 'expertise'
} as const

/**
 * Common voice traits templates
 */
export const COMMON_VOICE_TRAITS = {
  TONE: [
    'conversational', 'formal', 'casual', 'authoritative', 'friendly',
    'analytical', 'empathetic', 'direct', 'diplomatic', 'humorous'
  ],
  STYLE: [
    'narrative', 'expository', 'persuasive', 'descriptive', 'instructional',
    'storytelling', 'data-driven', 'anecdotal', 'philosophical', 'practical'
  ],
  VOCABULARY: [
    'accessible', 'technical', 'sophisticated', 'simple', 'industry-specific',
    'metaphorical', 'precise', 'colloquial', 'academic', 'creative'
  ],
  RHYTHM: [
    'varied', 'short-punchy', 'long-flowing', 'rhythmic', 'staccato',
    'measured', 'rapid', 'deliberate', 'choppy', 'smooth'
  ]
} as const

// Simple stub function for generateVoiceTraits
export async function generateVoiceTraits(voiceProfile: any, creatorName: string) {
  return {
    traits: [],
    categories: [],
    patterns: voiceProfile,
    confidence: 0.85
  }
}