"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true
})

interface VoiceProfile {
  id: string
  name: string
  description: string
  traits: string[]
  examples: string[]
}

interface VoiceTrait {
  id: string
  creatorName: string
  category: string
  trait: string
  description: string
  examples: string[]
  strength: number
  frequency: number
  contextTypes: string[]
}

interface VoiceContextType {
  // Voice transformation
  transformWithVoice: (text: string, voiceProfile: VoiceProfile, instruction?: string) => Promise<string>
  expandWithTraits: (text: string, traits: string[], instruction?: string) => Promise<string>
  
  // Natural language commands
  processNaturalCommand: (text: string, command: string) => Promise<string>
  
  // Voice analysis and feedback
  analyzeVoiceConsistency: (text: string) => Promise<string>
  suggestVoiceImprovements: (text: string) => Promise<string[]>
  
  // Voice retrieval (when connected to backend)
  searchSimilarContent: (query: string, creatorName: string) => Promise<any[]>
  getVoiceTraits: (creatorName: string) => Promise<VoiceTrait[]>
  
  // State
  availableVoices: VoiceProfile[]
  isConnected: boolean
}

const VoiceContext = createContext<VoiceContextType | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  
  // Available voice profiles (can be expanded from database)
  const availableVoices: VoiceProfile[] = [
    {
      id: 'paul-graham',
      name: 'Paul Graham',
      description: 'Conversational, insightful startup wisdom',
      traits: ['conversational', 'anecdotal', 'philosophical', 'direct'],
      examples: ['essays on startups', 'YC advice', 'technical insights']
    },
    {
      id: 'malcolm-gladwell',
      name: 'Malcolm Gladwell',
      description: 'Narrative storytelling with research backing',
      traits: ['narrative', 'research-driven', 'story-focused', 'accessible'],
      examples: ['pop psychology', 'social science', 'counterintuitive insights']
    },
    {
      id: 'seth-godin',
      name: 'Seth Godin',
      description: 'Punchy, marketing-focused insights',
      traits: ['punchy', 'direct', 'marketing-savvy', 'actionable'],
      examples: ['short blog posts', 'marketing philosophy', 'business advice']
    },
    {
      id: 'naval-ravikant',
      name: 'Naval Ravikant',
      description: 'Philosophical, wealth-building wisdom',
      traits: ['philosophical', 'wealth-focused', 'tweet-like', 'profound'],
      examples: ['wealth building', 'happiness', 'startups', 'philosophy']
    }
  ]
  
  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection()
  }, [])
  
  const checkBackendConnection = async () => {
    try {
      // Test connection with a sample query
      const response = await fetch('/api/voice/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test connection', 
          creatorName: 'paul-graham' 
        })
      })
      
      setIsConnected(response.ok)
      if (response.ok) {
        console.log('Voice backend connected successfully')
      }
    } catch (error) {
      console.log('Voice backend not available, using client-side only')
      setIsConnected(false)
    }
  }
  
  const transformWithVoice = async (
    text: string, 
    voiceProfile: VoiceProfile, 
    instruction?: string
  ): Promise<string> => {
    try {
      const voicePrompt = `Transform this text to match ${voiceProfile.name}'s writing style.

Voice Profile: ${voiceProfile.name}
Description: ${voiceProfile.description}
Key traits: ${voiceProfile.traits.join(', ')}
Example content types: ${voiceProfile.examples.join(', ')}

${instruction ? `Additional instruction: ${instruction}` : ''}

Original text:
${text}

Requirements:
- Maintain the core meaning and information
- Adapt the tone, structure, and vocabulary to match ${voiceProfile.name}'s style
- Use their typical sentence patterns and rhetorical devices
- Incorporate their characteristic way of explaining concepts

Provide only the transformed text without any explanation or meta-commentary.`

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: voicePrompt
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return text
    } catch (error) {
      console.error('Voice transformation error:', error)
      throw error
    }
  }
  
  const expandWithTraits = async (
    text: string, 
    traits: string[], 
    instruction?: string
  ): Promise<string> => {
    try {
      const traitPrompt = `Expand and enhance this text by incorporating these voice traits: ${traits.join(', ')}.

Voice traits to incorporate:
${traits.map(trait => `- ${trait}: Apply this characteristic throughout the text`).join('\n')}

${instruction ? `Additional instruction: ${instruction}` : ''}

Original text:
${text}

Requirements:
- Expand the content while maintaining its core message
- Naturally integrate the specified voice traits
- Ensure the enhanced version feels authentic and cohesive
- Add examples, analogies, or elaborations that match the traits

Provide only the expanded text without any explanation.`

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: traitPrompt
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return text
    } catch (error) {
      console.error('Trait expansion error:', error)
      throw error
    }
  }
  
  const processNaturalCommand = async (text: string, command: string): Promise<string> => {
    try {
      const commandPrompt = `Process this natural language editing command on the given text.

Command: "${command}"

Text to edit:
${text}

Instructions:
- Interpret the command and apply the requested changes
- If the command mentions a specific writing style or author, adapt accordingly
- If the command is about tone, structure, length, or clarity, apply those changes
- Maintain the original meaning unless explicitly asked to change it
- If the command is unclear, make your best interpretation

Provide only the edited text without any explanation.`

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: commandPrompt
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return text
    } catch (error) {
      console.error('Natural command processing error:', error)
      throw error
    }
  }
  
  const analyzeVoiceConsistency = async (text: string): Promise<string> => {
    try {
      const analysisPrompt = `Analyze this text for voice and style consistency. Provide specific feedback on:

1. Tone consistency throughout the piece
2. Vocabulary level and consistency
3. Sentence structure patterns
4. Voice personality traits that emerge
5. Any inconsistencies or areas for improvement

Text to analyze:
${text}

Provide a detailed analysis with specific recommendations for improving voice consistency.`

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return 'Unable to analyze voice consistency'
    } catch (error) {
      console.error('Voice analysis error:', error)
      throw error
    }
  }
  
  const suggestVoiceImprovements = async (text: string): Promise<string[]> => {
    try {
      const suggestionPrompt = `Analyze this text and provide 5-7 specific, actionable suggestions for improving its voice and style.

Text:
${text}

Return suggestions as a numbered list, focusing on:
- Tone adjustments
- Vocabulary improvements
- Sentence structure variations
- Clarity enhancements
- Voice personality strengthening

Format each suggestion as a clear, actionable item.`

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: suggestionPrompt
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text.split('\n').filter(line => line.trim().match(/^\d+\./))
      }
      return ['No specific suggestions available']
    } catch (error) {
      console.error('Voice suggestions error:', error)
      throw error
    }
  }
  
  // Backend integration functions
  const searchSimilarContent = async (query: string, creatorName: string): Promise<any[]> => {
    if (!isConnected) {
      console.log('Backend not connected, skipping content search')
      return []
    }
    
    try {
      const response = await fetch('/api/voice/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, creatorName })
      })
      
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Content search error:', error)
      return []
    }
  }
  
  const getVoiceTraits = async (creatorName: string): Promise<VoiceTrait[]> => {
    if (!isConnected) {
      console.log('Backend not connected, skipping trait retrieval')
      return []
    }
    
    try {
      const response = await fetch(`/api/voice/traits/${encodeURIComponent(creatorName)}`)
      
      if (!response.ok) throw new Error('Trait retrieval failed')
      const data = await response.json()
      return data.traits || []
    } catch (error) {
      console.error('Voice traits error:', error)
      return []
    }
  }
  
  return (
    <VoiceContext.Provider value={{
      transformWithVoice,
      expandWithTraits,
      processNaturalCommand,
      analyzeVoiceConsistency,
      suggestVoiceImprovements,
      searchSimilarContent,
      getVoiceTraits,
      availableVoices,
      isConnected
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) throw new Error('useVoice must be used within VoiceProvider')
  return context
}