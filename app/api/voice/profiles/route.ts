import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Get all voice profiles from the database
      const result = await client.query(`
        SELECT 
          creator_name,
          overall_tone,
          writing_style,
          vocabulary_level,
          sentence_structure,
          topics,
          profile_data,
          last_updated
        FROM voice_profiles 
        ORDER BY creator_name
      `)

      // Transform database rows into the format expected by the frontend
      const voices = result.rows.map(row => {
        const profileData = row.profile_data ? JSON.parse(row.profile_data) : {}
        const topics = row.topics ? JSON.parse(row.topics) : []
        
        return {
          id: row.creator_name.toLowerCase().replace(/\s+/g, '-'),
          name: row.creator_name,
          description: `${row.overall_tone || 'Distinctive'} ${row.writing_style || 'style'} with ${row.vocabulary_level || 'accessible'} vocabulary`,
          traits: [
            row.overall_tone,
            row.writing_style,
            row.vocabulary_level,
            row.sentence_structure
          ].filter(Boolean),
          examples: topics.slice(0, 3), // First 3 topics as examples
          lastUpdated: row.last_updated
        }
      })

      return NextResponse.json({
        success: true,
        voices,
        count: voices.length
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch voice profiles:', error)
    
    // Fallback to hardcoded profiles if database fails
    const fallbackVoices = [
      {
        id: 'paul-graham',
        name: 'Paul Graham',
        description: 'Conversational, insightful startup wisdom',
        traits: ['conversational', 'anecdotal', 'philosophical', 'direct'],
        examples: ['essays on startups', 'YC advice', 'technical insights']
      },
      {
        id: 'naval-ravikant',
        name: 'Naval Ravikant',
        description: 'Philosophical, wealth-building wisdom',
        traits: ['philosophical', 'wealth-focused', 'tweet-like', 'profound'],
        examples: ['wealth building', 'happiness', 'startups', 'philosophy']
      },
      {
        id: 'malcolm-gladwell',
        name: 'Malcolm Gladwell',
        description: 'Narrative storytelling with research backing',
        traits: ['narrative', 'research-driven', 'story-focused', 'accessible'],
        examples: ['pop psychology', 'social science', 'counterintuitive insights']
      }
    ]

    return NextResponse.json({
      success: true,
      voices: fallbackVoices,
      count: fallbackVoices.length,
      fallback: true
    })
  }
}