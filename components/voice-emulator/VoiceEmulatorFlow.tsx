"use client"

import { useState } from 'react'
import { CreatorSetup } from './steps/CreatorSetup'
import { SourceDiscovery } from './steps/SourceDiscovery'
import { NewsletterExtraction } from './steps/NewsletterExtraction'
import { TwitterExtraction } from './steps/TwitterExtraction'
import { LinkedInExtraction } from './steps/LinkedInExtraction'
import { BlogExtraction } from './steps/BlogExtraction'
import { Consolidation } from './steps/Consolidation'
import { Vectorization } from './steps/Vectorization'
import { Retrieval } from './steps/Retrieval'
import { Analysis } from './steps/Analysis'
import { FinalResults } from './steps/FinalResults'

interface VoiceEmulatorFlowProps {
  darkMode: boolean
  textSecondary: string
}

export function VoiceEmulatorFlow({ darkMode, textSecondary }: VoiceEmulatorFlowProps) {
  const VOICE_EMULATOR_STEPS = [
    "Creator Setup",           // Step 1: Name + content type checkboxes
    "Source Discovery",        // Step 2: Perplexity auto-discovery with edit capability  
    "Newsletter Extraction",   // Step 3: Firecrawl Map + GPT Classification + Jina extraction
    "Twitter Extraction",      // Step 4: Apify actor (20+ min async)
    "LinkedIn Extraction",     // Step 5: Apify actor (30+ min async)
    "Blog Extraction",         // Step 6: 4-step optimized (Firecrawl + GPT + Jina + Perplexity)
    "Consolidation",           // Step 7: Merge all content + create Google Docs
    "Vectorization",           // Step 8: Contextual retrieval embeddings
    "Retrieval",               // Step 9: Semantic search system
    "Analysis",                // Step 10: 3-phase AI (Pattern + Traits + Prompt)
    "Final Results"            // Step 11: System prompt + Command-E integration
  ] as const

  const [stepIndex, setStepIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Session data that gets passed between steps - with mock data for demo
  const [sessionData, setSessionData] = useState({
    creatorName: 'Paul Graham',
    contentTypes: {
      newsletter: true,
      twitter: true,
      linkedin: false,
      blog: true
    },
    discoveredSources: {
      newsletter: 'http://paulgraham.com/articles.html',
      twitter: '@paulg',
      linkedin: '',
      blog: 'http://paulgraham.com'
    },
    extractedContent: {
      newsletter: [],
      twitter: [],
      linkedin: [],
      blog: []
    },
    consolidatedContent: null,
    vectorizedContent: null,
    retrievalSystem: null,
    analysisResults: null,
    voiceProfile: null,
    documents: []
  })

  function next() {
    setStepIndex((i) => Math.min(i + 1, VOICE_EMULATOR_STEPS.length - 1))
  }

  function prev() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function updateSessionData(updates: any) {
    setSessionData(prev => ({ ...prev, ...updates }))
  }

  const borderClass = darkMode 
    ? "border-neutral-800" 
    : "border-neutral-200"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Voice Emulator</h1>
        <p className={`text-sm ${textSecondary}`}>
          Extract and analyze a creator's voice through their content
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2">
        {VOICE_EMULATOR_STEPS.map((label, idx) => {
          const isActive = idx === stepIndex
          const isCompleted = idx < stepIndex
          
          return (
            <button
              key={idx}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? darkMode
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-900 text-white"
                  : isCompleted
                    ? darkMode
                      ? "bg-green-900 text-green-100"
                      : "bg-green-100 text-green-800"
                    : darkMode
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-50"
              } whitespace-nowrap`}
              onClick={() => setStepIndex(idx)}
              aria-current={isActive ? "step" : undefined}
            >
              {idx + 1}. {label}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className={`rounded-md border ${borderClass} p-6`}>
        {stepIndex === 0 && (
          <CreatorSetup 
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 1 && (
          <SourceDiscovery
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 2 && (
          <NewsletterExtraction
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 3 && (
          <TwitterExtraction
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 4 && (
          <LinkedInExtraction
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 5 && (
          <BlogExtraction
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 6 && (
          <Consolidation
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 7 && (
          <Vectorization
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 8 && (
          <Retrieval
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 9 && (
          <Analysis
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}
        
        {stepIndex === 10 && (
          <FinalResults
            darkMode={darkMode}
            textSecondary={textSecondary}
            sessionData={sessionData}
            onUpdate={updateSessionData}
            onNext={next}
          />
        )}

        {/* Navigation buttons - only show for steps that need manual navigation */}
        {stepIndex > 0 && stepIndex !== VOICE_EMULATOR_STEPS.length - 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                stepIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : darkMode
                    ? "bg-neutral-800 text-white hover:bg-neutral-700"
                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
              }`}
              disabled={stepIndex === 0}
              onClick={prev}
            >
              Previous
            </button>
            <div className={`text-sm ${textSecondary}`}>
              Step {stepIndex + 1} of {VOICE_EMULATOR_STEPS.length}
            </div>
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                stepIndex === VOICE_EMULATOR_STEPS.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : darkMode
                    ? "bg-white text-neutral-900 hover:bg-neutral-100"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
              disabled={stepIndex === VOICE_EMULATOR_STEPS.length - 1}
              onClick={next}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}