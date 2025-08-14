import { useState, useEffect, useRef } from 'react'
import { 
  Edit3, CheckCircle, MessageCircle, PlusCircle, 
  Image, Type, Copy, Eye, Clock, FileText, X
} from 'lucide-react'
import { useAI } from '../AI/AIProvider'

interface CommandPaletteProps {
  onClose: () => void
  selection: any
  content: string
  onContentChange: (content: string) => void
  isDarkMode: boolean
}

const commands = [
  { 
    id: 'edit', 
    label: 'AI: Edit selected text', 
    icon: Edit3,
    shortcut: null,
    action: 'edit',
    needsSelection: true
  },
  { 
    id: 'check', 
    label: 'AI: Run checks', 
    icon: CheckCircle,
    shortcut: null,
    action: 'check',
    needsSelection: false
  },
  { 
    id: 'chat', 
    label: 'AI: Chat about your document', 
    icon: MessageCircle,
    shortcut: '⌘ \\',
    action: 'chat',
    needsSelection: false
  },
  { 
    id: 'continue', 
    label: 'AI: Continue writing', 
    icon: PlusCircle,
    shortcut: '+++',
    action: 'continue',
    needsSelection: false
  },
  { 
    id: 'image', 
    label: 'Insert image', 
    icon: Image,
    shortcut: null,
    action: 'image',
    needsSelection: false
  },
  { 
    id: 'format', 
    label: 'Format', 
    icon: Type,
    shortcut: null,
    action: 'format',
    needsSelection: false
  },
  { 
    id: 'copy', 
    label: 'Copy selected text as...', 
    icon: Copy,
    shortcut: null,
    action: 'copy',
    needsSelection: true
  },
  { 
    id: 'view', 
    label: 'View options', 
    icon: Eye,
    shortcut: null,
    action: 'view',
    needsSelection: false
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: Clock,
    shortcut: null,
    action: 'history',
    needsSelection: false
  },
  { 
    id: 'switch', 
    label: 'Switch document', 
    icon: FileText,
    shortcut: '⌘ P',
    action: 'switch',
    needsSelection: false
  }
]

export function CommandPalette({ onClose, selection, content, onContentChange, isDarkMode }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
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
      if (showPrompt) {
        setShowPrompt(false)
        setPrompt('')
        setCurrentAction(null)
      } else {
        onClose()
      }
    } else if (!showPrompt) {
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
  
  const handlePromptSubmit = async () => {
    if (!prompt.trim() || !currentAction) return
    
    setLoading(true)
    
    try {
      if (currentAction === 'edit' && selection) {
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
        className={`rounded-xl shadow-2xl w-full max-w-[600px] max-h-[400px] overflow-hidden border transition-colors ${
          isDarkMode 
            ? 'bg-[#242424] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}>
        {!showPrompt ? (
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
            
            <div className="overflow-y-auto max-h-[320px]">
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
                      <Icon className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`} />
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
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {currentAction === 'edit' ? 'How should I edit this text?' : 'What would you like to know?'}
              </h3>
              <button
                onClick={() => {
                  setShowPrompt(false)
                  setPrompt('')
                  setCurrentAction(null)
                }}
                className={`p-1 rounded ${
                  isDarkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                }`}
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
              placeholder={currentAction === 'edit' ? 'e.g., "Make it more concise"' : 'e.g., "What is the main topic?"'}
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