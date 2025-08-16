"use client"

import { useState, useEffect } from 'react'
import { Linkedin, Clock, Loader2, TrendingUp, Heart, MessageCircle, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LinkedInExtractionProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function LinkedInExtraction({ darkMode, textSecondary, sessionData, onUpdate, onNext }: LinkedInExtractionProps) {
  const [jobStatus, setJobStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Mock extracted LinkedIn data
  const [extractedPosts] = useState([
    {
      id: "linkedin-1234567890",
      text: "Building great products requires understanding that the details matter. Every pixel, every interaction, every moment of friction can make or break the user experience.",
      engagement: 2100,
      engagementDetails: { likes: 1500, comments: 350, shares: 250 },
      createdAt: "2024-01-12T14:30:00Z"
    },
    {
      id: "linkedin-1234567891", 
      text: "One thing I've learned about scaling teams: hire people who are better than you at specific things. Your ego isn't worth slowing down the company.",
      engagement: 1850,
      engagementDetails: { likes: 1200, comments: 400, shares: 250 },
      createdAt: "2024-01-05T11:15:00Z"
    },
    {
      id: "linkedin-1234567892",
      text: "The best founders I know don't just solve problems—they solve problems they're obsessed with. Obsession is the difference between good and great.",
      engagement: 1650,
      engagementDetails: { likes: 1100, comments: 300, shares: 250 },
      createdAt: "2024-01-01T16:45:00Z"
    }
  ])

  useEffect(() => {
    if (sessionData.contentTypes?.linkedin && jobStatus === 'idle') {
      startAsyncJob()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (jobStatus === 'running') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
        // Simulate completion after 12 seconds for demo
        if (elapsedTime >= 12) {
          setJobStatus('completed')
          onUpdate({
            extractedContent: {
              ...sessionData.extractedContent,
              linkedin: extractedPosts
            }
          })
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [jobStatus, elapsedTime])

  const startAsyncJob = async () => {
    setJobStatus('starting')
    
    // Simulate API call to start Apify job
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    setJobId('apify-linkedin-67890')
    setJobStatus('running')
    setElapsedTime(0)
  }

  const handleNext = () => {
    onNext()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (!sessionData.contentTypes?.linkedin) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Linkedin className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-medium">LinkedIn Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            LinkedIn content type not selected
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleNext} className={`px-6 py-2 ${
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}>
            Skip to Blog Extraction
          </Button>
        </div>
      </div>
    )
  }

  if (jobStatus === 'starting') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Linkedin className="h-12 w-12 mx-auto text-blue-600" />
          <h3 className="text-lg font-medium">Starting LinkedIn Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            Initializing Apify actor for {sessionData.discoveredSources?.linkedin}
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (jobStatus === 'running') {
    const progressPercent = Math.min((elapsedTime / 900) * 100, 95) // 15 minutes estimated

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Linkedin className="h-12 w-12 mx-auto text-blue-600" />
          <h3 className="text-lg font-medium">LinkedIn Extraction in Progress</h3>
          <p className={`text-sm ${textSecondary}`}>
            Apify is extracting top posts from {sessionData.discoveredSources?.linkedin}
          </p>
        </div>

        <div className={`rounded-lg border ${borderClass} ${bgClass} p-6 max-w-md mx-auto`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Job ID:</span>
              <span className="font-mono text-blue-600">{jobId}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span>Elapsed Time</span>
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Estimated Remaining</span>
              <span className="font-mono">{formatTime(Math.max(0, estimatedTime * 60 - elapsedTime))}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg border ${borderClass} ${bgClass} p-4 max-w-md mx-auto`}>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Long-Running Operation</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                LinkedIn extraction typically takes 30+ minutes. Uses async patterns to avoid Vercel timeouts.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (jobStatus === 'completed') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Linkedin className="h-12 w-12 mx-auto text-green-500" />
          <h3 className="text-lg font-medium">LinkedIn Extraction Complete</h3>
          <p className={`text-sm ${textSecondary}`}>
            Extracted {extractedPosts.length} high-engagement posts
          </p>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {extractedPosts.map((post, index) => (
            <div key={post.id} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
              <div className="space-y-3">
                <p className="text-sm">{post.text}</p>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-blue-600" />
                    <span>{post.engagementDetails.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-green-600" />
                    <span>{post.engagementDetails.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share className="h-3 w-3 text-purple-600" />
                    <span>{post.engagementDetails.shares}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="font-medium">Score: {post.engagement}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
        } p-4 max-w-lg mx-auto`}>
          <div className="flex items-center gap-3">
            <Linkedin className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-600">Async Job Complete</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Engagement scoring: likes + (comments × 1.5) + (shares × 2)
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
            Continue to Blog Extraction
          </Button>
        </div>
      </div>
    )
  }

  return null
}