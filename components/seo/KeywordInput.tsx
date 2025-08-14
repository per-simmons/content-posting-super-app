"use client"

import { useState } from 'react'
import { X, Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface KeywordInputProps {
  darkMode: boolean
  textSecondary: string
  onKeywordsConfirmed: (keywords: string[]) => void
  onNext: () => void
}

export function KeywordInput({ darkMode, textSecondary, onKeywordsConfirmed, onNext }: KeywordInputProps) {
  const [currentKeyword, setCurrentKeyword] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [isConfirmed, setIsConfirmed] = useState(false)

  const addKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()])
      setCurrentKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const confirmAndProceed = () => {
    if (keywords.length > 0) {
      setIsConfirmed(true)
      onKeywordsConfirmed(keywords)
      setTimeout(() => {
        onNext()
      }, 500)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Target Keywords</h3>
        <p className={`text-xs ${textSecondary} mb-4`}>
          Add one or more keywords to analyze. The system will research each keyword to understand search intent and competitive landscape.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={currentKeyword}
          onChange={(e) => setCurrentKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
          placeholder="Enter a keyword (e.g., 'solar panel financing')"
          className={`flex-1 ${
            darkMode 
              ? 'bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500' 
              : 'bg-white border-neutral-200'
          }`}
          disabled={isConfirmed}
        />
        <Button
          onClick={addKeyword}
          disabled={!currentKeyword.trim() || isConfirmed}
          size="sm"
          className={
            darkMode 
              ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-3">
          <div className={`rounded-lg border ${
            darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-200 bg-neutral-50'
          } p-4`}>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant={darkMode ? "secondary" : "outline"}
                  className={`py-1.5 px-3 ${
                    darkMode 
                      ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700' 
                      : 'bg-white hover:bg-neutral-50'
                  }`}
                >
                  <Search className="h-3 w-3 mr-1.5 opacity-50" />
                  {keyword}
                  {!isConfirmed && (
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-xs ${textSecondary}`}>
              {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} selected
            </p>
            
            {!isConfirmed && (
              <Button
                onClick={confirmAndProceed}
                size="sm"
                className={`${
                  darkMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Confirm & Analyze
              </Button>
            )}
            
            {isConfirmed && (
              <div className="flex items-center gap-2 text-green-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Proceeding to analysis...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {keywords.length === 0 && (
        <div className={`rounded-lg border-2 border-dashed ${
          darkMode ? 'border-neutral-800' : 'border-neutral-300'
        } p-8 text-center`}>
          <Search className={`h-8 w-8 mx-auto mb-3 ${textSecondary} opacity-30`} />
          <p className={`text-xs ${textSecondary}`}>
            Add at least one keyword to begin the SEO analysis workflow
          </p>
        </div>
      )}
    </div>
  )
}