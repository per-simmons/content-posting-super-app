'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mic, User, Sparkles, Send } from 'lucide-react'

interface VoiceProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectProfile: (profile: string, message: string) => void
  isDarkMode: boolean
  selectedText?: string
}

const VOICE_PROFILES = [
  { 
    id: 'paul-graham',
    name: 'Paul Graham',
    description: 'Y Combinator founder, conversational yet authoritative',
    avatar: '👨‍💻'
  },
  {
    id: 'malcolm-gladwell', 
    name: 'Malcolm Gladwell',
    description: 'Storytelling with data-driven insights',
    avatar: '📚'
  },
  {
    id: 'seth-godin',
    name: 'Seth Godin',
    description: 'Marketing wisdom, short and punchy',
    avatar: '💡'
  },
  {
    id: 'naval-ravikant',
    name: 'Naval Ravikant',
    description: 'Philosophical tech insights, tweet-like clarity',
    avatar: '🧠'
  }
]

export function VoiceProfilePanel({ 
  isOpen, 
  onClose, 
  onSelectProfile, 
  isDarkMode, 
  selectedText 
}: VoiceProfilePanelProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'system', content: string}>>([])
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const panel = document.getElementById('voice-profile-panel')
      if (panel && !panel.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Focus message input when panel opens
  useEffect(() => {
    if (isOpen && messageInputRef.current) {
      setTimeout(() => messageInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Initialize chat with welcome message when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      const profile = VOICE_PROFILES.find(p => p.id === selectedProfile)
      if (profile) {
        setChatMessages([{
          id: '1',
          type: 'system',
          content: `Hi! I'm ready to help you write in the style of ${profile.name}. What would you like me to write?`
        }])
        setTimeout(() => messageInputRef.current?.focus(), 100)
      }
    } else {
      setChatMessages([])
    }
  }, [selectedProfile])

  const handleSendMessage = () => {
    if (!message.trim() || !selectedProfile) return
    
    onSelectProfile(selectedProfile, message.trim())
    
    // Add user message to chat
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim()
    }])
    
    setMessage('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black bg-opacity-20"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        id="voice-profile-panel"
        className={`w-96 h-full transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
          borderLeft: isDarkMode ? '1px solid #3a3a3a' : '1px solid #e5e5e5'
        }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" style={{ color: '#4A9EFF' }} />
              <h2 
                className="text-lg font-semibold"
                style={{ color: isDarkMode ? '#EDEFF3' : '#1a1a1a' }}
              >
                Transform with Voice
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
              }`}
              style={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {selectedText && (
            <div className={`mt-4 p-3 rounded-lg ${
              isDarkMode ? 'bg-[#242424] border border-[#3a3a3a]' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className="text-sm" style={{ color: isDarkMode ? '#888888' : '#666666' }}>
                Selected text:
              </p>
              <p 
                className="text-sm mt-1 font-medium line-clamp-3"
                style={{ color: isDarkMode ? '#BBBBBB' : '#333333' }}
              >
                "{selectedText}"
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {!selectedProfile ? (
            /* Voice Profile Selection */
            <div className="p-6">
              <h3 
                className="text-sm font-medium mb-4"
                style={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
              >
                Choose a voice to get started
              </h3>
              <div className="space-y-3">
                {VOICE_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`w-full p-4 rounded-lg border transition-colors text-left hover:scale-[1.02] ${
                      isDarkMode
                        ? 'border-[#3a3a3a] hover:bg-[#2a2a2a] hover:border-[#4A9EFF]'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-[#4A9EFF]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{profile.avatar}</span>
                      <div className="flex-1">
                        <p 
                          className="font-medium text-sm"
                          style={{ color: isDarkMode ? '#EDEFF3' : '#1a1a1a' }}
                        >
                          {profile.name}
                        </p>
                        <p 
                          className="text-xs mt-1"
                          style={{ color: isDarkMode ? '#888888' : '#666666' }}
                        >
                          {profile.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Selected Voice Header */}
              <div className={`p-4 border-b ${isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {VOICE_PROFILES.find(p => p.id === selectedProfile)?.avatar}
                    </span>
                    <div>
                      <p 
                        className="font-medium text-sm"
                        style={{ color: isDarkMode ? '#EDEFF3' : '#1a1a1a' }}
                      >
                        {VOICE_PROFILES.find(p => p.id === selectedProfile)?.name}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: isDarkMode ? '#888888' : '#666666' }}
                      >
                        Ready to write
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProfile('')}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                    }`}
                    style={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id}>
                      {msg.type === 'system' ? (
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-[#2a2a2a] border border-[#3a3a3a]' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <p 
                            className="text-sm"
                            style={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
                          >
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="bg-[#4A9EFF] text-white p-3 rounded-lg max-w-[80%]">
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className={`p-4 border-t ${isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200'}`}>
                <div className="flex gap-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your request... (e.g., write a blog post about AI)"
                    className={`flex-1 px-3 py-2 rounded-lg border bg-transparent outline-none text-sm ${
                      isDarkMode 
                        ? 'border-[#3a3a3a] text-gray-300 placeholder:text-gray-600' 
                        : 'border-gray-300 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      message.trim()
                        ? 'bg-[#4A9EFF] hover:bg-[#3d8bff] text-white'
                        : isDarkMode
                          ? 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p 
                  className="text-xs mt-2"
                  style={{ color: isDarkMode ? '#666666' : '#888888' }}
                >
                  Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}