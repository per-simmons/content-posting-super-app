"use client"

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Loader2, Mail, Twitter, Linkedin, BookOpen, Layers, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConsolidationProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function Consolidation({ darkMode, textSecondary, sessionData, onUpdate, onNext }: ConsolidationProps) {
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [consolidationComplete, setConsolidationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  
  // Mock consolidated data
  const [consolidatedData] = useState({
    totalContent: 157,
    contentByType: {
      newsletter: 3,
      twitter: 3,
      linkedin: 3,
      blog: 7
    },
    googleDocs: [
      {
        name: "Paul Graham - Newsletter Content",
        url: "https://docs.google.com/document/d/1abc123",
        type: "newsletter",
        itemCount: 3
      },
      {
        name: "Paul Graham - Twitter Posts", 
        url: "https://docs.google.com/document/d/1def456",
        type: "twitter",
        itemCount: 3
      },
      {
        name: "Paul Graham - LinkedIn Posts",
        url: "https://docs.google.com/document/d/1ghi789", 
        type: "linkedin",
        itemCount: 3
      },
      {
        name: "Paul Graham - Blog Posts",
        url: "https://docs.google.com/document/d/1jkl012",
        type: "blog", 
        itemCount: 7
      },
      {
        name: "Paul Graham - Master Content Collection",
        url: "https://docs.google.com/document/d/1mno345",
        type: "master",
        itemCount: 16
      }
    ]
  })

  useEffect(() => {
    if (!consolidationComplete) {
      startConsolidation()
    }
  }, [])

  const startConsolidation = async () => {
    setIsConsolidating(true)
    setProgress(0)
    
    // Step 1: Merge newsletter content
    setCurrentStep('Merging newsletter content...')
    setProgress(15)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 2: Merge social media content
    setCurrentStep('Merging Twitter and LinkedIn content...')
    setProgress(35)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Step 3: Merge blog content  
    setCurrentStep('Merging blog posts and popular content...')
    setProgress(55)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Step 4: Create individual Google Docs
    setCurrentStep('Creating individual Google Docs by content type...')
    setProgress(75)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 5: Create master document
    setCurrentStep('Creating master content collection document...')
    setProgress(95)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setProgress(100)
    setConsolidationComplete(true)
    setIsConsolidating(false)
    
    onUpdate({
      consolidatedContent: consolidatedData
    })
  }

  const handleNext = () => {
    onNext()
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'newsletter': return Mail
      case 'twitter': return Twitter
      case 'linkedin': return Linkedin
      case 'blog': return BookOpen
      case 'master': return Layers
      default: return FileText
    }
  }

  const getContentColor = (type: string) => {
    switch (type) {
      case 'newsletter': return 'text-blue-500'
      case 'twitter': return 'text-blue-400' 
      case 'linkedin': return 'text-blue-600'
      case 'blog': return 'text-orange-500'
      case 'master': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isConsolidating) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Layers className="h-12 w-12 mx-auto text-purple-500" />
          <h3 className="text-lg font-medium">Consolidating Content</h3>
          <p className={`text-sm ${textSecondary}`}>
            Merging all extracted content and creating Google Docs
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className={`text-xs ${textSecondary}`}>{currentStep}</p>
          </div>
        </div>

        {/* Content type preview */}
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(sessionData.contentTypes || {}).map(([type, enabled]) => {
              if (!enabled) return null
              const Icon = getContentIcon(type)
              const colorClass = getContentColor(type)
              
              return (
                <div key={type} className={`rounded-lg border ${borderClass} ${bgClass} p-3 flex items-center gap-2`}>
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className="text-xs font-medium capitalize">{type}</span>
                  <Loader2 className="h-3 w-3 animate-spin ml-auto text-gray-400" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Layers className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-medium">Content Consolidation Complete</h3>
        <p className={`text-sm ${textSecondary}`}>
          Merged {consolidatedData.totalContent} pieces of content into {consolidatedData.googleDocs.length} Google Docs
        </p>
      </div>

      {/* Content summary */}
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(consolidatedData.contentByType).map(([type, count]) => {
            const Icon = getContentIcon(type)
            const colorClass = getContentColor(type)
            
            return (
              <div key={type} className={`rounded-lg border ${borderClass} ${bgClass} p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className="text-xs font-medium capitalize">{type}</span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Google Docs list */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="h-5 w-5 text-blue-500" />
          <h4 className="text-sm font-medium">Created Google Documents</h4>
        </div>
        
        <div className="space-y-3">
          {consolidatedData.googleDocs.map((doc, index) => {
            const Icon = getContentIcon(doc.type)
            const colorClass = getContentColor(doc.type)
            
            return (
              <div key={index} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <h5 className="text-sm font-medium">{doc.name}</h5>
                    </div>
                    <p className={`text-xs ${textSecondary} mb-2`}>
                      Contains {doc.itemCount} {doc.type === 'master' ? 'total items' : `${doc.type} items`}
                    </p>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Open in Google Docs
                    </a>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`rounded-lg border-2 ${
        darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
      } p-4 max-w-lg mx-auto`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-sm font-medium text-green-600">Content Merged & Organized</h4>
            <p className={`text-xs ${textSecondary} mt-1`}>
              All content consolidated into searchable Google Docs for vectorization
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
          Continue to Vectorization
        </Button>
      </div>
    </div>
  )
}