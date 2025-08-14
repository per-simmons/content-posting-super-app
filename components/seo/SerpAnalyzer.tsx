"use client"

import { useState, useEffect } from 'react'
import { Loader2, Globe, ChevronDown, ChevronRight, TrendingUp, Eye, Clock, Hash, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SerpResult {
  position: number
  title: string
  url: string
  snippet: string
  wordCount?: number
  headings?: number
  hasContent?: boolean
}

interface SerpAnalyzerProps {
  darkMode: boolean
  textSecondary: string
  keywords: string[]
  existingAnalysis?: any
  onAnalysisComplete: (data: any) => void
  onNext: () => void
}

export function SerpAnalyzer({ darkMode, textSecondary, keywords, existingAnalysis, onAnalysisComplete, onNext }: SerpAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SerpResult[]>(existingAnalysis?.results || [])
  const [insights, setInsights] = useState<any>(existingAnalysis?.insights || null)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  const [analysisComplete, setAnalysisComplete] = useState(!!existingAnalysis)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (keywords && keywords.length > 0 && !analysisComplete && !existingAnalysis) {
      startAnalysis()
    }
  }, [keywords, existingAnalysis])

  const startAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90))
    }, 500)

    try {
      const response = await fetch('/api/serp-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keywords[0] })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        const transformedResults = data.data.topResults.slice(0, 5).map((result: any, index: number) => ({
          position: index + 1,
          title: result.title || 'Untitled',
          url: result.url || '',
          snippet: result.snippet || '',
          wordCount: result.extracted?.wordCount || 0,
          headings: result.extracted?.headings?.length || 0,
          hasContent: result.extracted?.hasContent || false
        }))
        
        setResults(transformedResults)
        setInsights(data.data.contentInsights)
        setAnalysisComplete(true)
        
        // Pass full data to parent
        onAnalysisComplete({
          results: transformedResults,
          insights: data.data.contentInsights,
          recommendations: data.data.recommendations
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('SERP analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
      clearInterval(progressInterval)
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  const toggleExpanded = (position: number) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(position)) {
      newExpanded.delete(position)
    } else {
      newExpanded.add(position)
    }
    setExpandedResults(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-sm font-medium mb-2">Analyzing SERP Results</h3>
          <p className={`text-xs ${textSecondary}`}>
            Fetching and analyzing top search results for: <span className="font-medium">{keywords[0]}</span>
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={textSecondary}>Searching with Jina.ai...</span>
                {progress > 30 ? <span className="text-green-500">✓</span> : <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={textSecondary}>Extracting content...</span>
                {progress > 60 ? <span className="text-green-500">✓</span> : progress > 30 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="opacity-50">•</span>}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={textSecondary}>Analyzing with AI...</span>
                {progress >= 100 ? <span className="text-green-500">✓</span> : progress > 60 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="opacity-50">•</span>}
              </div>
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
              <h4 className="text-sm font-medium text-red-600">Analysis Error</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>{error}</p>
              <Button
                onClick={startAnalysis}
                size="sm"
                variant="outline"
                className="mt-3"
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysisComplete) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-sm font-medium mb-2">Ready to Analyze</h3>
          <p className={`text-xs ${textSecondary}`}>
            Click below to start analyzing search results for: <span className="font-medium">{keywords[0]}</span>
          </p>
          <Button
            onClick={startAnalysis}
            size="sm"
            className={`mt-4 ${
              darkMode 
                ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            Start SERP Analysis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">SERP Analysis Complete</h3>
          <p className={`text-xs ${textSecondary} mt-1`}>
            Analyzed {results.length} results for: <span className="font-medium">{keywords[0]}</span>
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
          Continue to Strategy
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result) => {
          const isExpanded = expandedResults.has(result.position)
          
          return (
            <div
              key={result.position}
              className={`rounded-lg border ${
                darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
              } overflow-hidden`}
            >
              <button
                onClick={() => toggleExpanded(result.position)}
                className={`w-full p-4 text-left transition-colors ${
                  darkMode ? 'hover:bg-neutral-900' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-start">
                  <span className={`text-xs font-medium mr-3 mt-0.5 px-1.5 py-0.5 rounded border ${
                    darkMode 
                      ? 'border-neutral-700 text-neutral-400' 
                      : 'border-neutral-300 text-neutral-600'
                  }`}>
                    {result.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium line-clamp-2">{result.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
                            <Globe className="h-3 w-3" />
                            {new URL(result.url).hostname}
                          </span>
                          {result.wordCount && result.wordCount > 0 && (
                            <span className={`text-xs ${textSecondary}`}>
                              {result.wordCount.toLocaleString()} words
                            </span>
                          )}
                          {result.hasContent && (
                            <span className="text-xs text-green-600">
                              Content extracted
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`h-4 w-4 flex-shrink-0 ${textSecondary}`} />
                      ) : (
                        <ChevronRight className={`h-4 w-4 flex-shrink-0 ${textSecondary}`} />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${
                  darkMode ? 'border-neutral-800' : 'border-neutral-100'
                }`}>
                  <div className="pt-4 space-y-3">
                    <p className={`text-xs ${textSecondary}`}>{result.snippet}</p>
                    {result.headings && result.headings > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Hash className="h-3 w-3" />
                        <span>{result.headings} headings found</span>
                      </div>
                    )}
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View full page →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {insights && (
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
        } p-4`}>
          <h4 className="text-sm font-medium mb-3 text-green-600">Content Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className={`text-xs ${textSecondary}`}>Average Word Count</span>
              <p className="text-sm font-medium">{insights.avgWordCount || 'N/A'} words</p>
            </div>
            <div>
              <span className={`text-xs ${textSecondary}`}>Dominant Tone</span>
              <p className="text-sm font-medium capitalize">{insights.dominantTone || 'Balanced'}</p>
            </div>
            {insights.topKeywords && insights.topKeywords.length > 0 && (
              <div className="md:col-span-2">
                <span className={`text-xs ${textSecondary}`}>Top Keywords</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {insights.topKeywords.slice(0, 5).map((kw: any, idx: number) => (
                    <span 
                      key={idx}
                      className={`text-xs px-2 py-0.5 rounded ${
                        darkMode ? 'bg-neutral-800' : 'bg-white border border-neutral-200'
                      }`}
                    >
                      {kw.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}