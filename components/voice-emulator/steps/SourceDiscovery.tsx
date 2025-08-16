"use client"

import { useState, useEffect } from 'react'
import { Search, Globe, CheckCircle, AlertCircle, Loader2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SourceDiscoveryProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function SourceDiscovery({ darkMode, textSecondary, sessionData, onUpdate, onNext }: SourceDiscoveryProps) {
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveryComplete, setDiscoveryComplete] = useState(!!sessionData.discoveredSources)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  // Editable URLs discovered/entered by user
  const [sources, setSources] = useState(
    sessionData.discoveredSources || {
      newsletter: '',
      twitter: '',
      linkedin: '',
      blog: ''
    }
  )

  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    // Auto-start discovery if we have creator name and haven't discovered yet
    if (sessionData.creatorName && !discoveryComplete && !sessionData.discoveredSources) {
      startDiscovery()
    }
  }, [sessionData.creatorName, discoveryComplete])

  useEffect(() => {
    // Check if we can continue - need at least one URL for selected content types
    const selectedTypes = sessionData.contentTypes || {}
    const hasRequiredSources = Object.keys(selectedTypes)
      .filter(type => selectedTypes[type]) // Get selected content types
      .every(type => sources[type]?.trim().length > 0) // Check if all have URLs

    setCanContinue(hasRequiredSources)
  }, [sources, sessionData.contentTypes])

  useEffect(() => {
    onUpdate({ discoveredSources: sources })
  }, [sources, onUpdate])

  const startDiscovery = async () => {
    setIsDiscovering(true)
    setError(null)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 20, 90))
    }, 400)

    try {
      const selectedTypes = Object.keys(sessionData.contentTypes || {})
        .filter(type => sessionData.contentTypes[type])

      const response = await fetch('/api/voice-emulator/source-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          creatorName: sessionData.creatorName,
          contentTypes: selectedTypes
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Discovery failed')
      }

      const data = await response.json()
      
      if (data.success && data.sources) {
        setSources(prev => ({
          ...prev,
          ...data.sources
        }))
        setDiscoveryComplete(true)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Source discovery error:', error)
      setError(error instanceof Error ? error.message : 'Discovery failed')
      clearInterval(progressInterval)
      // Still mark as complete so user can manually edit
      setDiscoveryComplete(true)
    } finally {
      setIsDiscovering(false)
      setProgress(100)
    }
  }

  const handleSourceChange = (type: string, value: string) => {
    setSources(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handleNext = () => {
    if (canContinue) {
      onNext()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      handleNext()
    }
  }

  const selectedTypes = Object.keys(sessionData.contentTypes || {})
    .filter(type => sessionData.contentTypes[type])

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  if (isDiscovering) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Search className="h-12 w-12 mx-auto text-blue-500" />
          <h3 className="text-lg font-medium">Discovering Sources</h3>
          <p className={`text-sm ${textSecondary}`}>
            Using Perplexity to find {sessionData.creatorName}'s content sources
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={textSecondary}>Searching with Perplexity...</span>
              {progress > 30 ? <span className="text-green-500">✓</span> : <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={textSecondary}>Finding social profiles...</span>
              {progress > 60 ? <span className="text-green-500">✓</span> : progress > 30 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="opacity-50">•</span>}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={textSecondary}>Validating URLs...</span>
              {progress >= 100 ? <span className="text-green-500">✓</span> : progress > 60 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="opacity-50">•</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Globe className="h-12 w-12 mx-auto text-blue-500" />
        <h3 className="text-lg font-medium">Source Discovery</h3>
        <p className={`text-sm ${textSecondary}`}>
          {discoveryComplete ? 'Review and edit' : 'Configure'} content sources for {sessionData.creatorName}
        </p>
      </div>

      {error && (
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-yellow-900 bg-yellow-950/20' : 'border-yellow-200 bg-yellow-50'
        } p-4 max-w-md mx-auto`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-600">Auto-Discovery Failed</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                {error}. You can manually enter the URLs below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-lg mx-auto">
        {selectedTypes.map((type) => {
          const labels = {
            newsletter: { 
              label: 'Newsletter URL', 
              placeholder: 'e.g., substack.com/profile/username',
              desc: 'Substack, ConvertKit, or newsletter homepage'
            },
            twitter: { 
              label: 'Twitter Profile', 
              placeholder: 'e.g., twitter.com/username or @username',
              desc: 'Twitter/X profile or handle'
            },
            linkedin: { 
              label: 'LinkedIn Profile', 
              placeholder: 'e.g., linkedin.com/in/username',
              desc: 'LinkedIn profile URL'
            },
            blog: { 
              label: 'Blog URL', 
              placeholder: 'e.g., example.com/blog or personal-site.com',
              desc: 'Personal blog or website'
            }
          }

          const config = labels[type as keyof typeof labels]
          if (!config) return null

          return (
            <div key={type} className="space-y-2">
              <Label htmlFor={`source-${type}`} className="text-sm font-medium flex items-center gap-2">
                {config.label} *
                {sources[type] && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <Input
                id={`source-${type}`}
                type="text"
                placeholder={config.placeholder}
                value={sources[type]}
                onChange={(e) => handleSourceChange(type, e.target.value)}
                onKeyPress={handleKeyPress}
                className={`${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                }`}
              />
              <p className={`text-xs ${textSecondary}`}>
                {config.desc}
              </p>
            </div>
          )
        })}

        {discoveryComplete && !error && (
          <div className={`rounded-lg border ${borderClass} ${bgClass} p-3 flex items-start gap-3`}>
            <Edit3 className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className={`text-xs ${textSecondary}`}>
                URLs were auto-discovered using Perplexity. You can edit them above if needed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {canContinue && (
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
        } p-4 max-w-lg mx-auto`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-600">Sources Ready</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                All required sources configured for {selectedTypes.length} content type(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {!canContinue && selectedTypes.length > 0 && (
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-orange-900 bg-orange-950/20' : 'border-orange-200 bg-orange-50'
        } p-4 max-w-lg mx-auto`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <h4 className="text-sm font-medium text-orange-600">Missing Sources</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Please provide URLs for all selected content types
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual discovery button if auto-discovery hasn't run */}
      {!discoveryComplete && !isDiscovering && (
        <div className="flex justify-center">
          <Button
            onClick={startDiscovery}
            className={`px-6 py-2 ${
              darkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Auto-Discover Sources
          </Button>
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-center">
        <Button
          onClick={handleNext}
          disabled={!canContinue}
          className={`px-6 py-2 ${
            canContinue
              ? darkMode 
                ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          Continue to Newsletter Extraction
        </Button>
      </div>
    </div>
  )
}