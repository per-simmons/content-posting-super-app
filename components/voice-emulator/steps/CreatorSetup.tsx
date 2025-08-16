"use client"

import { useState, useEffect } from 'react'
import { User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreatorSetupProps {
  darkMode: boolean
  textSecondary: string
  sessionData: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export function CreatorSetup({ darkMode, textSecondary, sessionData, onUpdate, onNext }: CreatorSetupProps) {
  const [creatorName, setCreatorName] = useState(sessionData.creatorName || '')
  const [selectedContentTypes, setSelectedContentTypes] = useState(
    sessionData.contentTypes || {
      newsletter: false,
      twitter: false,
      linkedin: false,
      blog: false
    }
  )
  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    const hasName = creatorName.trim().length > 0
    const hasContent = Object.values(selectedContentTypes).some(Boolean)
    setCanContinue(hasName && hasContent)
  }, [creatorName, selectedContentTypes])

  useEffect(() => {
    onUpdate({
      creatorName: creatorName.trim(),
      contentTypes: selectedContentTypes
    })
  }, [creatorName, selectedContentTypes, onUpdate])

  const handleContentTypeChange = (type: string, checked: boolean) => {
    setSelectedContentTypes(prev => ({
      ...prev,
      [type]: checked
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

  const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <User className="h-12 w-12 mx-auto text-blue-500" />
        <h3 className="text-lg font-medium">Creator Setup</h3>
        <p className={`text-sm ${textSecondary}`}>
          Enter the creator's name and select content types to analyze
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Creator Name Field */}
        <div className="space-y-2">
          <Label htmlFor="creator-name" className="text-sm font-medium">
            Creator Name *
          </Label>
          <Input
            id="creator-name"
            type="text"
            placeholder="e.g., Paul Graham, Naval Ravikant, Seth Godin"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`${
              darkMode 
                ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-400' 
                : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
            }`}
            autoFocus
          />
        </div>

        {/* Content Type Checkboxes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Content Types to Analyze *</Label>
          <div className={`rounded-md border ${borderClass} ${bgClass} p-4 space-y-3`}>
            {[
              { key: 'newsletter', label: 'Newsletter content', desc: 'Substack, newsletters, email content' },
              { key: 'twitter', label: 'Twitter posts', desc: 'Top tweets by engagement' },
              { key: 'linkedin', label: 'LinkedIn posts', desc: 'Professional posts and articles' },
              { key: 'blog', label: 'Blog articles', desc: 'Blog posts, essays, and articles' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={key}
                  checked={selectedContentTypes[key as keyof typeof selectedContentTypes]}
                  onChange={(e) => handleContentTypeChange(key, e.target.checked)}
                  className={`mt-1 h-4 w-4 rounded border-2 ${
                    darkMode 
                      ? 'border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900' 
                      : 'border-neutral-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white'
                  }`}
                />
                <div className="flex-1">
                  <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </label>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className={`text-xs ${textSecondary}`}>
            Select at least one content type. More types = better voice analysis.
          </p>
        </div>
      </div>

      {/* Status indicator */}
      {canContinue && (
        <div className={`rounded-lg border-2 ${
          darkMode ? 'border-green-900 bg-green-950/20' : 'border-green-200 bg-green-50'
        } p-4 max-w-md mx-auto`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-600">Ready to Continue</h4>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Will analyze {Object.values(selectedContentTypes).filter(Boolean).length} content type(s) from <span className="font-medium">{creatorName}</span>
              </p>
            </div>
          </div>
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
          Continue to Source Discovery
        </Button>
      </div>
    </div>
  )
}