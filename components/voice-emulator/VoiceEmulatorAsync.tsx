"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface JobStatus {
  jobId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled'
  createdAt?: string
  updatedAt?: string
  result?: any
  googleDocsUrl?: string
  error?: string
  progress?: {
    message: string
    percentage: number
  }
}

export default function VoiceEmulatorAsync() {
  const { toast } = useToast()
  const [targetName, setTargetName] = useState('')
  const [hints, setHints] = useState({
    website: '',
    newsletter: '',
    twitter: '',
    linkedin: ''
  })
  const [isStarting, setIsStarting] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [polling, setPolling] = useState(false)

  // Poll for job status
  useEffect(() => {
    if (!currentJob || !polling) return
    if (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'canceled') {
      setPolling(false)
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice-emulator/async/status/${currentJob.jobId}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentJob(data)
          
          if (data.status === 'completed') {
            toast({
              title: "Voice emulation complete!",
              description: "The pipeline has finished successfully."
            })
            setPolling(false)
          } else if (data.status === 'failed') {
            toast({
              title: "Pipeline failed",
              description: data.error || "An error occurred during processing."
            })
            setPolling(false)
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [currentJob, polling, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!targetName.trim()) {
      toast({
        title: "Creator name required",
        description: "Please enter the name of the creator you want to emulate"
      })
      return
    }

    setIsStarting(true)
    
    try {
      const response = await fetch('/api/voice-emulator/async/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName,
          hints: Object.fromEntries(
            Object.entries(hints).filter(([_, v]) => v.trim())
          )
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCurrentJob({
          jobId: data.jobId,
          status: data.status,
          createdAt: new Date().toISOString()
        })
        setPolling(true)
        toast({
          title: "Pipeline started",
          description: "Voice emulation is running in the background. This may take 5-10 minutes."
        })
      } else {
        throw new Error(data.error || 'Failed to start pipeline')
      }
    } catch (error) {
      console.error('Error starting voice emulator:', error)
      toast({
        title: "Failed to start",
        description: error instanceof Error ? error.message : "An error occurred"
      })
    } finally {
      setIsStarting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-gray-500'
      case 'running': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'canceled': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4" />
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'canceled': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Emulator (Background Processing)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="targetName">Creator Name *</Label>
              <Input
                id="targetName"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g., Tim Ferriss"
                disabled={polling}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Optional Hints</Label>
              <Input
                placeholder="Website URL"
                value={hints.website}
                onChange={(e) => setHints({...hints, website: e.target.value})}
                disabled={polling}
              />
              <Input
                placeholder="Newsletter URL"
                value={hints.newsletter}
                onChange={(e) => setHints({...hints, newsletter: e.target.value})}
                disabled={polling}
              />
              <Input
                placeholder="Twitter handle (without @)"
                value={hints.twitter}
                onChange={(e) => setHints({...hints, twitter: e.target.value})}
                disabled={polling}
              />
              <Input
                placeholder="LinkedIn profile URL"
                value={hints.linkedin}
                onChange={(e) => setHints({...hints, linkedin: e.target.value})}
                disabled={polling}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isStarting || polling}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Pipeline...
                </>
              ) : polling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pipeline Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Voice Emulation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentJob && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Job Status</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentJob.status)}
                  <Badge className={getStatusColor(currentJob.status)}>
                    {currentJob.status.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  Job ID: {currentJob.jobId.slice(0, 8)}...
                </span>
              </div>

              {currentJob.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentJob.progress.message}</span>
                    <span>{currentJob.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${currentJob.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {currentJob.googleDocsUrl && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">✅ Google Doc Created</p>
                  <a 
                    href={currentJob.googleDocsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    Open Document
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}

              {currentJob.error && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Error:</p>
                  <p className="text-sm text-red-600">{currentJob.error}</p>
                </div>
              )}

              {showDetails && currentJob.result && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Result Details:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(currentJob.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}