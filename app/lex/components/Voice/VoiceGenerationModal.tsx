'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, ChevronDown, Loader2 } from 'lucide-react'
import { useVoice } from './VoiceProvider'

interface VoiceGenerationModalProps {
  onClose: () => void
  onContentGenerated: (content: string, title?: string) => void
  isDarkMode: boolean
}

const platforms = [
  'Blog Post',
  'Twitter Thread',
  'LinkedIn Article', 
  'Newsletter',
  'Essay',
  'Medium Article'
]

const lengthOptions = [
  { value: 'short', label: 'Short (200-400 words)' },
  { value: 'medium', label: 'Medium (500-800 words)' },
  { value: 'long', label: 'Long (1000-1500 words)' }
]

export function VoiceGenerationModal({ onClose, onContentGenerated, isDarkMode }: VoiceGenerationModalProps) {
  const { availableVoices } = useVoice()
  const [selectedVoice, setSelectedVoice] = useState('')
  const [selectedPlatform, setPlatform] = useState('Blog Post')
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false)
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  const [showLengthDropdown, setShowLengthDropdown] = useState(false)
  
  const topicRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    topicRef.current?.focus()
  }, [])
  
  const handleGenerate = async () => {
    if (!selectedVoice || !topic.trim()) {
      setError('Please select a voice and enter a topic')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // First get the system prompt for the selected voice
      const voice = availableVoices.find(v => v.id === selectedVoice)
      if (!voice) {
        throw new Error('Selected voice not found')
      }
      
      // Create a basic system prompt based on the voice profile
      const systemPrompt = `You are writing in the style of ${voice.name}.

Description: ${voice.description}
Key traits: ${voice.traits.join(', ')}
Example content types: ${voice.examples.join(', ')}

Write in their distinctive voice, capturing their unique perspective, tone, and communication style. Use their typical sentence patterns, vocabulary, and rhetorical approaches.`
      
      // Call the content generation API
      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          platform: selectedPlatform,
          topic: topic.trim(),
          length: selectedLength
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Content generation failed')
      }
      
      const result = await response.json()
      
      // Extract title from content if possible, or generate one
      let generatedTitle = topic.trim()
      let generatedContent = result.content
      
      // Try to extract title from the beginning of the content
      const lines = generatedContent.split('\n').filter((line: string) => line.trim())
      if (lines.length > 0) {
        const firstLine = lines[0].trim()
        // If first line looks like a title (short, no punctuation at end)
        if (firstLine.length < 100 && !firstLine.endsWith('.') && !firstLine.endsWith('!') && !firstLine.endsWith('?')) {
          generatedTitle = firstLine.replace(/^#+\s*/, '') // Remove markdown headers
          generatedContent = lines.slice(1).join('\n').trim() // Rest as content
        }
      }
      
      onContentGenerated(generatedContent, generatedTitle)
      onClose()
      
    } catch (err) {
      console.error('Content generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && e.metaKey && !loading) {
      handleGenerate()
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl shadow-2xl w-full max-w-[500px] border transition-colors ${
          isDarkMode 
            ? 'bg-[#242424] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Mic className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              Start with Voice
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Voice Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Voice
            </label>
            <div className="relative">
              <button
                onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {selectedVoice ? availableVoices.find(v => v.id === selectedVoice)?.name : 'Select a voice...'}
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showVoiceDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {availableVoices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoice(voice.id)
                        setShowVoiceDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-[#333]' 
                          : 'text-gray-900 hover:bg-gray-50'
                      } ${selectedVoice === voice.id ? (isDarkMode ? 'bg-[#333]' : 'bg-gray-100') : ''}`}
                    >
                      <div className="font-medium">{voice.name}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {voice.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Platform Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Platform
            </label>
            <div className="relative">
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {selectedPlatform}
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showPlatformDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => {
                        setPlatform(platform)
                        setShowPlatformDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-[#333]' 
                          : 'text-gray-900 hover:bg-gray-50'
                      } ${selectedPlatform === platform ? (isDarkMode ? 'bg-[#333]' : 'bg-gray-100') : ''}`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Length Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Length
            </label>
            <div className="relative">
              <button
                onClick={() => setShowLengthDropdown(!showLengthDropdown)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {lengthOptions.find(l => l.value === selectedLength)?.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showLengthDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${
                  isDarkMode 
                    ? 'border-gray-700 bg-[#2a2a2a]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {lengthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedLength(option.value as 'short' | 'medium' | 'long')
                        setShowLengthDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-[#333]' 
                          : 'text-gray-900 hover:bg-gray-50'
                      } ${selectedLength === option.value ? (isDarkMode ? 'bg-[#333]' : 'bg-gray-100') : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Topic Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              What should I write about?
            </label>
            <input
              ref={topicRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic or idea..."
              className={`w-full px-3 py-2 rounded-lg border bg-transparent outline-none ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-300 placeholder:text-gray-600' 
                  : 'border-gray-300 text-gray-900 placeholder:text-gray-400'
              }`}
              disabled={loading}
            />
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDarkMode 
                    ? 'bg-[#333] text-gray-300 hover:bg-[#444]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedVoice || !topic.trim() || loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                loading || !selectedVoice || !topic.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Content'}
            </button>
          </div>
          
          {/* Hint */}
          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Tip: Press Cmd+Enter to generate
          </div>
        </div>
      </div>
    </div>
  )
}