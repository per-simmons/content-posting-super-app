"use client"

import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle, Loader2, Star, Globe, Search, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlogExtractionProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function BlogExtraction({ darkMode, textSecondary, sessionData, onUpdate, onNext }: BlogExtractionProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentStepNumber, setCurrentStepNumber] = useState(0)
  
  // 4-step process visualization
  const steps = [
    { name: 'URL Discovery', icon: Search, description: 'Firecrawl Map discovers all blog URLs' },
    { name: 'GPT Classification', icon: Target, description: 'GPT-4.1-mini classifies content quality' },
    { name: 'Jina Extraction', icon: Globe, description: 'Jina.ai extracts full content in parallel' },
    { name: 'Popular Posts', icon: Star, description: 'Perplexity finds 5 most popular posts' }
  ]
  
  // Mock extracted blog data including popular posts
  const [extractedContent] = useState([
    {
      title: "Beating the Averages",
      url: "http://paulgraham.com/avg.html",
      publishedDate: "2001-04-01",
      excerpt: "During the years we worked on Viaweb I read a lot of job postings. A new competitor seemed to emerge out of the woodwork every month or so...",
      isPopular: true,
      influenceReason: "Revolutionary essay that introduced Lisp programming to startup culture"
    },
    {
      title: "How to Start a Startup",
      url: "http://paulgraham.com/start.html", 
      publishedDate: "2005-03-01",
      excerpt: "You need three things to create a successful startup: to start with good people, to make something customers actually want, and to spend as little money as possible...",
      isPopular: true,
      influenceReason: "Foundational startup advice that shaped Y Combinator's philosophy"
    },
    {
      title: "Do Things that Don't Scale",
      url: "http://paulgraham.com/ds.html",
      publishedDate: "2013-07-01", 
      excerpt: "One of the most common types of advice we give at Y Combinator is to do things that don't scale...",
      isPopular: true,
      influenceReason: "Counter-intuitive startup wisdom that became Silicon Valley dogma"
    },
    {
      title: "Maker's Schedule, Manager's Schedule",
      url: "http://paulgraham.com/makersschedule.html",
      publishedDate: "2009-07-01",
      excerpt: "One reason programmers dislike meetings so much is that they're on a different type of schedule from other people...",
      isPopular: true,
      influenceReason: "Explained the productivity crisis in tech, widely shared by developers"
    },
    {
      title: "The Python Paradox",
      url: "http://paulgraham.com/pypar.html",
      publishedDate: "2004-08-01",
      excerpt: "In a recent talk I said something that upset a lot of people: that you could get smarter programmers to work on a Python project than you could to work on a Java project...",
      isPopular: true,
      influenceReason: "Sparked debates about programming language choices in startups"
    },
    // Regular posts
    {
      title: "The Age of the Essay",
      url: "http://paulgraham.com/essay.html",
      publishedDate: "2004-09-01",
      excerpt: "Remember the essays you had to write in high school? Topic sentence, introductory paragraph, supporting paragraphs, conclusion...",
      isPopular: false
    },
    {
      title: "Good and Bad Procrastination", 
      url: "http://paulgraham.com/procrastination.html",
      publishedDate: "2005-12-01",
      excerpt: "The most impressive people I know are all terrible procrastinators. So could it be that procrastination isn't always bad?",
      isPopular: false
    }
  ])

  useEffect(() => {
    if (sessionData.contentTypes?.blog && !extractionComplete) {
      startExtraction()
    }
  }, [])

  const startExtraction = async () => {
    setIsExtracting(true)
    setProgress(0)
    
    // Step 1: URL Discovery (Firecrawl Map)
    setCurrentStep('Discovering all blog URLs with Firecrawl Map...')
    setCurrentStepNumber(1)
    setProgress(10)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: GPT Classification  
    setCurrentStep('Classifying content quality with GPT-4.1-mini...')
    setCurrentStepNumber(2)
    setProgress(35)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Step 3: Jina Extraction
    setCurrentStep('Extracting full content with Jina.ai in parallel...')
    setCurrentStepNumber(3) 
    setProgress(60)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Step 4: Perplexity Popular Posts
    setCurrentStep('Finding 5 most popular posts with Perplexity...')
    setCurrentStepNumber(4)
    setProgress(85)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setProgress(100)
    setExtractionComplete(true)
    setIsExtracting(false)
    
    onUpdate({
      extractedContent: {
        ...sessionData.extractedContent,
        blog: extractedContent
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
          <BookOpen className="h-12 w-12 mx-auto text-orange-500" />
          <h3 className="text-lg font-medium">Extracting Blog Content</h3>
          <p className={`text-sm ${textSecondary}`}>
            Processing {sessionData.discoveredSources?.blog}
          </p>
        </div>

        {/* 4-step process visualization */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStepNumber === index + 1
              const isCompleted = currentStepNumber > index + 1
              
              return (
                <div key={index} className={`rounded-lg border p-3 transition-all ${
                  isActive 
                    ? darkMode ? 'border-orange-500 bg-orange-950/20' : 'border-orange-300 bg-orange-50'
                    : isCompleted
                      ? darkMode ? 'border-green-500 bg-green-950/20' : 'border-green-300 bg-green-50' 
                      : borderClass + ' ' + bgClass
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <StepIcon className={`h-4 w-4 ${
                      isActive ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-medium">{index + 1}. {step.name}</span>
                  </div>
                  <p className={`text-xs ${textSecondary}`}>{step.description}</p>
                </div>
              )
            })}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
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

  if (!sessionData.contentTypes?.blog) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-medium">Blog Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            Blog content type not selected
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleNext} className={`px-6 py-2 ${
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}>
            Skip to Consolidation
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <BookOpen className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Blog Extraction Complete</h3>
        <p className={`text-sm ${textSecondary}`}>
          Extracted {extractedContent.length} blog posts ({extractedContent.filter(p => p.isPopular).length} popular)
        </p>
      </div>

      {/* Popular Posts Section */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <h4 className="text-sm font-medium">Most Popular Posts (Perplexity Discovery)</h4>
          </div>
          <div className="space-y-2">
            {extractedContent.filter(post => post.isPopular).map((post, index) => (
              <div key={post.url} className={`rounded-lg border ${borderClass} ${bgClass} p-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <h5 className="text-xs font-medium">{post.title}</h5>
                    </div>
                    <p className={`text-xs ${textSecondary} mb-2`}>
                      {post.influenceReason}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={textSecondary}>
                        Published: {post.publishedDate}
                      </span>
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Posts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <h4 className="text-sm font-medium">Additional Blog Posts</h4>
          </div>
          <div className="space-y-2">
            {extractedContent.filter(post => !post.isPopular).map((post, index) => (
              <div key={post.url} className={`rounded-lg border ${borderClass} ${bgClass} p-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-3 w-3 text-blue-500" />
                      <h5 className="text-xs font-medium">{post.title}</h5>
                    </div>
                    <p className={`text-xs ${textSecondary} mb-2`}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={textSecondary}>
                        Published: {post.publishedDate}
                      </span>
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                </div>
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
            <h4 className="text-sm font-medium text-green-600">4-Step Process Complete</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              Firecrawl Map → GPT Classification → Jina Extraction → Perplexity Popular Posts
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
          Continue to Consolidation
        </Button>
      </div>
    </div>
  )
}