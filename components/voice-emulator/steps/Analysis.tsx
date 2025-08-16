"use client"

import { useState, useEffect } from 'react'
import { Brain, CheckCircle, Loader2, Lightbulb, Fingerprint, Wand2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalysisProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function Analysis({ darkMode, textSecondary, sessionData, onUpdate, onNext }: AnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentPhase, setCurrentPhase] = useState(0)
  
  // 3-phase analysis process
  const phases = [
    { 
      name: 'Pattern Identification', 
      icon: Lightbulb, 
      description: 'GPT-4.1-mini analyzes writing patterns and recurring themes',
      duration: 45
    },
    { 
      name: 'Trait Synthesis', 
      icon: Fingerprint, 
      description: 'GPT-5 synthesizes unique voice characteristics and style',
      duration: 60 
    },
    { 
      name: 'Prompt Generation', 
      icon: Wand2, 
      description: 'Create system prompt for voice emulation',
      duration: 30
    }
  ]
  
  // Mock analysis results
  const [analysisResults] = useState({
    patterns: [
      {
        category: "Writing Style",
        insights: [
          "Uses short, declarative sentences for maximum impact",
          "Frequently employs rhetorical questions to engage readers",
          "Prefers concrete examples over abstract concepts",
          "Often uses 'you' to directly address the reader"
        ]
      },
      {
        category: "Core Themes",
        insights: [
          "Obsession with simplicity and doing things that don't scale",
          "Emphasis on solving real problems rather than fake ones",
          "Strong belief in the power of programming and technology",
          "Focus on maker culture vs. manager culture distinctions"
        ]
      },
      {
        category: "Argumentation Patterns",
        insights: [
          "Builds arguments through personal anecdotes and Y Combinator experience",
          "Uses counterintuitive insights to challenge conventional wisdom",
          "Often provides historical context for modern problems",
          "Employs thought experiments to illustrate complex concepts"
        ]
      }
    ],
    traits: [
      {
        trait: "Intellectual Curiosity",
        description: "Constantly questions assumptions and explores 'why' behind conventional wisdom",
        strength: 0.92
      },
      {
        trait: "Practical Wisdom",
        description: "Combines theoretical knowledge with hands-on startup experience",
        strength: 0.89
      },
      {
        trait: "Contrarian Thinking",
        description: "Willing to challenge popular opinions with reasoned counterarguments",
        strength: 0.87
      },
      {
        trait: "Educational Tone",
        description: "Writes to teach and enlighten rather than persuade or sell",
        strength: 0.94
      },
      {
        trait: "Technical Depth",
        description: "Deep understanding of programming and technology fundamentals",
        strength: 0.85
      }
    ],
    systemPromptPreview: `You are an AI assistant that emulates Paul Graham's distinctive writing voice and thinking patterns. Write with his characteristic style:

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

When responding, think like a founder and programmer who has seen patterns across hundreds of startups and wants to share hard-earned wisdom with other makers.`
  })

  useEffect(() => {
    if (!analysisComplete) {
      startAnalysis()
    }
  }, [])

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    
    // Phase 1: Pattern Identification (GPT-4.1-mini)
    setCurrentStep('GPT-4.1-mini analyzing writing patterns and themes...')
    setCurrentPhase(1)
    setProgress(15)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setCurrentStep('Extracting argumentation structures and rhetorical devices...')
    setProgress(35)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Phase 2: Trait Synthesis (GPT-5)
    setCurrentStep('GPT-5 synthesizing unique voice characteristics...')
    setCurrentPhase(2)
    setProgress(55)
    await new Promise(resolve => setTimeout(resolve, 3500))
    
    setCurrentStep('Analyzing tone, personality, and communication patterns...')
    setProgress(75)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Phase 3: Prompt Generation
    setCurrentStep('Generating comprehensive system prompt for voice emulation...')
    setCurrentPhase(3)
    setProgress(90)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    setProgress(100)
    setAnalysisComplete(true)
    setIsAnalyzing(false)
    
    onUpdate({
      analysisResults: analysisResults
    })
  }

  const handleNext = () => {
    onNext()
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Brain className="h-12 w-12 mx-auto text-violet-500" />
          <h3 className="text-lg font-medium">AI Voice Analysis</h3>
          <p className={`text-sm ${textSecondary}`}>
            Deep learning analysis to extract voice patterns and characteristics
          </p>
        </div>

        {/* Phase visualization */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {phases.map((phase, index) => {
              const PhaseIcon = phase.icon
              const isActive = currentPhase === index + 1
              const isCompleted = currentPhase > index + 1
              
              return (
                <div key={index} className={`rounded-lg border p-3 transition-all ${
                  isActive 
                    ? darkMode ? 'border-violet-500 bg-violet-950/20' : 'border-violet-300 bg-violet-50'
                    : isCompleted
                      ? darkMode ? 'border-green-500 bg-green-950/20' : 'border-green-300 bg-green-50' 
                      : borderClass + ' ' + bgClass
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <PhaseIcon className={`h-4 w-4 ${
                      isActive ? 'text-violet-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-medium">{index + 1}. {phase.name}</span>
                  </div>
                  <p className={`text-xs ${textSecondary} mb-1`}>{phase.description}</p>
                  <p className={`text-xs ${textSecondary}`}>~{phase.duration}s</p>
                </div>
              )
            })}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className={`text-xs ${textSecondary}`}>{currentStep}</p>
          </div>
        </div>

        {/* Current AI model indicator */}
        <div className="max-w-lg mx-auto">
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-violet-500" />
              <div>
                <h4 className="text-sm font-medium">
                  {currentPhase === 1 ? 'GPT-4.1-mini' : currentPhase === 2 ? 'GPT-5' : 'System Prompt Generator'}
                </h4>
                <p className={`text-xs ${textSecondary}`}>
                  {currentPhase === 1 ? 'Pattern recognition and theme extraction' : 
                   currentPhase === 2 ? 'Advanced trait synthesis and personality mapping' : 
                   'Creating executable voice emulation prompt'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Brain className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Voice Analysis Complete</h3>
        <p className={`text-sm ${textSecondary}`}>
          3-phase AI analysis identified {analysisResults.traits.length} key traits and {analysisResults.patterns.length} pattern categories
        </p>
      </div>

      {/* Analysis results */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Patterns Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h4 className="text-sm font-medium">Identified Patterns</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResults.patterns.map((pattern, index) => (
              <div key={index} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
                <h5 className="text-sm font-medium mb-3">{pattern.category}</h5>
                <div className="space-y-2">
                  {pattern.insights.map((insight, insightIndex) => (
                    <div key={insightIndex} className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className={`text-xs ${textSecondary}`}>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traits Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint className="h-5 w-5 text-blue-500" />
            <h4 className="text-sm font-medium">Voice Characteristics</h4>
          </div>
          
          <div className="space-y-3">
            {analysisResults.traits.map((trait, index) => (
              <div key={index} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium">{trait.trait}</h5>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${trait.strength * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{trait.strength}</span>
                  </div>
                </div>
                <p className={`text-xs ${textSecondary}`}>{trait.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Prompt Preview */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <h4 className="text-sm font-medium">Generated System Prompt (Preview)</h4>
          </div>
          
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <pre className={`text-xs ${textSecondary} whitespace-pre-wrap leading-relaxed`}>
              {analysisResults.systemPromptPreview}
            </pre>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
      } p-4 max-w-lg mx-auto`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-sm font-medium text-green-600">Voice Profile Generated</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              3-phase AI analysis complete - ready for system prompt generation
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleNext} className={`px-6 py-2 ${
          darkMode 
            ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
            : 'bg-neutral-900 text-white hover:bg-neutral-800'
        }`}>
          Continue to Final Results
        </Button>
      </div>
    </div>
  )
}