"use client"

import { useState, useEffect } from 'react'
import { Mail, CheckCircle, Loader2, FileText, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NewsletterExtractionProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function NewsletterExtraction({ darkMode, textSecondary, sessionData, onUpdate, onNext }: NewsletterExtractionProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  
  // Mock extracted newsletter data
  const [extractedContent] = useState([
    {
      title: "How to Start a Startup - Issue #1",
      url: "http://paulgraham.com/articles.html#startup1",
      publishedDate: "2024-01-15",
      excerpt: "The way to get startup ideas is not to try to think of startup ideas..."
    },
    {
      title: "Maker's Schedule, Manager's Schedule - Issue #2", 
      url: "http://paulgraham.com/articles.html#schedule",
      publishedDate: "2024-01-22",
      excerpt: "One reason programmers dislike meetings so much is that they're on a different type of schedule..."
    },
    {
      title: "Do Things that Don't Scale - Issue #3",
      url: "http://paulgraham.com/articles.html#scale", 
      publishedDate: "2024-01-29",
      excerpt: "One of the most common types of advice we give at Y Combinator is to do things that don't scale..."
    }
  ])

  useEffect(() => {
    if (sessionData.contentTypes?.newsletter && !extractionComplete) {
      startExtraction()
    }
  }, [])

  const startExtraction = async () => {
    setIsExtracting(true)
    setProgress(0)
    
    // Simulate 3-step process
    setCurrentStep('Discovering newsletter URLs with Firecrawl...')
    setProgress(20)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setCurrentStep('Classifying newsletter issues with GPT-4.1-mini...')
    setProgress(50)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setCurrentStep('Extracting content with Jina.ai in parallel...')
    setProgress(80)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setProgress(100)
    setExtractionComplete(true)
    setIsExtracting(false)
    
    onUpdate({
      extractedContent: {
        ...sessionData.extractedContent,
        newsletter: extractedContent
      }
    })
  }

  const handleNext = () => {
    onNext()
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isExtracting) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Mail className="h-12 w-12 mx-auto text-blue-500" />
          <h3 className="text-lg font-medium">Extracting Newsletter Content</h3>
          <p className={`text-sm ${textSecondary}`}>
            Processing {sessionData.discoveredSources?.newsletter}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className={`text-xs ${textSecondary}`}>{currentStep}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData.contentTypes?.newsletter) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Mail className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-medium">Newsletter Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            Newsletter content type not selected
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleNext} className={`px-6 py-2 ${
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}>
            Skip to Twitter Extraction
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Mail className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Newsletter Extraction Complete</h3>
        <p className={`text-sm ${textSecondary}`}>
          Extracted {extractedContent.length} newsletter issues
        </p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {extractedContent.map((item, index) => (
          <div key={index} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-medium">{item.title}</h4>
                </div>
                <p className={`text-xs ${textSecondary} mb-2`}>
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className={textSecondary}>
                    Published: {item.publishedDate}
                  </span>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    View original
                  </a>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
      } p-4 max-w-lg mx-auto`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-sm font-medium text-green-600">Extraction Complete</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              3-step process: Firecrawl Map → GPT Classification → Jina Extraction
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
          Continue to Twitter Extraction
        </Button>
      </div>
    </div>
  )
}