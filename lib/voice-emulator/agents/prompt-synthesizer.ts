import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class PromptSynthesizerAgent {
  private systemPrompt = `You are an expert prompt engineer specializing in creating voice emulation system prompts.

Your task is to synthesize a comprehensive system prompt from analyzed voice patterns and traits.

The prompt should:
1. Capture the authentic voice and personality
2. Include specific behavioral instructions
3. Provide concrete examples of how to respond
4. Define platform-specific variations
5. Include "Do's and Don'ts" based on observed patterns

Return a production-ready system prompt that another AI can use to emulate this voice accurately.`

  async synthesizePrompt(
    voiceProfile: any,
    voiceTraits: any,
    creatorName: string
  ): Promise<string> {
    const userPrompt = `Create a comprehensive system prompt for emulating ${creatorName}'s voice.

VOICE PROFILE DATA:
${JSON.stringify(voiceProfile, null, 2)}

VOICE TRAITS:
${JSON.stringify(voiceTraits, null, 2)}

Generate a detailed system prompt that includes:

1. IDENTITY & ROLE
   - Who you are emulating
   - Your perspective and worldview
   - Your expertise areas

2. TONE & STYLE INSTRUCTIONS
   - Primary and secondary tones to maintain
   - Emotional range and when to use it
   - Specific examples from the data

3. VOCABULARY & LANGUAGE PATTERNS
   - Signature phrases to use (with examples)
   - Words/phrases to avoid
   - Technical jargon usage guidelines

4. STRUCTURAL PATTERNS
   - How to open content (with examples)
   - How to structure arguments
   - How to close/conclude

5. PLATFORM-SPECIFIC GUIDELINES
   - Twitter: How to craft threads, use of hashtags
   - Blog: Long-form structure, depth of analysis
   - LinkedIn: Professional tone adjustments
   - Newsletter: Subscriber relationship tone

6. DO'S AND DON'TS
   Based on the patterns observed:
   DO:
   - [Specific behaviors with examples]
   
   DON'T:
   - [Things to avoid with explanations]

7. EXAMPLE RESPONSES
   Provide 2-3 example responses showing the voice in action.

Make this prompt immediately usable for generating authentic content in ${creatorName}'s voice.`

    const response = await openai.chat.completions.create({
      model: "gpt-5",  // Using GPT-5 for the most advanced synthesis
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 6000
    })

    const systemPrompt = response.choices[0].message.content || ''
    
    // Post-process to ensure quality
    return this.refineSystemPrompt(systemPrompt, creatorName)
  }

  private refineSystemPrompt(prompt: string, creatorName: string): string {
    // Add metadata and structure
    return `# System Prompt for ${creatorName} Voice Emulation
Generated: ${new Date().toISOString()}

${prompt}

---
Note: This prompt was generated through comprehensive analysis of ${creatorName}'s writing patterns across multiple platforms. Update regularly as new content becomes available.`
  }
}

/**
 * Example Output System Prompt:
 * 
 * # System Prompt for Paul Graham Voice Emulation
 * 
 * You are emulating Paul Graham's distinctive writing voice. You are a programmer, 
 * essayist, and startup investor who co-founded Y Combinator.
 * 
 * ## Core Identity
 * - Perspective: Technical founder who values building over talking
 * - Worldview: Startups should focus on users and growth
 * - Expertise: Programming, startups, venture capital, essays
 * 
 * ## Tone & Style
 * Primary: Conversational yet authoritative
 * - Use "Actually" when correcting misconceptions
 * - Use "The thing is" when introducing key insights
 * - Be direct but not harsh
 * 
 * Examples from corpus:
 * - "The thing is, users don't care about your technology stack."
 * - "Actually, most startups fail because they don't talk to users."
 * 
 * ## Vocabulary Patterns
 * Signature phrases:
 * - "What matters is..."
 * - "It turns out..."
 * - "The key insight is..."
 * 
 * Avoid:
 * - Corporate jargon ("synergy", "leverage")
 * - Unnecessary complexity
 * 
 * ## Structural Patterns
 * Opening style:
 * - Start with a question: "Why do startups fail?"
 * - Bold statement: "Most advice about startups is wrong."
 * 
 * Argument structure:
 * - State thesis clearly
 * - Provide concrete examples
 * - Draw broader conclusion
 * 
 * ## Platform Guidelines
 * 
 * Twitter:
 * - Short, punchy insights
 * - One idea per tweet
 * - Threads for complex topics
 * 
 * Blog:
 * - 1000-3000 words typically
 * - Heavy use of examples
 * - Clear section breaks
 * 
 * ## Do's and Don'ts
 * 
 * DO:
 * ✓ Use simple words for complex ideas
 * ✓ Include personal anecdotes from YC
 * ✓ Question conventional wisdom
 * 
 * DON'T:
 * ✗ Use buzzwords or hype
 * ✗ Make claims without evidence
 * ✗ Write in third person
 * 
 * ## Example Response
 * 
 * Question: "What's the most important thing for a startup?"
 * 
 * Response: "The most important thing for a startup is to make something 
 * people want. This sounds obvious, but most founders don't do it. They 
 * make something they think people should want, or something that seems 
 * cool technically. The only way to know if you're making something people 
 * want is to launch quickly and iterate based on user feedback."
 */