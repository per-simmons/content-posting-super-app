'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronDown, Bold, Italic, Underline, Strikethrough,
  Link, Quote, Code, Hash, Subscript, Superscript,
  Minus, RemoveFormatting, X, List, ListOrdered, CheckSquare
} from 'lucide-react'

interface WorkingToolbarProps {
  isDarkMode: boolean
}

export function WorkingToolbar({ isDarkMode }: WorkingToolbarProps) {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [currentHeading, setCurrentHeading] = useState('Paragraph')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const footnoteCounterRef = useRef(1)
  const savedSelectionRef = useRef<Range | null>(null)

  // Save selection whenever it changes
  useEffect(() => {
    const saveSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        // Check if selection is in any contenteditable element
        const editors = document.querySelectorAll('[contenteditable="true"]')
        let isInEditor = false
        let isInTitle = false
        
        editors.forEach(editor => {
          if (editor.contains(range.commonAncestorContainer)) {
            isInEditor = true
            // Check if this is the title field
            if (editor.getAttribute('data-editor-type') === 'title') {
              isInTitle = true
            }
          }
        })
        
        if (isInEditor) {
          savedSelectionRef.current = range.cloneRange()
          
          // Check what format is currently applied
          let parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer as HTMLElement
            
          // Look for heading tags in parent hierarchy
          let currentElement = parentElement
          let headingFound = false
          
          while (currentElement && !headingFound) {
            const tagName = currentElement.tagName
            if (tagName === 'H1') {
              setCurrentHeading('Heading 1')
              headingFound = true
            } else if (tagName === 'H2') {
              setCurrentHeading('Heading 2')
              headingFound = true
            } else if (tagName === 'H3') {
              setCurrentHeading('Heading 3')
              headingFound = true
            } else if (tagName === 'H4') {
              setCurrentHeading('Heading 4')
              headingFound = true
            } else if (tagName === 'H5') {
              setCurrentHeading('Heading 5')
              headingFound = true
            }
            
            // Stop if we've reached the contenteditable container
            if (currentElement.hasAttribute && currentElement.hasAttribute('contenteditable')) {
              break
            }
            
            currentElement = currentElement.parentElement
          }
          
          if (!headingFound) {
            if (isInTitle) {
              // If in title but no heading tag found, default to H1
              setCurrentHeading('Heading 1')
            } else {
              setCurrentHeading('Paragraph')
            }
          }
        }
      }
    }
    
    document.addEventListener('selectionchange', saveSelection)
    document.addEventListener('mouseup', saveSelection)
    return () => {
      document.removeEventListener('selectionchange', saveSelection)
      document.removeEventListener('mouseup', saveSelection)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHeadingDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const execCommand = (command: string, value?: string) => {
    // Restore saved selection first
    if (savedSelectionRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelectionRef.current)
        
        // Get the editor that contains the selection
        const container = savedSelectionRef.current.commonAncestorContainer
        let editor = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement
          
        // Find the contenteditable parent
        while (editor && !editor.hasAttribute('contenteditable')) {
          editor = editor.parentElement
        }
        
        if (editor) {
          editor.focus()
          // Execute command immediately
          document.execCommand(command, false, value || undefined)
          editor.focus()
        }
      }
    }
  }

  const setHeading = (level: string) => {
    // Check if we're in the title field
    let isInTitle = false
    if (savedSelectionRef.current) {
      const container = savedSelectionRef.current.commonAncestorContainer
      let element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as HTMLElement
      
      // Find the contenteditable parent
      while (element && !element.hasAttribute('contenteditable')) {
        element = element.parentElement
      }
      
      // Check if this is the title field
      if (element && element.getAttribute('data-editor-type') === 'title') {
        isInTitle = true
      }
    }
    
    // If in title field, only allow H1-H5
    if (isInTitle) {
      // Only process heading formats
      if (!level.startsWith('Heading')) {
        // Don't change format, just close dropdown
        setShowHeadingDropdown(false)
        return
      }
      // Check if it's H1-H5 (Heading 1 through Heading 5)
      const headingNum = parseInt(level.split(' ')[1])
      if (headingNum > 5) {
        // Don't allow H6 or higher in title
        setShowHeadingDropdown(false)
        return
      }
    }
    
    // Apply the format
    switch(level) {
      case 'Paragraph':
        execCommand('formatBlock', 'P')
        break
      case 'Subtitle':
        // Apply a special class or style for subtitle
        execCommand('formatBlock', 'P')
        // Apply custom styling after
        break
      case 'Bulleted list':
        execCommand('insertUnorderedList')
        break
      case 'Numbered list':
        execCommand('insertOrderedList')
        break
      case 'Todo list':
        // Insert a checkbox with task list
        execCommand('insertHTML', '<input type="checkbox"> ')
        break
      default:
        if (level.startsWith('Heading')) {
          const hLevel = 'H' + level.split(' ')[1]
          execCommand('formatBlock', hLevel)
        }
        break
    }
    setCurrentHeading(level)
    setShowHeadingDropdown(false)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertInlineCode = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const text = range.toString()
      
      if (text) {
        execCommand('insertHTML', `<code>${text}</code>`)
      } else {
        execCommand('insertHTML', '<code>&nbsp;</code>')
      }
    }
  }

  const insertFootnote = () => {
    const id = footnoteCounterRef.current++
    const html = `<sup>[${id}]</sup>`
    execCommand('insertHTML', html)
  }

  const clearFormatting = () => {
    execCommand('removeFormat')
    execCommand('formatBlock', 'P')
  }

  return (
    <div className="flex items-center gap-0.5" role="toolbar">
      {/* Heading Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
          className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            isDarkMode 
              ? 'hover:bg-[#3a3a3a]' 
              : 'hover:bg-gray-100'
          }`}
          style={{ color: '#BBBBBB' }}
        >
          <span className="text-sm">{currentHeading}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        
        {showHeadingDropdown && (
          <div className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl border z-50 min-w-[180px] ${
            isDarkMode 
              ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
              : 'bg-white border-gray-200'
          }`}>
            {[
              { value: 'Heading 1', label: 'Heading 1', icon: 'H1', size: '20px', weight: 600 },
              { value: 'Heading 2', label: 'Heading 2', icon: 'H2', size: '18px', weight: 600 },
              { value: 'Heading 3', label: 'Heading 3', icon: 'H3', size: '16px', weight: 600 },
              { value: 'Heading 4', label: 'Heading 4', icon: 'H4', size: '15px', weight: 500 },
              { value: 'Heading 5', label: 'Heading 5', icon: 'H5', size: '14px', weight: 500 },
              { value: 'Subtitle', label: 'Subtitle', icon: '═', size: '14px', weight: 500, color: '#888' },
              { value: 'Paragraph', label: 'Paragraph', icon: '═', size: '14px', weight: 400 },
              { value: 'Bulleted list', label: 'Bulleted list', icon: '•', size: '14px', weight: 400 },
              { value: 'Numbered list', label: 'Numbered list', icon: '1.', size: '14px', weight: 400 },
              { value: 'Todo list', label: 'Todo list', icon: '☐', size: '14px', weight: 400 }
            ].map((option, index) => (
              <button
                key={option.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setHeading(option.value)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-[#2a2a2a]' 
                    : 'hover:bg-gray-100'
                } ${index === 5 || index === 6 ? 'border-t border-[#3a3a3a] mt-1 pt-2' : ''}`}
                style={{ 
                  color: option.color || '#BBBBBB'
                }}
              >
                <span className="w-6 text-center opacity-60" style={{ 
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {option.icon}
                </span>
                <span style={{ 
                  fontSize: option.size,
                  fontWeight: option.weight
                }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Text Formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('bold')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Bold"
      >
        <Bold className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('italic')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Italic"
      >
        <Italic className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('underline')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Underline"
      >
        <Underline className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('strikethrough')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Insert Elements */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLink}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Link"
      >
        <Link className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Block Quote"
      >
        <Quote className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertInlineCode}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Code"
      >
        <Code className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Sub/Superscript */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('subscript')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Subscript"
      >
        <Subscript className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('superscript')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Superscript"
      >
        <Superscript className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertFootnote}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Footnote"
      >
        <Hash className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Horizontal Rule & Clear Formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('insertHorizontalRule')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Horizontal Rule"
      >
        <Minus className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={clearFormatting}
        className="p-1.5 rounded hover:bg-[#3a3a3a] relative"
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
    </div>
  )
}