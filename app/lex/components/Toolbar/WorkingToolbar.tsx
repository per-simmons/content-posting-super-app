'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronDown, Bold, Italic, Underline, Strikethrough,
  Link2, Quote, Code2, Hash, Subscript, Superscript,
  Minus, X, List, ListOrdered, CheckSquare
} from 'lucide-react'

interface WorkingToolbarProps {
  isDarkMode: boolean
}

export function WorkingToolbar({ isDarkMode }: WorkingToolbarProps) {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [currentHeading, setCurrentHeading] = useState('H1')
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
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
              
            // Look for format tags in parent hierarchy
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
              } else if (tagName === 'P') {
                formatDetected = 'Paragraph'
                break
              } else if (tagName === 'DIV' && currentElement.hasAttribute('contenteditable')) {
                // If we're at the root contenteditable div, it's paragraph text
                formatDetected = 'Paragraph'
                break
              }
              
              // Stop if we've reached the contenteditable container
              if (currentElement.hasAttribute && currentElement.hasAttribute('contenteditable')) {
                break
              }
              
              currentElement = currentElement.parentElement
            }
            
            // Set the detected format or default appropriately
            if (formatDetected) {
              setCurrentHeading(formatDetected)
            } else if (isInTitle) {
              // If in title but no heading tag found, it's likely H1 styled text
              setCurrentHeading('H1')
            } else {
              // Default to Paragraph for body text
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
              document.execCommand('insertUnorderedList', false, undefined)
              editor.focus()
            }
          }
        }
        break
      case 'Numbered list':
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
              document.execCommand('insertOrderedList', false, undefined)
              editor.focus()
            }
          }
        }
        break
      case 'Todo list':
        // Create proper todo list with checkbox and indentation
        if (savedSelectionRef.current) {
          const sel = window.getSelection()
          if (sel) {
            sel.removeAllRanges()
            sel.addRange(savedSelectionRef.current)
            
            const selectedText = savedSelectionRef.current.toString()
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
              
              // Create todo item with proper structure and indentation
              const todoHTML = `<div style="display: flex; align-items: flex-start; margin: 4px 0; padding-left: 8px;"><input type="checkbox" style="margin-right: 8px; margin-top: 2px; flex-shrink: 0;">${selectedText || ''}</div>`
              
              // If there's selected text, replace it, otherwise insert at cursor
              if (selectedText) {
                document.execCommand('insertHTML', false, todoHTML)
              } else {
                document.execCommand('insertHTML', false, todoHTML)
              }
              
              editor.focus()
            }
          }
        }
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

  const showTooltip = (e: React.MouseEvent<HTMLButtonElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
  }

  const hideTooltip = () => {
    setTooltip(null)
  }


  return (
    <div className="flex items-center gap-0.5" role="toolbar">
      {/* Heading Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
          className="flex items-center gap-1 transition-colors"
          style={{ 
            backgroundColor: currentHeading.startsWith('H') ? 'rgba(47,129,247,0.25)' : 'transparent',
            color: isDarkMode ? '#EDEFF3' : '#454545',
            fontSize: '12px',
            fontWeight: 600,
            padding: '3px 8px',
            height: '26px',
            borderRadius: '6px',
            minWidth: '44px'
          }}
        >
          <span>{currentHeading}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        
        {showHeadingDropdown && (
          <div className="absolute top-full left-0 mt-1 py-1.5 z-50"
          style={{ 
            backgroundColor: isDarkMode ? '#151922' : '#ffffff',
            borderRadius: '10px', 
            minWidth: '180px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E5E5E5'
          }}>
            {/* Heading Options with Tags */}
            <div className="px-2">
              {[
                { value: 'H1', label: 'Heading 1' },
                { value: 'H2', label: 'Heading 2' },
                { value: 'H3', label: 'Heading 3' },
                { value: 'H4', label: 'Heading 4' },
                { value: 'H5', label: 'Heading 5' }
              ].map((option) => (
                <button
                  key={option.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setHeading(option.value)}
                  className="w-full text-left flex items-center transition-colors"
                  style={{ 
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="flex items-center" style={{ gap: '12px' }}>
                    <span style={{ 
                      backgroundColor: currentHeading === option.value 
                        ? 'rgba(47,129,247,0.25)' 
                        : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      color: currentHeading === option.value 
                        ? '#4A9EFF' 
                        : isDarkMode ? 'rgba(255,255,255,0.7)' : '#666666',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      height: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      minWidth: '28px',
                      justifyContent: 'center'
                    }}>
                      {option.value}
                    </span>
                    <span style={{ 
                      color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#454545',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: '20px'
                    }}>{option.label}</span>
                  </span>
                </button>
              ))}
            </div>
            
            {/* Separator */}
            <div style={{ 
              height: '1px', 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              margin: '8px 12px'
            }} />
            
            {/* Paragraph and Other Options */}
            <div className="px-2">
              {/* Paragraph Option */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setHeading('Paragraph')}
                className="w-full text-left flex items-center transition-colors"
                style={{ 
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="flex items-center" style={{ gap: '12px' }}>
                  <span style={{ 
                    width: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#999999'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 4h10M3 8h10M3 12h6" />
                    </svg>
                  </span>
                  <span style={{ 
                    color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#454545',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '20px'
                  }}>Paragraph</span>
                </span>
              </button>
              
              {/* List Options */}
              {[
                { value: 'Bulleted list', label: 'Bulleted list', icon: 'List' },
                { value: 'Numbered list', label: 'Numbered list', icon: 'ListOrdered' },
                { value: 'Todo list', label: 'Todo list', icon: 'CheckSquare' }
              ].map((option) => (
                <button
                  key={option.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setHeading(option.value)}
                  className="w-full text-left flex items-center transition-colors"
                  style={{ 
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="flex items-center" style={{ 
                    gap: option.label ? '12px' : '0',
                    justifyContent: option.label ? 'flex-start' : 'center'
                  }}>
                    <span style={{ 
                      width: '20px',
                      height: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#999999'
                    }}>
                      {option.icon === 'AlignLeft' && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 4h10M3 8h10M3 12h10" />
                        </svg>
                      )}
                      {option.icon === 'List' && (
                        <List className="h-3.5 w-3.5" style={{ strokeWidth: '1.5px' }} />
                      )}
                      {option.icon === 'ListOrdered' && (
                        <ListOrdered className="h-3.5 w-3.5" style={{ strokeWidth: '1.5px' }} />
                      )}
                      {option.icon === 'CheckSquare' && (
                        <CheckSquare className="h-3.5 w-3.5" style={{ strokeWidth: '1.5px' }} />
                      )}
                    </span>
                    {option.label && (
                      <span style={{ 
                        color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#454545',
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '20px'
                      }}>{option.label}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('bold')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Bold ⌘B')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Bold size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('italic')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Italic ⌘I')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Italic size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('underline')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Underline ⌘U')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Underline size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('strikethrough')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Strikethrough')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Strikethrough size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>

      {/* Insert Elements */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLink}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Link')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Link2 size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Quote')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Quote size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertInlineCode}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Code')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Code2 size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>

      {/* Sub/Superscript */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('subscript')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Subscript')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Subscript size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('superscript')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Superscript')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Superscript size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertFootnote}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Footnote')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Hash size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>

      {/* Horizontal Rule */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execCommand('insertHorizontalRule')}
        className="h-8 px-2 rounded-md transition-colors inline-flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#000000'
          showTooltip(e, 'Divider')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(69,69,69,0.85)'
          hideTooltip()
        }}
      >
        <Minus size={18} strokeWidth={1.75} style={{ color: 'currentColor' }} />
      </button>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div
            className="px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {tooltip.text}
            <div
              className="absolute top-full left-1/2"
              style={{
                transform: 'translateX(-50%) rotate(45deg)',
                width: '6px',
                height: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                marginTop: '-3px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}