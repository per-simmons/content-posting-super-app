"use client"

import { useState, useEffect } from 'react'
import { Cpu, CheckCircle, Loader2, Zap, Database, Layers3, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VectorizationProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function Vectorization({ darkMode, textSecondary, sessionData, onUpdate, onNext }: VectorizationProps) {
  const [isVectorizing, setIsVectorizing] = useState(false)
  const [vectorizationComplete, setVectorizationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentPhase, setCurrentPhase] = useState(0)
  
  // Vectorization phases
  const phases = [
    { 
      name: 'Text Chunking', 
      icon: Layers3, 
      description: 'Split content into 512-token chunks with 20% overlap' 
    },
    { 
      name: 'Contextual Embedding', 
      icon: Cpu, 
      description: 'Generate embeddings with surrounding context for better retrieval' 
    },
    { 
      name: 'Vector Indexing', 
      icon: Database, 
      description: 'Create semantic search index with metadata' 
    },
    { 
      name: 'Retrieval Testing', 
      icon: Target, 
      description: 'Validate retrieval quality with test queries' 
    }
  ]
  
  // Mock vectorization results
  const [vectorizationData] = useState({
    totalChunks: 347,
    embeddingDimensions: 1536,
    chunksByType: {
      newsletter: 89,
      twitter: 23,
      linkedin: 31,
      blog: 204
    },
    retrievalMetrics: {
      averageRelevanceScore: 0.87,
      topKAccuracy: 0.94,
      semanticCohesion: 0.91
    },
    contextualEnhancements: [
      "Added paragraph-level context for better semantic understanding",
      "Preserved content source metadata for attribution",
      "Enhanced with publishing dates for temporal relevance",
      "Included engagement metrics for popularity weighting"
    ]
  })

  useEffect(() => {
    if (!vectorizationComplete) {
      startVectorization()
    }
  }, [])

  const startVectorization = async () => {
    setIsVectorizing(true)
    setProgress(0)
    
    // Phase 1: Text Chunking
    setCurrentStep('Chunking content into 512-token segments with overlap...')
    setCurrentPhase(1)
    setProgress(15)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Phase 2: Contextual Embedding  
    setCurrentStep('Generating contextual embeddings with OpenAI text-embedding-3-large...')
    setCurrentPhase(2)
    setProgress(45)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Phase 3: Vector Indexing
    setCurrentStep('Creating semantic search index with metadata...')
    setCurrentPhase(3)
    setProgress(75)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Phase 4: Retrieval Testing
    setCurrentStep('Testing retrieval quality with validation queries...')
    setCurrentPhase(4)
    setProgress(95)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setProgress(100)
    setVectorizationComplete(true)
    setIsVectorizing(false)
    
    onUpdate({
      vectorizedContent: vectorizationData
    })
  }

  const handleNext = () => {
    onNext()
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isVectorizing) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Cpu className="h-12 w-12 mx-auto text-indigo-500" />
          <h3 className="text-lg font-medium">Vectorizing Content</h3>
          <p className={`text-sm ${textSecondary}`}>
            Creating semantic embeddings for contextual retrieval
          </p>
        </div>

        {/* Phase visualization */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            {phases.map((phase, index) => {
              const PhaseIcon = phase.icon
              const isActive = currentPhase === index + 1
              const isCompleted = currentPhase > index + 1
              
              return (
                <div key={index} className={`rounded-lg border p-3 transition-all ${
                  isActive 
                    ? darkMode ? 'border-indigo-500 bg-indigo-950/20' : 'border-indigo-300 bg-indigo-50'
                    : isCompleted
                      ? darkMode ? 'border-green-500 bg-green-950/20' : 'border-green-300 bg-green-50' 
                      : borderClass + ' ' + bgClass
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <PhaseIcon className={`h-4 w-4 ${
                      isActive ? 'text-indigo-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-medium">{index + 1}. {phase.name}</span>
                  </div>
                  <p className={`text-xs ${textSecondary}`}>{phase.description}</p>
                </div>
              )
            })}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className={`text-xs ${textSecondary}`}>{currentStep}</p>
          </div>
        </div>

        {/* Real-time stats */}
        <div className="max-w-lg mx-auto">
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Processing Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className={textSecondary}>Chunks Created:</span>
                <span className="font-mono ml-2">{Math.floor(347 * (progress / 100))}</span>
              </div>
              <div>
                <span className={textSecondary}>Dimensions:</span>
                <span className="font-mono ml-2">1536</span>
              </div>
              <div>
                <span className={textSecondary}>Content Types:</span>
                <span className="font-mono ml-2">4</span>
              </div>
              <div>
                <span className={textSecondary}>Context Window:</span>
                <span className="font-mono ml-2">512 tokens</span>
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
        <Cpu className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Vectorization Complete</h3>
        <p className={`text-sm ${textSecondary}`}>
          Created {vectorizationData.totalChunks} semantic chunks with {vectorizationData.embeddingDimensions}D embeddings
        </p>
      </div>

      {/* Vectorization summary */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Layers3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Content Chunks</span>
            </div>
            <div className="space-y-1">
              {Object.entries(vectorizationData.chunksByType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className={`capitalize ${textSecondary}`}>{type}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Total:</span>
                  <span className="font-mono">{vectorizationData.totalChunks}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Retrieval Quality</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={textSecondary}>Relevance:</span>
                <span className="font-mono">{vectorizationData.retrievalMetrics.averageRelevanceScore}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={textSecondary}>Top-K Accuracy:</span>
                <span className="font-mono">{vectorizationData.retrievalMetrics.topKAccuracy}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={textSecondary}>Cohesion:</span>
                <span className="font-mono">{vectorizationData.retrievalMetrics.semanticCohesion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual enhancements */}
        <div className={`rounded-lg border ${borderClass} ${bgClass} p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Contextual Enhancements</span>
          </div>
          <div className="space-y-2">
            {vectorizationData.contextualEnhancements.map((enhancement, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className={`text-xs ${textSecondary}`}>{enhancement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
      } p-4 max-w-lg mx-auto`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-sm font-medium text-green-600">Contextual Retrieval Ready</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              Semantic search index optimized for voice pattern analysis
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
          Continue to Retrieval
        </Button>
      </div>
    </div>
  )
}