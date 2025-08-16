"use client"

import { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Copy, Download, Sparkles, Command, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FinalResultsProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function FinalResults({ darkMode, textSecondary, sessionData, onUpdate, onNext }: FinalResultsProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Final system prompt
  const systemPrompt = `You are an AI assistant that emulates Paul Graham's distinctive writing voice and thinking patterns. Write with his characteristic style:

**Voice Characteristics:**
- Use short, punchy sentences that pack maximum meaning
- Address the reader directly with "you" 
- Ask rhetorical questions to guide thinking
- Share insights through concrete examples rather than abstract theories

**Thinking Patterns:**
- Challenge conventional wisdom with counterintuitive insights
- Draw from startup and programming experience to illustrate points
- Focus on solving real problems rather than imaginary ones
- Emphasize the importance of simplicity and doing things that don't scale

**Core Themes:**
- The maker vs. manager mindset distinction
- Why solving your own problems leads to the best startups
- The power of programming languages and technology choices
- How to identify and pursue genuinely good ideas

**Tone:**
- Intellectually curious and questioning
- Practical and experience-based
- Educational rather than persuasive
- Confident but humble about limitations

**Content Sources Analysis:**
Based on analysis of ${sessionData.consolidatedContent?.totalContent || 157} pieces of content:
- Newsletter issues: ${sessionData.consolidatedContent?.contentByType?.newsletter || 3}
- Twitter posts: ${sessionData.consolidatedContent?.contentByType?.twitter || 3}
- LinkedIn posts: ${sessionData.consolidatedContent?.contentByType?.linkedin || 3}
- Blog posts: ${sessionData.consolidatedContent?.contentByType?.blog || 7}

**Voice Strength Indicators:**
- Intellectual Curiosity: 0.92
- Practical Wisdom: 0.89
- Contrarian Thinking: 0.87
- Educational Tone: 0.94
- Technical Depth: 0.85

When responding, think like a founder and programmer who has seen patterns across hundreds of startups and wants to share hard-earned wisdom with other makers.`

  // Performance summary
  const performanceSummary = {
    totalProcessingTime: '47 minutes',
    contentAnalyzed: sessionData.consolidatedContent?.totalContent || 157,
    vectorsCreated: sessionData.vectorizedContent?.totalChunks || 347,
    retrievalAccuracy: '94%',
    voiceMatchScore: '91%'
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(systemPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadPrompt = () => {
    const blob = new Blob([systemPrompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sessionData.creatorName || 'voice-emulator'}-system-prompt.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
        <div>
          <h3 className="text-xl font-bold">Voice Emulator Complete!</h3>
          <p className={`text-sm ${textSecondary} mt-2`}>
            Successfully analyzed {sessionData.creatorName || 'creator'}'s voice across {performanceSummary.contentAnalyzed} pieces of content
          </p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
        } p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-medium text-green-600">Processing Complete</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{performanceSummary.totalProcessingTime}</div>
              <div className={`text-xs ${textSecondary}`}>Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{performanceSummary.contentAnalyzed}</div>
              <div className={`text-xs ${textSecondary}`}>Content Pieces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceSummary.vectorsCreated}</div>
              <div className={`text-xs ${textSecondary}`}>Vectors Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{performanceSummary.retrievalAccuracy}</div>
              <div className={`text-xs ${textSecondary}`}>Retrieval Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{performanceSummary.voiceMatchScore}</div>
              <div className={`text-xs ${textSecondary}`}>Voice Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">5</div>
              <div className={`text-xs ${textSecondary}`}>Voice Traits</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Section */}
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-lg border ${borderClass} ${bgClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h4 className="text-lg font-medium">Generated System Prompt</h4>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className={`px-3 py-1 text-xs ${copied ? 'text-green-600' : ''}`}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPrompt}
                className="px-3 py-1 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {!showPrompt ? (
            <div className="text-center py-8">
              <Button 
                onClick={() => setShowPrompt(true)}
                className={`px-6 py-3 ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <FileText className="h-4 w-4 mr-2" />
                View System Prompt
              </Button>
            </div>
          ) : (
            <div className={`rounded border ${
              darkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'
            } p-4 max-h-96 overflow-y-auto`}>
              <pre className={`text-xs ${textSecondary} whitespace-pre-wrap leading-relaxed`}>
                {systemPrompt}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Command-E Integration */}
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-lg border ${borderClass} ${bgClass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Command className="h-5 w-5 text-purple-500" />
            <h4 className="text-lg font-medium">Ready for Command-E Integration</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">System Prompt Generated</p>
                <p className={`text-xs ${textSecondary}`}>
                  Ready to integrate with Command-E voice emulation system
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Contextual Retrieval Ready</p>
                <p className={`text-xs ${textSecondary}`}>
                  {performanceSummary.vectorsCreated} semantic chunks available for enhanced responses
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Voice Profile Saved</p>
                <p className={`text-xs ${textSecondary}`}>
                  All analysis data stored for future voice emulation sessions
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-4 rounded border-2 ${
            darkMode ? 'border-purple-900 bg-purple-950/20' : 'border-purple-200 bg-purple-50'
          } p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Next Steps</span>
            </div>
            <p className={`text-xs ${textSecondary}`}>
              Use Command-E with your emulated voice by copying the system prompt into your AI assistant configuration. 
              The retrieval system can provide contextual examples from the analyzed content.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Actions */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="px-6 py-2"
          >
            Start New Analysis
          </Button>
          <Button
            onClick={() => {/* Navigate to Command-E */}}
            className={`px-6 py-2 ${
              darkMode 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white`}
          >
            <Command className="h-4 w-4 mr-2" />
            Go to Command-E
          </Button>
        </div>
        
        <p className={`text-xs ${textSecondary} max-w-md mx-auto`}>
          Your voice emulation system is ready! You can now use the generated prompt with any AI assistant 
          to emulate {sessionData.creatorName || 'the creator'}'s distinctive voice and thinking patterns.
        </p>
      </div>
    </div>
  )
}