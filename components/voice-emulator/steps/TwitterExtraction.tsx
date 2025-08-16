"use client"

import { useState, useEffect } from 'react'
import { Twitter, Clock, Loader2, TrendingUp, Heart, Repeat, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TwitterExtractionProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function TwitterExtraction({ darkMode, textSecondary, sessionData, onUpdate, onNext }: TwitterExtractionProps) {
  const [jobStatus, setJobStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(20)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Mock extracted Twitter data
  const [extractedTweets] = useState([
    {
      id: "1234567890",
      text: "The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.",
      engagement: 1250,
      engagementDetails: { likes: 850, retweets: 200, replies: 200 },
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "1234567891", 
      text: "One of the most common types of advice we give at Y Combinator is to do things that don't scale.",
      engagement: 980,
      engagementDetails: { likes: 680, retweets: 150, replies: 150 },
      createdAt: "2024-01-10T15:45:00Z"
    },
    {
      id: "1234567892",
      text: "The thing about programming is that you're always building on the work of others. Very little is created from scratch.",
      engagement: 750,
      engagementDetails: { likes: 500, retweets: 125, replies: 125 },
      createdAt: "2024-01-08T09:20:00Z"
    }
  ])

  useEffect(() => {
    if (sessionData.contentTypes?.twitter && jobStatus === 'idle') {
      startAsyncJob()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (jobStatus === 'running') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
        // Simulate completion after 10 seconds for demo
        if (elapsedTime >= 10) {
          setJobStatus('completed')
          onUpdate({
            extractedContent: {
              ...sessionData.extractedContent,
              twitter: extractedTweets
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setJobId('apify-run-12345')
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

  if (!sessionData.contentTypes?.twitter) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Twitter className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-medium">Twitter Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            Twitter content type not selected
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleNext} className={`px-6 py-2 ${
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}>
            Skip to LinkedIn Extraction
          </Button>
        </div>
      </div>
    )
  }

  if (jobStatus === 'starting') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Twitter className="h-12 w-12 mx-auto text-blue-500" />
          <h3 className="text-lg font-medium">Starting Twitter Extraction</h3>
          <p className={`text-sm ${textSecondary}`}>
            Initializing Apify actor for {sessionData.discoveredSources?.twitter}
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (jobStatus === 'running') {
    const progressPercent = Math.min((elapsedTime / 600) * 100, 95) // 10 minutes estimated

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Twitter className="h-12 w-12 mx-auto text-blue-500" />
          <h3 className="text-lg font-medium">Twitter Extraction in Progress</h3>
          <p className={`text-sm ${textSecondary}`}>
            Apify is extracting top tweets from {sessionData.discoveredSources?.twitter}
          </p>
        </div>

        <div className={`rounded-lg border ${borderClass} ${bgClass} p-6 max-w-md mx-auto`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Job ID:</span>
              <span className="font-mono text-blue-500">{jobId}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
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
                This uses async job patterns to avoid Vercel's 5-minute timeout. You can navigate away and return later.
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
          <Twitter className="h-12 w-12 mx-auto text-green-500" />
          <h3 className="text-lg font-medium">Twitter Extraction Complete</h3>
          <p className={`text-sm ${textSecondary}`}>
            Extracted {extractedTweets.length} high-engagement tweets
          </p>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {extractedTweets.map((tweet, index) => (
            <div key={tweet.id} className={`rounded-lg border ${borderClass} ${bgClass} p-4`}>
              <div className="space-y-3">
                <p className="text-sm">{tweet.text}</p>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>{tweet.engagementDetails.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-green-500" />
                    <span>{tweet.engagementDetails.retweets}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-500" />
                    <span>{tweet.engagementDetails.replies}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="font-medium">Score: {tweet.engagement}</span>
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
            <Twitter className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-600">Async Job Complete</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Engagement scoring: likes + (retweets × 2) + replies
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
            Continue to LinkedIn Extraction
          </Button>
        </div>
      </div>
    )
  }

  return null
}