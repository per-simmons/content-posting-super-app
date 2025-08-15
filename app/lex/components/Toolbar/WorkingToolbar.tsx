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
  const [currentHeading, setCurrentHeading] = useState('H1')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const footnoteCounterRef = useRef(1)
  const savedSelectionRef = useRef<Range | null>(null)

  // Save selection whenever it changes
  useEffect(() => {
    let rafId: number | null = null
    
    const saveSelection = () => {
      // Cancel any pending update
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      
      // Use requestAnimationFrame to batch DOM reads
      rafId = requestAnimationFrame(() => {
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
            let formatDetected = ''
            
            while (currentElement) {
              const tagName = currentElement.tagName
              if (tagName === 'H1') {
                formatDetected = 'H1'
                break
              } else if (tagName === 'H2') {
                formatDetected = 'H2'
                break
              } else if (tagName === 'H3') {
                formatDetected = 'H3'
                break
              } else if (tagName === 'H4') {
                formatDetected = 'H4'
                break
              } else if (tagName === 'H5') {
                formatDetected = 'H5'
                break
              }
              
              // Stop if we've reached the contenteditable container
              if (currentElement.hasAttribute && currentElement.hasAttribute('contenteditable')) {
                break
              }
              
              currentElement = currentElement.parentElement
            }
            
            // Only update if we found a format or need to set default
            if (formatDetected) {
              setCurrentHeading(formatDetected)
            } else if (isInTitle) {
              // If in title but no heading tag found, it's likely H1 styled text
              setCurrentHeading('H1')
            } else {
              // Only set to Paragraph if we're sure it's not a heading
              setCurrentHeading('Paragraph')
            }
          }
        }
      })
    }
    
    document.addEventListener('selectionchange', saveSelection)
    document.addEventListener('mouseup', saveSelection)
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
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
      if (!level.startsWith('H')) {
        // Don't change format, just close dropdown
        setShowHeadingDropdown(false)
        return
      }
      // Check if it's H1-H5
      const headingNum = parseInt(level.substring(1))
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
        if (level.startsWith('H')) {
          execCommand('formatBlock', level)
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
    <div className="flex items-center gap-0" role="toolbar" style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
      {/* Heading Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
          className={`px-2 py-1 flex items-center gap-0.5 transition-colors ${
            isDarkMode 
              ? 'hover:bg-[#3a3a3a]' 
              : 'hover:bg-[#E5E5E5]'
          } rounded`}
          style={{ 
            color: isDarkMode ? '#BBBBBB' : '#454545',
            fontSize: '13px',
            fontWeight: 500,
            minWidth: '52px'
          }}
        >
          <span>{currentHeading}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        
        {showHeadingDropdown && (
          <div className={`absolute top-full left-0 mt-1 py-1 shadow-lg border z-50 min-w-[100px] ${
            isDarkMode 
              ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
              : 'bg-white border-[#E5E5E5]'
          }`}
          style={{ borderRadius: '4px' }}>
            {[
              { value: 'H1', label: 'H1', size: '15px', weight: 600 },
              { value: 'H2', label: 'H2', size: '14px', weight: 600 },
              { value: 'H3', label: 'H3', size: '13px', weight: 600 },
              { value: 'H4', label: 'H4', size: '13px', weight: 500 },
              { value: 'H5', label: 'H5', size: '12px', weight: 500 },
              { value: 'Paragraph', label: 'Paragraph', size: '13px', weight: 400 },
              { value: 'Bulleted list', label: 'Bulleted list', size: '13px', weight: 400 },
              { value: 'Numbered list', label: 'Numbered list', size: '13px', weight: 400 },
              { value: 'Todo list', label: 'Todo list', size: '13px', weight: 400 }
            ].map((option, index) => (
              <button
                key={option.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setHeading(option.value)}
                className={`w-full text-left px-3 py-1 transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-[#2a2a2a]' 
                    : 'hover:bg-[#EDEDED]'
                } ${index === 5 ? 'border-t border-[#E5E5E5] mt-1 pt-1' : ''}`}
                style={{ 
                  color: '#454545',
                  fontSize: option.size,
                  fontWeight: option.weight,
                  lineHeight: '1.4'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('bold')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Bold (Cmd+B)"
      >
        <Bold className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('italic')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Italic (Cmd+I)"
      >
        <Italic className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('underline')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Underline (Cmd+U)"
      >
        <Underline className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('strikethrough')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>

      {/* Insert Elements */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLink}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Insert Link"
      >
        <Link className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Block Quote"
      >
        <Quote className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertInlineCode}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Insert Code"
      >
        <Code className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>

      {/* Sub/Superscript */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('subscript')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Subscript"
      >
        <Subscript className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('superscript')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Superscript"
      >
        <Superscript className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertFootnote}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Insert Footnote"
      >
        <Hash className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>

      {/* Horizontal Rule & Clear Formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('insertHorizontalRule')}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Insert Horizontal Rule"
      >
        <Minus className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={clearFormatting}
        className={`p-1 rounded transition-colors ${
          isDarkMode ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#E5E5E5]'
        }`}
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" style={{ color: isDarkMode ? '#BBBBBB' : '#454545' }} />
      </button>
    </div>
  )
}