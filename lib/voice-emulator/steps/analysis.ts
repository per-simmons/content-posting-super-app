import { PatternFinderAgent } from '../agents/pattern-finder'
import { generateVoiceTraits } from './voice-traits'
import { PromptSynthesizerAgent } from '../agents/prompt-synthesizer'

/**
 * Complete Analysis Flow:
 * 1. Pattern Finding (GPT-4.1-mini) - Analyzes content for patterns with examples
 * 2. Voice Traits Generation (GPT-4.1-mini) - Converts patterns to actionable traits
 * 3. Prompt Synthesis (GPT-5) - Creates final system prompt
 */
export async function runAnalysisStep(sessionId: string, context: any) {
  const { allContent = [], creatorName } = context
  
  console.log(`Starting comprehensive analysis for ${creatorName}...`)
  console.log(`Analyzing ${allContent.length} content pieces`)
  
  try {
    // Step 1: Pattern Finding with GPT-4.1-mini
    console.log('Step 1: Finding patterns with specific examples...')
    const patternFinder = new PatternFinderAgent()
    const voiceProfile = await patternFinder.analyzePatterns(allContent, creatorName)
    
    // Step 2: Generate Voice Traits from patterns
    console.log('Step 2: Generating actionable voice traits...')
    const voiceTraits = await generateVoiceTraits(voiceProfile, creatorName)
    
    // Step 3: Synthesize System Prompt with GPT-5
    console.log('Step 3: Synthesizing final system prompt...')
    const promptSynthesizer = new PromptSynthesizerAgent()
    const systemPrompt = await promptSynthesizer.synthesizePrompt(
      voiceProfile,
      voiceTraits,
      creatorName
    )
    
    // Return comprehensive analysis results
    return {
      voiceProfile,       // Detailed patterns with examples
      voiceTraits,        // Actionable behavioral traits
      systemPrompt,       // Final emulation prompt
      confidence: voiceTraits.confidence || 0.85,
      samplesAnalyzed: allContent.length,
      analysisSteps: {
        patternFinding: {
          model: 'gpt-4.1-mini',
          purpose: 'Identify writing patterns with specific examples',
          output: 'Structured voice profile with quoted examples'
        },
        traitGeneration: {
          model: 'gpt-4.1-mini',
          purpose: 'Convert patterns into actionable traits',
          output: 'Behavioral rules and triggers'
        },
        promptSynthesis: {
          model: 'gpt-5',
          purpose: 'Create production-ready system prompt',
          output: 'Complete voice emulation instructions'
        }
      }
    }
  } catch (error) {
    console.error('Analysis step error:', error)
    
    // Fallback to basic analysis if agents fail
    return {
      voiceProfile: generateFallbackProfile(creatorName, allContent),
      confidence: 0.5,
      samplesAnalyzed: allContent.length,
      error: 'Partial analysis completed with fallback method'
    }
  }
}

/**
 * Fallback profile generation if AI agents fail
 */
function generateFallbackProfile(creatorName: string, content: any[]) {
  return {
    creator: creatorName,
    tone: {
      primary: 'conversational',
      secondary: 'informative',
      emotional_range: 'moderate',
      examples: []
    },
    vocabulary: {
      complexity: 'moderate',
      jargon_usage: 'context-dependent',
      signature_phrases: [],
      recurring_words: [],
      examples: []
    },
    sentence_structure: {
      avg_length: 'medium',
      variety: 'moderate',
      rhythm: 'varied',
      patterns: [],
      examples: []
    },
    content_patterns: {
      opening_style: 'direct',
      argument_structure: 'linear',
      closing_style: 'summary',
      transitions: [],
      examples: []
    },
    engagement: {
      techniques: [],
      audience_relationship: 'professional',
      humor_style: 'minimal',
      examples: []
    },
    unique_markers: {
      quirks: [],
      formatting: [],
      topics: [],
      specific_examples: []
    },
    platform_specific: {
      twitter: {},
      blog: {},
      linkedin: {},
      newsletter: {}
    }
  }
}