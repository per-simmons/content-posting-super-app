"use client"

import { useState, useEffect } from 'react'
import { Search, CheckCircle, Loader2, Target, Zap, Brain, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RetrievalProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function Retrieval({ darkMode, textSecondary, sessionData, onUpdate, onNext }: RetrievalProps) {
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildComplete, setBuildComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  
  // Test queries to demonstrate retrieval
  const testQueries = [
    "How does Paul Graham think about startup ideas?",
    "What is Paul Graham's opinion on programming languages?", 
    "Paul Graham's advice on scaling startups",
    "How should founders approach hiring decisions?",
    "What makes successful entrepreneurs different?"
  ]
  
  // Mock retrieval results
  const [retrievalSystem] = useState({
    totalVectors: 347,
    indexingComplete: true,
    averageQueryTime: 12, // ms
    testResults: [
      {
        query: "How does Paul Graham think about startup ideas?",
        topResults: [
          {
            content: "The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.",
            source: "How to Start a Startup",
            relevanceScore: 0.94,
            contentType: "blog"
          },
          {
            content: "One of the most common types of advice we give at Y Combinator is to do things that don't scale.",
            source: "Do Things that Don't Scale", 
            relevanceScore: 0.87,
            contentType: "blog"
          },
          {
            content: "The best startup ideas seem at first like bad ideas. If they were obviously good ideas, someone would have done them already.",
            source: "Newsletter Issue #5",
            relevanceScore: 0.83,
            contentType: "newsletter"
          }
        ]
      },
      {
        query: "What is Paul Graham's opinion on programming languages?",
        topResults: [
          {
            content: "In a recent talk I said something that upset a lot of people: that you could get smarter programmers to work on a Python project than you could to work on a Java project.",
            source: "The Python Paradox",
            relevanceScore: 0.91,
            contentType: "blog"
          },
          {
            content: "When we started Viaweb, we had a very unusual thing: a web application written entirely in Lisp.",
            source: "Beating the Averages",
            relevanceScore: 0.88,
            contentType: "blog"
          },
          {
            content: "Lisp is worth learning for the profound enlightenment experience you will have when you finally get it.",
            source: "@paulg Twitter",
            relevanceScore: 0.82,
            contentType: "twitter"
          }
        ]
      }
    ]
  })

  useEffect(() => {
    if (!buildComplete) {
      startBuilding()
    }
  }, [])

  const startBuilding = async () => {
    setIsBuilding(true)
    setProgress(0)
    
    // Step 1: Initialize semantic search
    setCurrentStep('Initializing semantic search engine...')
    setProgress(20)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Step 2: Build query processing pipeline
    setCurrentStep('Building query processing pipeline...')
    setProgress(45)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Test retrieval queries
    setCurrentStep('Testing retrieval with sample queries...')
    setProgress(70)
    for (let i = 0; i < testQueries.length; i++) {
      setCurrentQuery(testQueries[i])
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    // Step 4: Optimize retrieval parameters
    setCurrentStep('Optimizing retrieval parameters and ranking...')
    setProgress(95)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setProgress(100)
    setBuildComplete(true)
    setIsBuilding(false)
    
    onUpdate({
      retrievalSystem: retrievalSystem
    })
  }

  const handleNext = () => {
    onNext()
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isBuilding) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Search className="h-12 w-12 mx-auto text-emerald-500" />
          <h3 className="text-lg font-medium">Building Retrieval System</h3>
          <p className={`text-sm ${textSecondary}`}>
            Creating semantic search engine for voice pattern analysis
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center space-y-2">
            <p className={`text-xs ${textSecondary}`}>{currentStep}</p>
            {currentQuery && (
              <div className={`rounded-lg border ${borderClass} ${bgClass} p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <Search className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium">Testing Query:</span>
                </div>
                <p className="text-xs text-emerald-600 italic">"{currentQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Real-time stats */}
        <div className="max-w-lg mx-auto">
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Retrieval Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className={textSecondary}>Vector Index:</span>
                <span className="font-mono ml-2">{retrievalSystem.totalVectors} chunks</span>
              </div>
              <div>
                <span className={textSecondary}>Query Time:</span>
                <span className="font-mono ml-2">{retrievalSystem.averageQueryTime}ms avg</span>
              </div>
              <div>
                <span className={textSecondary}>Test Queries:</span>
                <span className="font-mono ml-2">{testQueries.length}</span>
              </div>
              <div>
                <span className={textSecondary}>Top-K Results:</span>
                <span className="font-mono ml-2">3 per query</span>
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
        <Search className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Retrieval System Ready</h3>
        <p className={`text-sm ${textSecondary}`}>
          Semantic search engine built with {retrievalSystem.totalVectors} indexed chunks
        </p>
      </div>

      {/* Query examples and results */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-emerald-500" />
          <h4 className="text-sm font-medium">Retrieval Test Results</h4>
        </div>
        
        <div className="space-y-6">
          {retrievalSystem.testResults.map((test, testIndex) => (
            <div key={testIndex} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
              {/* Query */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Query:</span>
                </div>
                <p className="text-sm text-emerald-600 italic">"{test.query}"</p>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Top Results:</span>
                </div>
                
                {test.topResults.map((result, resultIndex) => (
                  <div key={resultIndex} className={`rounded border ${
                    darkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'
                  } p-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm mb-2">"{result.content}"</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`flex items-center gap-1 ${textSecondary}`}>
                            <ArrowRight className="h-3 w-3" />
                            {result.source}
                          </span>
                          <span className={`capitalize ${textSecondary}`}>
                            {result.contentType}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                          {result.relevanceScore}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System performance */}
      <div className="max-w-lg mx-auto">
        <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Performance Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className={textSecondary}>Average Query Time:</span>
              <span className="font-mono ml-2 text-green-600">{retrievalSystem.averageQueryTime}ms</span>
            </div>
            <div>
              <span className={textSecondary}>Index Size:</span>
              <span className="font-mono ml-2">{retrievalSystem.totalVectors} vectors</span>
            </div>
            <div>
              <span className={textSecondary}>Relevance Threshold:</span>
              <span className="font-mono ml-2">0.75+</span>
            </div>
            <div>
              <span className={textSecondary}>Content Coverage:</span>
              <span className="font-mono ml-2">100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
      } p-4 max-w-lg mx-auto`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-sm font-medium text-green-600">Semantic Search Optimized</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              Ready for AI-powered voice pattern analysis with contextual retrieval
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
          Continue to Analysis
        </Button>
      </div>
    </div>
  )
}