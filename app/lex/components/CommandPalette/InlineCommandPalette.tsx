'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  PencilLine, ListChecks, MessageSquarePlus, Plus, 
  ImagePlus, CaseSensitive, Copy, Eye, History, Files, 
  Mic, ChevronRight, Bold, Italic, Underline,
  List, ListOrdered, CheckSquare, Quote, Code2, Link2, FileText
} from 'lucide-react'
import { useAI } from '../AI/AIProvider'
import './CommandPalette.css'

interface InlineCommandPaletteProps {
  onClose: () => void
  selection: any
  content: string
  onContentChange: (content: string) => void
  isDarkMode: boolean
  position: { x: number; y: number }
}

interface Command {
  id: string
  label: string
  icon: React.ComponentType<any>
  shortcut?: string | null
  action: string
  needsSelection: boolean
  category?: 'ai' | 'format' | 'insert'
  hasSubmenu?: boolean
  submenu?: Command[]
}

const commands: Command[] = [
  { 
    id: 'edit', 
    label: 'Edit selected text', 
    icon: PencilLine,
    shortcut: null,
    action: 'edit',
    needsSelection: true,
    category: 'ai'
  },
  { 
    id: 'check', 
    label: 'Run checks', 
    icon: ListChecks,
    shortcut: null,
    action: 'check',
    needsSelection: false,
    category: 'ai'
  },
  { 
    id: 'chat', 
    label: 'Chat about your document', 
    icon: MessageSquarePlus,
    shortcut: '⌘\\',
    action: 'chat',
    needsSelection: false,
    category: 'ai'
  },
  { 
    id: 'continue', 
    label: 'Continue writing', 
    icon: Plus,
    shortcut: '+++',
    action: 'continue',
    needsSelection: false,
    category: 'ai'
  },
  { 
    id: 'image', 
    label: 'Insert image', 
    icon: ImagePlus,
    shortcut: null,
    action: 'image',
    needsSelection: false,
    category: 'insert'
  },
  { 
    id: 'format', 
    label: 'Format', 
    icon: CaseSensitive,
    shortcut: null,
    action: 'format',
    needsSelection: false,
    category: 'format',
    hasSubmenu: true,
    submenu: [
      { id: 'bold', label: 'Bold', icon: Bold, action: 'bold', needsSelection: true, shortcut: '⌘B' },
      { id: 'italic', label: 'Italic', icon: Italic, action: 'italic', needsSelection: true, shortcut: '⌘I' },
      { id: 'underline', label: 'Underline', icon: Underline, action: 'underline', needsSelection: true, shortcut: '⌘U' },
      { id: 'h1', label: 'Heading 1', icon: CaseSensitive, action: 'heading', needsSelection: false },
      { id: 'h2', label: 'Heading 2', icon: CaseSensitive, action: 'heading', needsSelection: false },
      { id: 'h3', label: 'Heading 3', icon: CaseSensitive, action: 'heading', needsSelection: false },
      { id: 'bullet', label: 'Bulleted list', icon: List, action: 'bullet-list', needsSelection: false },
      { id: 'numbered', label: 'Numbered list', icon: ListOrdered, action: 'numbered-list', needsSelection: false },
      { id: 'todo', label: 'Todo list', icon: CheckSquare, action: 'todo-list', needsSelection: false },
      { id: 'quote', label: 'Quote', icon: Quote, action: 'quote', needsSelection: false },
      { id: 'code', label: 'Code', icon: Code2, action: 'code', needsSelection: true },
      { id: 'link', label: 'Link', icon: Link2, action: 'link', needsSelection: true }
    ]
  },
  { 
    id: 'copy', 
    label: 'Copy selected text as...', 
    icon: Copy,
    shortcut: null,
    action: 'copy',
    needsSelection: true,
    category: 'insert'
  },
  { 
    id: 'view', 
    label: 'View options', 
    icon: Eye,
    shortcut: null,
    action: 'view',
    needsSelection: false,
    category: 'insert'
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: History,
    shortcut: null,
    action: 'history',
    needsSelection: false,
    category: 'insert'
  },
  { 
    id: 'switch', 
    label: 'Switch document', 
    icon: Files,
    shortcut: '⌘P',
    action: 'switch',
    needsSelection: false,
    category: 'insert'
  }
]

export function InlineCommandPalette({ 
  onClose, 
  selection, 
  content, 
  onContentChange, 
  isDarkMode,
  position 
}: InlineCommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [submenuSelectedIndex, setSubmenuSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Add global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Convert native KeyboardEvent to React.KeyboardEvent-like object
      const reactEvent = {
        key: e.key,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      } as React.KeyboardEvent
      
      handleKeyDown(reactEvent)
    }

    // Add event listener to document
    document.addEventListener('keydown', handleGlobalKeyDown)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [activeSubmenu, showPrompt, selectedIndex, submenuSelectedIndex, filteredCommands])

  // Position the palette near the caret with pointer
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Calculate if we need to adjust position to stay in viewport
      let adjustedX = position.x
      let adjustedY = position.y + 16 // 16px gap below caret (8px + 8px for pointer)
      let pointerPosition = 'bottom' // pointer position relative to palette
      
      // Check if palette would go off right edge
      if (adjustedX + rect.width > viewportWidth - 20) {
        adjustedX = viewportWidth - rect.width - 20
      }
      
      // Check if palette would go off bottom edge
      if (adjustedY + rect.height > viewportHeight - 20) {
        adjustedY = position.y - rect.height - 16 // 16px gap above caret
        pointerPosition = 'top'
      }
      
      // Position the container
      container.style.left = `${adjustedX}px`
      container.style.top = `${adjustedY}px`
      
      // Position the pointer
      const pointer = container
      if (pointerPosition === 'bottom') {
        // Pointer above the palette (pointing down to caret)
        pointer.style.setProperty('--pointer-top', '-4px')
        pointer.style.setProperty('--pointer-left', `${Math.min(Math.max(position.x - adjustedX - 4, 8), rect.width - 16)}px`)
        pointer.style.setProperty('--pointer-transform', 'rotate(45deg)')
      } else {
        // Pointer below the palette (pointing up to caret)  
        pointer.style.setProperty('--pointer-top', `${rect.height - 4}px`)
        pointer.style.setProperty('--pointer-left', `${Math.min(Math.max(position.x - adjustedX - 4, 8), rect.width - 16)}px`)
        pointer.style.setProperty('--pointer-transform', 'rotate(225deg)')
      }
    }
  }, [position])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (activeSubmenu) {
        setActiveSubmenu(null)
        setSubmenuSelectedIndex(0)
      } else if (showPrompt) {
        setShowPrompt(false)
        setPrompt('')
        setCurrentAction(null)
      } else {
        onClose()
      }
    } else if (!showPrompt) {
      if (activeSubmenu) {
        const parentCommand = filteredCommands.find(cmd => cmd.id === activeSubmenu)
        const submenuItems = parentCommand?.submenu || []
        
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSubmenuSelectedIndex(prev => 
            prev < submenuItems.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSubmenuSelectedIndex(prev => 
            prev > 0 ? prev - 1 : submenuItems.length - 1
          )
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (submenuItems[submenuSelectedIndex]) {
            executeCommand(submenuItems[submenuSelectedIndex])
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setActiveSubmenu(null)
          setSubmenuSelectedIndex(0)
        }
      } else {
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
            if (filteredCommands[selectedIndex].hasSubmenu) {
              setActiveSubmenu(filteredCommands[selectedIndex].id)
              setSubmenuSelectedIndex(0)
            } else {
              executeCommand(filteredCommands[selectedIndex])
            }
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          if (filteredCommands[selectedIndex]?.hasSubmenu) {
            setActiveSubmenu(filteredCommands[selectedIndex].id)
            setSubmenuSelectedIndex(0)
          }
        }
      }
    }
  }
  
  const executeCommand = async (command: Command) => {
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

        // Format commands
        case 'bold':
          document.execCommand('bold', false, undefined)
          break
        case 'italic':
          document.execCommand('italic', false, undefined)
          break
        case 'underline':
          document.execCommand('underline', false, undefined)
          break
        case 'heading':
          if (command.id === 'h1') document.execCommand('formatBlock', false, 'H1')
          else if (command.id === 'h2') document.execCommand('formatBlock', false, 'H2')
          else if (command.id === 'h3') document.execCommand('formatBlock', false, 'H3')
          break
        case 'bullet-list':
          document.execCommand('insertUnorderedList', false, undefined)
          break
        case 'numbered-list':
          document.execCommand('insertOrderedList', false, undefined)
          break
        case 'todo-list':
          const todoHTML = `<div style="display: flex; align-items: flex-start; margin: 4px 0; padding-left: 8px;"><input type="checkbox" style="margin-right: 8px; margin-top: 2px; flex-shrink: 0;"></div>`
          document.execCommand('insertHTML', false, todoHTML)
          break
        case 'quote':
          document.execCommand('formatBlock', false, 'BLOCKQUOTE')
          break
        case 'code':
          if (selection) {
            document.execCommand('insertHTML', false, `<code>${selection.text}</code>`)
          }
          break
        case 'link':
          const url = window.prompt('Enter URL:')
          if (url) {
            document.execCommand('createLink', false, url)
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

  const renderChip = (text: string, type: 'blue' | 'gray' = 'gray') => (
    <span className={`cp-chip ${type}`}>
      {text}
    </span>
  )
  
  return (
    <div 
      ref={containerRef}
      className="fixed z-50 cp-palette"
      style={{
        backgroundColor: '#151922',
        borderRadius: '12px',
        boxShadow: '0 12px 28px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35)',
        border: '1px solid #262A33',
        width: '420px',
        maxHeight: '420px',
        overflow: 'hidden',
        left: `${position.x}px`,
        top: `${position.y + 16}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!showPrompt ? (
        <>
          {/* Search Row */}
          <div 
            className="flex items-center"
            style={{
              height: '40px',
              padding: '8px 12px',
              borderBottom: '1px solid #262A33'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 outline-none text-sm transition-colors"
              style={{
                background: 'rgba(255,255,255,.06)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#EDEFF3',
                caretColor: '#2F81F7',
                border: 'none'
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement
                target.style.setProperty('--placeholder-color', target.value ? 'transparent' : '#9FA8BA')
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.10)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.06)'
              }}
              disabled={loading}
            />
            <button
              className="ml-2 p-1.5 rounded-md transition-all"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'transparent',
                opacity: 0.8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.opacity = '0.8'
              }}
            >
              <Mic size={18} strokeWidth={1.75} />
            </button>
          </div>
          
          {/* Command Rows */}
          <div className="overflow-y-auto py-2" style={{ maxHeight: '380px' }}>
            {filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon
              const isSelected = index === selectedIndex
              const hasActiveSubmenu = activeSubmenu === cmd.id
              
              return (
                <div key={cmd.id} className="relative">
                  <div
                    onClick={() => !loading && (cmd.hasSubmenu ? setActiveSubmenu(cmd.id) : executeCommand(cmd))}
                    className="cp-row cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--row-active)' : 'transparent',
                      opacity: loading ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--row-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <div className="cp-ico">
                      <Icon 
                        size={18} 
                        strokeWidth={1.75} 
                        style={{
                          color: cmd.category === 'ai' ? '#2F81F7' : 'rgba(255, 255, 255, 0.8)'
                        }}
                      />
                    </div>
                    <span className="cp-label">
                      {cmd.label}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      {cmd.shortcut && (
                        <span 
                          className="cp-chip gray"
                          style={{
                            fontFamily: cmd.shortcut === '+++' ? 'Monaco, Consolas, monospace' : 'Inter, system-ui'
                          }}
                        >
                          {cmd.shortcut}
                        </span>
                      )}
                      {selectedIndex === index && cmd.id === 'edit' && (
                        <span className="cp-chip blue">
                          ↵ Submit
                        </span>
                      )}
                    </div>
                    {cmd.hasSubmenu && (
                      <ChevronRight 
                        className="cp-chevron"
                        size={18}
                        strokeWidth={1.75}
                        style={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.8 }}
                      />
                    )}
                  </div>
                  
                  {/* Submenu */}
                  {hasActiveSubmenu && cmd.submenu && (
                    <div 
                      className="absolute left-full top-0 ml-2 py-2 z-10"
                      style={{
                        backgroundColor: 'var(--cp-bg)',
                        borderRadius: '12px',
                        boxShadow: 'var(--cp-shadow)',
                        border: '1px solid var(--cp-border)',
                        minWidth: '200px'
                      }}
                    >
                      {cmd.submenu.map((subCmd, subIndex) => {
                        const SubIcon = subCmd.icon
                        const isSubSelected = subIndex === submenuSelectedIndex
                        
                        return (
                          <div
                            key={subCmd.id}
                            onClick={() => !loading && executeCommand(subCmd)}
                            className="cp-row cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isSubSelected ? 'var(--row-active)' : 'transparent',
                              opacity: loading ? 0.5 : 1,
                              margin: '0 8px',
                              borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) {
                                e.currentTarget.style.backgroundColor = 'var(--row-hover)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <div className="cp-ico">
                              <SubIcon 
                                size={18} 
                                strokeWidth={1.75}
                                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                              />
                            </div>
                            <span className="cp-label">
                              {subCmd.label}
                            </span>
                            {subCmd.shortcut && (
                              <span className="cp-chip gray">
                                {subCmd.shortcut}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Add divider after Continue writing (4th command) to separate AI from utility commands */}
                  {cmd.id === 'continue' && (
                    <div className="cp-divider"></div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {currentAction === 'edit' ? 'How should I edit this text?' : 'What would you like to know?'}
            </h3>
            <button
              onClick={() => {
                setShowPrompt(false)
                setPrompt('')
                setCurrentAction(null)
              }}
              className="p-1 rounded transition-colors"
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <FileText className="h-4 w-4" />
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
            className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none mb-3 text-sm"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.9)',
              caretColor: '#2F81F7'
            }}
            disabled={loading}
          />
          
          <button
            onClick={handlePromptSubmit}
            disabled={!prompt.trim() || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: loading || !prompt.trim() ? 'rgba(47, 129, 247, 0.3)' : '#2F81F7',
              color: '#FFFFFF',
              opacity: loading || !prompt.trim() ? 0.5 : 1
            }}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}