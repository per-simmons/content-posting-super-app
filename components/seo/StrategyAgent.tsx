"use client"

import { useState, useEffect } from 'react'
import { 
  Loader2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Target,
  Lightbulb,
  Rocket,
  Star,
  TrendingUp,
  Shield,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StrategyAgentProps {
  darkMode: boolean
  textSecondary: string
  keywords: string[]
  serpAnalysis: any
  existingStrategy?: StrategyOutput | null
  onStrategyComplete: (strategy: any) => void
  onNext: () => void
}

interface StrategyOutput {
  angle: string
  positioning: string
  differentiation: string[]
  targetAudience: string
  contentApproach: string
  uniqueElements: string[]
  missedOpportunities: string[]
  structure?: {
    intro: string
    mainSections: string[]
    callouts: string[]
  }
}

export function StrategyAgent({ 
  darkMode, 
  textSecondary, 
  keywords, 
  serpAnalysis,
  existingStrategy,
  onStrategyComplete, 
  onNext 
}: StrategyAgentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [strategy, setStrategy] = useState<StrategyOutput | null>(existingStrategy || null)
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'analyzing' | 'complete'>(existingStrategy ? 'complete' : 'idle')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const analysisSteps = [
    { icon: FileText, label: "Analyzing SERP patterns", color: "blue" },
    { icon: Sparkles, label: "Identifying unique angles", color: "purple" },
    { icon: Target, label: "Defining positioning strategy", color: "green" },
    { icon: Lightbulb, label: "Crafting content approach", color: "yellow" }
  ]

  useEffect(() => {
    // Start analysis when component mounts and we have the required data
    // but not if we already have a strategy
    if (currentPhase === 'idle' && keywords && keywords.length > 0 && serpAnalysis && !existingStrategy) {
      startAnalysis()
    }
  }, [keywords, serpAnalysis, existingStrategy])

  const startAnalysis = () => {
    setCurrentPhase('analyzing')
    setIsAnalyzing(true)
    runAnalysisSequence()
  }

  const runAnalysisSequence = async () => {
    const stepDuration = 1500
    
    // Animate through steps
    for (let i = 0; i < analysisSteps.length; i++) {
      setTimeout(() => {
        setAnalysisStep(i)
      }, i * stepDuration)
    }

    // After animation, generate real strategy
    setTimeout(async () => {
      await generateStrategy()
    }, analysisSteps.length * stepDuration)
  }

  const generateStrategy = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/strategy-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keyword: keywords[0],
          serpAnalysis: serpAnalysis 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Strategy generation failed')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setStrategy(data.data)
        setCurrentPhase('complete')
        onStrategyComplete(data.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Strategy generation error:', error)
      setError(error instanceof Error ? error.message : 'Strategy generation failed')
      setCurrentPhase('idle')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
          <h3 className="text-sm font-medium mb-2">Generating Content Strategy</h3>
          <p className={`text-xs ${textSecondary}`}>
            Analyzing insights to create unique angle for: <span className="font-medium">{keywords[0]}</span>
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(analysisStep + 1) * 25}%` }}
              />
            </div>
            <div className="space-y-2">
              {analysisSteps.map((step, idx) => {
                const isComplete = idx < analysisStep
                const isActive = idx === analysisStep
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className={textSecondary}>{step.label}</span>
                    {isComplete ? (
                      <span className="text-green-500">✓</span>
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="opacity-50">•</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-red-900 bg-red-950/20' : 'border-red-200 bg-red-50'
        } p-4`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-600">Strategy Generation Error</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>{error}</p>
              <Button
                onClick={startAnalysis}
                size="sm"
                variant="outline"
                className="mt-3"
              >
                Retry Strategy Generation
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!strategy) return null

  return (
    <div className="space-y-6">
      {/* Strategy Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Content Strategy Defined
          </h3>
          <p className={`text-sm ${textSecondary}`}>
            Your unique angle to dominate the SERP for: <span className="font-medium">{keywords[0]}</span>
          </p>
        </div>
        <Button
          onClick={onNext}
          size="sm"
          className={
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }
        >
          Continue to Outline
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Main Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editorial Angle */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
        } p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium">Editorial Angle</h4>
          </div>
          <p className="text-sm mb-3">{strategy.angle}</p>
          <div className={`text-xs ${textSecondary} p-2 rounded`}>
            <strong>Target Audience:</strong> {strategy.targetAudience}
          </div>
        </div>

        {/* Positioning Statement */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
        } p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-medium">Positioning Statement</h4>
          </div>
          <blockquote className={`text-sm italic border-l-4 pl-3 ${
            darkMode ? 'border-yellow-800' : 'border-yellow-400'
          }`}>
            "{strategy.positioning}"
          </blockquote>
          <p className={`text-xs ${textSecondary} mt-3`}>
            Keep this in mind throughout the writing process
          </p>
        </div>
      </div>

      {/* Key Differentiators */}
      <div className={`rounded-lg border ${
        darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
      } p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-green-500" />
          <h4 className="text-sm font-medium">Key Differentiators</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {strategy.differentiation.map((item, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-2 p-2 rounded"
            >
              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unique Elements & Missed Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unique Elements */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
        } p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-medium">Unique Content Elements</h4>
          </div>
          <ul className="space-y-2">
            {strategy.uniqueElements.map((element, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">•</span>
                <span className="text-xs">{element}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missed Opportunities */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
        } p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <h4 className="text-sm font-medium">Competitor Gaps to Fill</h4>
          </div>
          <ul className="space-y-2">
            {strategy.missedOpportunities.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span className="text-xs">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Approach */}
      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-purple-900 bg-purple-950/20' : 'border-purple-200 bg-purple-50'
      } p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-medium text-purple-600">Content Approach</h4>
        </div>
        <p className="text-sm">{strategy.contentApproach}</p>
      </div>

      {/* Success Metrics */}
      <div className="text-center p-4 rounded-lg">
        <p className={`text-xs ${textSecondary}`}>
          This strategy synthesizes insights from <strong>comprehensive SERP analysis</strong>{' '}
          and <strong>AI-powered content insights</strong> to create a defensible content position
        </p>
      </div>
    </div>
  )
}