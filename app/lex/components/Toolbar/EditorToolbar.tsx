'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronDown, Bold, Italic, Underline, Strikethrough,
  Link, Quote, Code, Hash, Subscript, Superscript,
  Minus, Type, X
} from 'lucide-react'

interface EditorToolbarProps {
  isDarkMode: boolean
  onFormat: (command: string, value?: string) => void
}

export function EditorToolbar({ isDarkMode, onFormat }: EditorToolbarProps) {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [currentHeading, setCurrentHeading] = useState('Normal')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)
  const footnoteCounterRef = useRef(1)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHeadingDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelectionRef.current)
      }
      return true
    }
    return false
  }

  const execCommand = (command: string, value?: string) => {
    restoreSelection()
    document.execCommand(command, false, value)
    // Focus back to editor
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) editor.focus()
  }

  const setHeading = (level: string) => {
    restoreSelection()
    if (level === 'Normal') {
      document.execCommand('formatBlock', false, 'P')
    } else {
      const tag = level
      if (!document.execCommand('formatBlock', false, tag)) {
        document.execCommand('formatBlock', false, `<${tag.toLowerCase()}>`)
      }
    }
    setCurrentHeading(level)
    setShowHeadingDropdown(false)
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) editor.focus()
  }

  const insertLink = () => {
    restoreSelection()
    const url = prompt('Enter URL:')
    if (url) {
      document.execCommand('createLink', false, url)
    }
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) editor.focus()
  }

  const insertInlineCode = () => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    const text = range.toString()
    
    if (!text) {
      document.execCommand('insertHTML', false, `<code>\u200B</code>`)
    } else {
      const escaped = text.replace(/[&<>"']/g, (s: string) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }
        return entities[s]
      })
      document.execCommand('insertHTML', false, `<code>${escaped}</code>`)
    }
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) editor.focus()
  }

  const insertFootnote = () => {
    restoreSelection()
    const id = footnoteCounterRef.current++
    const refId = `fnref-${id}`
    const noteId = `fn-${id}`
    
    // Insert the superscript reference
    const refHTML = `<sup id="${refId}" class="footnote-ref"><a href="#${noteId}">[${id}]</a></sup>`
    document.execCommand('insertHTML', false, refHTML + '\u200A')
    
    // Add footnote section at end if not exists
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) {
      let container = editor.querySelector('.footnotes') as HTMLElement
      if (!container) {
        container = document.createElement('section')
        container.className = 'footnotes'
        container.innerHTML = '<hr><ol></ol>'
        editor.appendChild(container)
      }
      
      const ol = container.querySelector('ol')
      if (ol) {
        const li = document.createElement('li')
        li.id = noteId
        li.innerHTML = `<span contenteditable="true">Footnote ${id}...</span> <a href="#${refId}" class="footnote-backref">↩︎</a>`
        ol.appendChild(li)
      }
      editor.focus()
    }
  }

  const clearFormatting = () => {
    restoreSelection()
    document.execCommand('removeFormat')
    document.execCommand('unlink')
    document.execCommand('formatBlock', false, 'P')
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) editor.focus()
  }

  const tools = [
    {
      type: 'dropdown',
      current: currentHeading,
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5'],
      onSelect: setHeading
    },
    { type: 'divider' },
    { icon: Bold, action: () => execCommand('bold'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => execCommand('italic'), title: 'Italic (Ctrl+I)' },
    { icon: Underline, action: () => execCommand('underline'), title: 'Underline (Ctrl+U)' },
    { icon: Strikethrough, action: () => execCommand('strikethrough'), title: 'Strikethrough' },
    { type: 'divider' },
    { icon: Link, action: insertLink, title: 'Insert Link' },
    { icon: Quote, action: () => execCommand('formatBlock', 'BLOCKQUOTE'), title: 'Block Quote' },
    { icon: Code, action: insertInlineCode, title: 'Insert Code' },
    { type: 'divider' },
    { icon: Subscript, action: () => execCommand('subscript'), title: 'Subscript' },
    { icon: Superscript, action: () => execCommand('superscript'), title: 'Superscript' },
    { icon: Hash, action: insertFootnote, title: 'Insert Footnote' },
    { type: 'divider' },
    { icon: Minus, action: () => execCommand('insertHorizontalRule'), title: 'Insert Horizontal Rule' },
    { icon: Type, action: clearFormatting, title: 'Clear Formatting', strikethrough: true }
  ]

  return (
    <div className="flex items-center gap-0.5">
      {tools.map((tool, index) => {
        if (tool.type === 'divider') {
          return <div key={`divider-${index}`} className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
        }
        
        if (tool.type === 'dropdown') {
          return (
            <div key="heading-dropdown" className="relative" ref={dropdownRef}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveSelection()
                }}
                onClick={(e) => {
                  e.preventDefault()
                  setShowHeadingDropdown(!showHeadingDropdown)
                }}
                className={`px-2 py-1.5 rounded flex items-center gap-1 transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-[#3a3a3a] text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                style={{ color: '#BBBBBB' }}
              >
                <span className="text-sm">{tool.current}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showHeadingDropdown && (
                <div className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border z-50 ${
                  isDarkMode 
                    ? 'bg-[#242424] border-[#3a3a3a]' 
                    : 'bg-white border-gray-200'
                }`}>
                  {tool.options?.map(option => (
                    <button
                      key={option}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        saveSelection()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        tool.onSelect?.(option)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-[#3a3a3a] text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      style={{ 
                        fontSize: option === 'H1' ? '20px' : 
                                 option === 'H2' ? '18px' : 
                                 option === 'H3' ? '16px' : 
                                 option === 'H4' ? '15px' : 
                                 option === 'H5' ? '14px' : '14px',
                        fontWeight: option.startsWith('H') ? 'bold' : 'normal'
                      }}
                    >
                      {option === 'Normal' ? 'Normal Text' : `Heading ${option.slice(1)}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }
        
        const { icon: Icon, action, title, strikethrough } = tool as any
        return (
          <button
            key={`tool-${index}`}
            onMouseDown={(e) => {
              e.preventDefault()
              saveSelection()
            }}
            onClick={(e) => {
              e.preventDefault()
              action()
            }}
            title={title}
            className={`p-1.5 rounded transition-colors relative ${
              isDarkMode 
                ? 'hover:bg-[#3a3a3a] text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" style={{ color: '#BBBBBB' }} />
            {strikethrough && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-5 h-px bg-current rotate-45" style={{ backgroundColor: '#BBBBBB' }} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}