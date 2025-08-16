import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class PatternFinderAgent {
  private systemPrompt = `You are a linguistic pattern recognition specialist analyzing writing samples to identify reproducible voice characteristics.

Your task is to analyze content and identify:
1. Specific recurring phrases and expressions (with exact examples)
2. Sentence structure patterns (with examples)
3. Vocabulary preferences and complexity
4. Stylistic markers and quirks
5. Content organization patterns
6. Engagement techniques used

For each pattern you identify, provide:
- The pattern type
- Specific examples from the text (quote directly)
- Frequency (how often it appears)
- Context (when/how it's used)

Return a structured JSON analysis with concrete examples.`

  async analyzePatterns(content: any[], creatorName: string): Promise<any> {
    // Group content by type for better analysis
    const grouped = this.groupContentByType(content)
    
    // Prepare content samples for analysis
    const samples = this.prepareSamples(grouped)
    
    const userPrompt = `Analyze these writing samples from ${creatorName} and identify their unique voice patterns.

Content Samples:

TWEETS (${grouped.tweet?.length || 0} samples):
${grouped.tweet?.slice(0, 10).map((t: any) => `"${t.content}"`).join('\n\n') || 'None'}

BLOG POSTS (${grouped.blog?.length || 0} samples):
${grouped.blog?.slice(0, 3).map((b: any) => `Title: ${b.metadata?.title}\nExcerpt: "${b.content.substring(0, 500)}..."`).join('\n\n') || 'None'}

LINKEDIN POSTS (${grouped.linkedin?.length || 0} samples):
${grouped.linkedin?.slice(0, 5).map((l: any) => `"${l.content.substring(0, 400)}..."`).join('\n\n') || 'None'}

NEWSLETTER (${grouped.newsletter?.length || 0} samples):
${grouped.newsletter?.slice(0, 3).map((n: any) => `Title: ${n.metadata?.title}\nExcerpt: "${n.content.substring(0, 500)}..."`).join('\n\n') || 'None'}

Analyze and return a detailed voice profile with specific examples from the text.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')
      
      // Transform analysis into structured voice profile
      return this.structureVoiceProfile(analysis, creatorName)
      
    } catch (error) {
      console.error("Pattern analysis error:", error)
      throw error
    }
  }

  private groupContentByType(content: any[]) {
    return content.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, any[]>)
  }

  private prepareSamples(grouped: any) {
    const samples: any[] = []
    
    // Get diverse samples from each content type
    if (grouped.tweet) {
      samples.push(...grouped.tweet.slice(0, 20))
    }
    if (grouped.blog) {
      samples.push(...grouped.blog.slice(0, 5))
    }
    if (grouped.linkedin) {
      samples.push(...grouped.linkedin.slice(0, 10))
    }
    if (grouped.newsletter) {
      samples.push(...grouped.newsletter.slice(0, 5))
    }
    
    return samples
  }

  private structureVoiceProfile(analysis: any, creatorName: string) {
    return {
      creator: creatorName,
      analyzedAt: new Date().toISOString(),
      
      tone: {
        primary: analysis.tone?.primary || 'conversational',
        secondary: analysis.tone?.secondary || 'informative',
        emotional_range: analysis.tone?.emotional_range || 'moderate',
        examples: analysis.tone?.examples || []
      },
      
      vocabulary: {
        complexity: analysis.vocabulary?.complexity || 'moderate',
        jargon_usage: analysis.vocabulary?.jargon_usage || 'minimal',
        signature_phrases: analysis.vocabulary?.signature_phrases || [],
        recurring_words: analysis.vocabulary?.recurring_words || [],
        examples: analysis.vocabulary?.examples || []
      },
      
      sentence_structure: {
        avg_length: analysis.sentence_structure?.avg_length || 'medium',
        variety: analysis.sentence_structure?.variety || 'moderate',
        rhythm: analysis.sentence_structure?.rhythm || 'varied',
        patterns: analysis.sentence_structure?.patterns || [],
        examples: analysis.sentence_structure?.examples || []
      },
      
      content_patterns: {
        opening_style: analysis.content_patterns?.opening_style || 'direct',
        argument_structure: analysis.content_patterns?.argument_structure || 'linear',
        closing_style: analysis.content_patterns?.closing_style || 'summary',
        transitions: analysis.content_patterns?.transitions || [],
        examples: analysis.content_patterns?.examples || []
      },
      
      engagement: {
        techniques: analysis.engagement?.techniques || [],
        audience_relationship: analysis.engagement?.audience_relationship || 'peer-to-peer',
        humor_style: analysis.engagement?.humor_style || 'none',
        examples: analysis.engagement?.examples || []
      },
      
      unique_markers: {
        quirks: analysis.unique_markers?.quirks || [],
        formatting: analysis.unique_markers?.formatting || [],
        topics: analysis.unique_markers?.topics || [],
        specific_examples: analysis.unique_markers?.specific_examples || []
      },
      
      platform_specific: {
        twitter: analysis.platform_specific?.twitter || {},
        blog: analysis.platform_specific?.blog || {},
        linkedin: analysis.platform_specific?.linkedin || {},
        newsletter: analysis.platform_specific?.newsletter || {}
      }
    }
  }
}

/**
 * Example Voice Profile Output for Paul Graham:
 * 
 * {
 *   tone: {
 *     primary: "conversational yet authoritative",
 *     secondary: "philosophical",
 *     emotional_range: "controlled enthusiasm",
 *     examples: [
 *       "When he's excited: 'This is the key insight that changed everything'",
 *       "When skeptical: 'I'm not sure that's actually true'"
 *     ]
 *   },
 *   
 *   vocabulary: {
 *     complexity: "deliberately simple",
 *     jargon_usage: "minimal, explains technical terms",
 *     signature_phrases: [
 *       "The thing is",
 *       "What matters is",
 *       "Actually",
 *       "It turns out"
 *     ],
 *     recurring_words: ["startup", "founder", "build", "users"],
 *     examples: [
 *       "Uses 'build' instead of 'develop' or 'create'",
 *       "Says 'users' not 'customers' or 'clients'"
 *     ]
 *   },
 *   
 *   sentence_structure: {
 *     avg_length: "short to medium",
 *     variety: "high",
 *     rhythm: "punchy with occasional long explanatory sentences",
 *     patterns: [
 *       "Question followed by answer",
 *       "Bold statement then explanation",
 *       "Short sentences for emphasis"
 *     ],
 *     examples: [
 *       "Question pattern: 'Why do startups fail? Usually it's because...'",
 *       "Emphasis: 'This matters. A lot.'"
 *     ]
 *   },
 *   
 *   unique_markers: {
 *     quirks: [
 *       "Parenthetical asides for clarification",
 *       "Self-corrections mid-sentence",
 *       "Historical references and analogies"
 *     ],
 *     specific_examples: [
 *       "Parenthetical: '(though not always in the way you'd expect)'",
 *       "Self-correction: 'Well, actually, that's not quite right. What I mean is...'"
 *     ]
 *   }
 * }
 */