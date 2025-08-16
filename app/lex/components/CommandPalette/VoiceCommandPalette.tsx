'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Edit3, CheckCircle, MessageCircle, PlusCircle, 
  Image, Type, Copy, Eye, Clock, FileText, X,
  Users, Mic, Palette, Sparkles, Brain, MessageSquare
} from 'lucide-react'
import { useAI } from '../AI/AIProvider'

interface VoiceCommandPaletteProps {
  onClose: () => void
  selection: any
  content: string
  onContentChange: (content: string) => void
  isDarkMode: boolean
}

interface VoiceProfile {
  id: string
  name: string
  description: string
  traits: string[]
  examples: string[]
}

const voiceProfiles: VoiceProfile[] = [
  {
    id: 'paul-graham',
    name: 'Paul Graham',
    description: 'Conversational, insightful startup wisdom',
    traits: ['conversational', 'anecdotal', 'philosophical', 'direct'],
    examples: ['essays on startups', 'YC advice', 'technical insights']
  },
  {
    id: 'malcolm-gladwell',
    name: 'Malcolm Gladwell',
    description: 'Narrative storytelling with research backing',
    traits: ['narrative', 'research-driven', 'story-focused', 'accessible'],
    examples: ['pop psychology', 'social science', 'counterintuitive insights']
  },
  {
    id: 'seth-godin',
    name: 'Seth Godin',
    description: 'Punchy, marketing-focused insights',
    traits: ['punchy', 'direct', 'marketing-savvy', 'actionable'],
    examples: ['short blog posts', 'marketing philosophy', 'business advice']
  },
  {
    id: 'naval-ravikant',
    name: 'Naval Ravikant',
    description: 'Philosophical, wealth-building wisdom',
    traits: ['philosophical', 'wealth-focused', 'tweet-like', 'profound'],
    examples: ['wealth building', 'happiness', 'startups', 'philosophy']
  }
]

const commands = [
  { 
    id: 'voice-transform', 
    label: 'Voice: Transform selected text', 
    icon: Mic,
    shortcut: ' T',
    action: 'voice-transform',
    needsSelection: true,
    category: 'voice'
  },
  { 
    id: 'voice-expand', 
    label: 'Voice: Expand with voice traits', 
    icon: Brain,
    shortcut: null,
    action: 'voice-expand',
    needsSelection: true,
    category: 'voice'
  },
  { 
    id: 'voice-chat', 
    label: 'Voice: Chat with document feedback', 
    icon: MessageSquare,
    shortcut: ' ç \\',
    action: 'voice-chat',
    needsSelection: false,
    category: 'voice'
  },
  { 
    id: 'natural-command', 
    label: 'Voice: Natural language command', 
    icon: Sparkles,
    shortcut: null,
    action: 'natural-command',
    needsSelection: false,
    category: 'voice'
  },
  // Original commands
  { 
    id: 'edit', 
    label: 'AI: Edit selected text', 
    icon: Edit3,
    shortcut: null,
    action: 'edit',
    needsSelection: true,
    category: 'ai'
  },
  { 
    id: 'check', 
    label: 'AI: Run checks', 
    icon: CheckCircle,
    shortcut: null,
    action: 'check',
    needsSelection: false,
    category: 'ai'
  },
  { 
    id: 'chat', 
    label: 'AI: Chat about your document', 
    icon: MessageCircle,
    shortcut: ' \\',
    action: 'chat',
    needsSelection: false,
    category: 'ai'
  },
  { 
    id: 'continue', 
    label: 'AI: Continue writing', 
    icon: PlusCircle,
    shortcut: '+++',
    action: 'continue',
    needsSelection: false,
    category: 'ai'
  }
]

export function VoiceCommandPalette({ onClose, selection, content, onContentChange, isDarkMode }: VoiceCommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [showTraitSelector, setShowTraitSelector] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null)
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLInputElement>(null)
  const ai = useAI()
  
  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.label.toLowerCase().includes(search.toLowerCase())
    const meetsSelectionRequirement = !cmd.needsSelection || (cmd.needsSelection && selection)
    return matchesSearch && meetsSelectionRequirement
  })
  
  useEffect(() => {
    if (showPrompt) {
      promptRef.current?.focus()
    } else {
      inputRef.current?.focus()
    }
  }, [showPrompt])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showPrompt || showVoiceSelector || showTraitSelector) {
        setShowPrompt(false)
        setShowVoiceSelector(false)
        setShowTraitSelector(false)
        setPrompt('')
        setCurrentAction(null)
        setSelectedVoice(null)
        setSelectedTraits([])
      } else {
        onClose()
      }
    } else if (!showPrompt && !showVoiceSelector && !showTraitSelector) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      }
    }
  }
  
  const executeCommand = async (command: any) => {
    const action = command.action
    
    // Voice-specific actions
    if (action === 'voice-transform') {
      setCurrentAction(action)
      setShowVoiceSelector(true)
      return
    }
    
    if (action === 'voice-expand') {
      setCurrentAction(action)
      setShowTraitSelector(true)
      return
    }
    
    if (action === 'voice-chat' || action === 'natural-command') {
      setCurrentAction(action)
      setShowPrompt(true)
      return
    }
    
    // Original AI actions
    if (action === 'edit' || action === 'chat') {
      setCurrentAction(action)
      setShowPrompt(true)
      return
    }
    
    setLoading(true)
    
    try {
      switch (action) {
        case 'check':
          const checks = await ai.runChecks(content)
          alert(checks.join('\n'))
          break
          
        case 'continue':
          const continuation = await ai.continueWriting(content)
          onContentChange(content + '\n\n' + continuation)
          break
          
        case 'copy':
          if (selection) {
            await navigator.clipboard.writeText(selection.text)
          }
          break
          
        default:
          console.log('Action not implemented:', action)
      }
    } catch (error) {
      console.error('Error executing command:', error)
      alert('Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
      onClose()
    }
  }
  
  const handleVoiceSelection = (voice: VoiceProfile) => {
    setSelectedVoice(voice)
    setShowVoiceSelector(false)
    setShowPrompt(true)
  }
  
  const handleTraitSelection = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    )
  }
  
  const proceedWithTraits = () => {
    setShowTraitSelector(false)
    setShowPrompt(true)
  }
  
  const handlePromptSubmit = async () => {
    if (!prompt.trim() || !currentAction) return
    
    setLoading(true)
    
    try {
      if (currentAction === 'voice-transform' && selection && selectedVoice) {
        // Voice transformation with selected voice profile
        const voicePrompt = `Transform this text to match ${selectedVoice.name}'s writing style. 
        
Key traits: ${selectedVoice.traits.join(', ')}
Description: ${selectedVoice.description}

Additional instruction: ${prompt}

Original text: ${selection.text}

Provide only the transformed text without any explanation.`
        
        const transformed = await ai.editText(selection.text, voicePrompt)
        const newContent = content.replace(selection.text, transformed)
        onContentChange(newContent)
        
      } else if (currentAction === 'voice-expand' && selection) {
        // Voice trait expansion
        const traitPrompt = `Expand this text with the following voice traits: ${selectedTraits.join(', ')}.
        
Additional instruction: ${prompt}

Original text: ${selection.text}

Provide only the expanded text without any explanation.`
        
        const expanded = await ai.editText(selection.text, traitPrompt)
        const newContent = content.replace(selection.text, expanded)
        onContentChange(newContent)
        
      } else if (currentAction === 'voice-chat') {
        // Voice-aware document chat
        const chatPrompt = `As a writing coach familiar with voice and style analysis, help improve this document:

Document: ${content}

Question: ${prompt}

Consider voice, tone, style, and effectiveness in your response.`
        
        const response = await ai.chatAboutDocument(content, chatPrompt)
        alert(response)
        
      } else if (currentAction === 'natural-command') {
        // Natural language command processing
        const commandPrompt = `Process this natural language command for document editing:

Command: "${prompt}"

Document: ${content}

Apply the command and return the modified document. If the command is unclear, explain what you understood and ask for clarification.`
        
        const result = await ai.editText(content, commandPrompt)
        onContentChange(result)
        
      } else if (currentAction === 'edit' && selection) {
        const edited = await ai.editText(selection.text, prompt)
        const newContent = content.replace(selection.text, edited)
        onContentChange(newContent)
      } else if (currentAction === 'chat') {
        const response = await ai.chatAboutDocument(content, prompt)
        alert(response)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
      onClose()
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl shadow-2xl w-full max-w-[700px] max-h-[500px] overflow-hidden border transition-colors ${
          isDarkMode 
            ? 'bg-[#242424] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}>
        
        {/* Voice Selector */}
        {showVoiceSelector && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                Select Voice Profile
              </h3>
              <button
                onClick={() => setShowVoiceSelector(false)}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {voiceProfiles.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => handleVoiceSelection(voice)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'border-gray-700 hover:border-gray-600 hover:bg-[#2a2a2a]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {voice.name}
                      </h4>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {voice.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {voice.traits.map((trait) => (
                          <span
                            key={trait}
                            className={`px-2 py-1 text-xs rounded-full ${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-400' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Users className={`h-5 w-5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Trait Selector */}
        {showTraitSelector && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                Select Voice Traits
              </h3>
              <button
                onClick={() => setShowTraitSelector(false)}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['conversational', 'formal', 'analytical', 'narrative', 'direct', 'philosophical', 'technical', 'accessible'].map((trait) => (
                <button
                  key={trait}
                  onClick={() => handleTraitSelection(trait)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedTraits.includes(trait)
                      ? isDarkMode 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
            
            <button
              onClick={proceedWithTraits}
              disabled={selectedTraits.length === 0}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTraits.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Continue with {selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
        
        {/* Command List */}
        {!showPrompt && !showVoiceSelector && !showTraitSelector && (
          <>
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className={`w-full bg-transparent outline-none ${
                  isDarkMode ? 'text-gray-300 placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'
                }`}
                disabled={loading}
              />
            </div>
            
            <div className="overflow-y-auto max-h-[380px]">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon
                return (
                  <div
                    key={cmd.id}
                    onClick={() => !loading && executeCommand(cmd)}
                    className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                      index === selectedIndex 
                        ? isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                        : isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${
                        cmd.category === 'voice' 
                          ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-600'
                      }`} />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {cmd.label}
                      </span>
                    </div>
                    {cmd.shortcut && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        
        {/* Prompt Input */}
        {showPrompt && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {currentAction === 'voice-transform' && selectedVoice 
                  ? `Transform as ${selectedVoice.name}`
                  : currentAction === 'voice-expand' 
                  ? `Expand with traits: ${selectedTraits.join(', ')}`
                  : currentAction === 'voice-chat'
                  ? 'Voice & Style Feedback'
                  : currentAction === 'natural-command'
                  ? 'Natural Language Command'
                  : currentAction === 'edit' 
                  ? 'How should I edit this text?' 
                  : 'What would you like to know?'}
              </h3>
              <button
                onClick={() => {
                  setShowPrompt(false)
                  setPrompt('')
                  setCurrentAction(null)
                  setSelectedVoice(null)
                  setSelectedTraits([])
                }}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <input
              ref={promptRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prompt.trim()) {
                  handlePromptSubmit()
                } else {
                  handleKeyDown(e)
                }
              }}
              placeholder={
                currentAction === 'voice-transform' 
                  ? 'e.g., "Make it more technical" or "Add personal anecdotes"'
                  : currentAction === 'voice-expand'
                  ? 'e.g., "Expand with more examples"'
                  : currentAction === 'voice-chat'
                  ? 'e.g., "How can I improve the voice consistency?"'
                  : currentAction === 'natural-command'
                  ? 'e.g., "Make this sound more like Paul Graham"'
                  : currentAction === 'edit' 
                  ? 'e.g., "Make it more concise"' 
                  : 'e.g., "What is the main topic?"'
              }
              className={`w-full px-3 py-2 rounded-lg border bg-transparent outline-none mb-3 ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-300 placeholder:text-gray-600' 
                  : 'border-gray-300 text-gray-900 placeholder:text-gray-400'
              }`}
              disabled={loading}
            />
            
            <button
              onClick={handlePromptSubmit}
              disabled={!prompt.trim() || loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loading || !prompt.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}