'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ChevronDown, Bold, Italic, Underline, Strikethrough,
  Link, Quote, Code, Hash, Subscript, Superscript,
  Minus, RemoveFormatting
} from 'lucide-react'

interface FixedToolbarProps {
  isDarkMode: boolean
}

interface SavedSelection {
  start: number
  end: number
  text: string
}

export function FixedToolbar({ isDarkMode }: FixedToolbarProps) {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [currentHeading, setCurrentHeading] = useState('Normal')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const footnoteCounterRef = useRef(1)
  const savedSelectionRef = useRef<SavedSelection | null>(null)
  const lastSelectionRef = useRef<SavedSelection | null>(null)

  // Get text node and its offset within parent
  const getTextNodeAndOffset = (container: Node, offset: number): [Node, number] => {
    let currentOffset = 0
    
    function traverse(node: Node): [Node, number] | null {
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.textContent?.length || 0
        if (currentOffset + len >= offset) {
          return [node, offset - currentOffset]
        }
        currentOffset += len
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          const result = traverse(node.childNodes[i])
          if (result) return result
        }
      }
      return null
    }
    
    return traverse(container) || [container, 0]
  }

  // Save selection as indices
  const saveSelection = useCallback(() => {
    const editor = document.querySelector('[contenteditable="true"]')
    if (!editor) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    if (range.collapsed) return

    // Get the selected text
    const selectedText = range.toString()
    if (!selectedText) return

    // Find the start and end positions relative to the editor's text content
    const editorText = editor.textContent || ''
    const tempRange = document.createRange()
    tempRange.selectNodeContents(editor)
    tempRange.setEnd(range.startContainer, range.startOffset)
    const start = tempRange.toString().length
    
    tempRange.setEnd(range.endContainer, range.endOffset)
    const end = tempRange.toString().length

    const selection = {
      start,
      end,
      text: selectedText
    }
    
    savedSelectionRef.current = selection
    lastSelectionRef.current = selection
    console.log('Saved selection:', selection)
  }, [])

  // Restore selection from indices
  const restoreSelection = useCallback(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      console.log('No editor found')
      return false
    }
    
    // Use savedSelectionRef first, fall back to lastSelectionRef
    const selection = savedSelectionRef.current || lastSelectionRef.current
    if (!selection) {
      console.log('No saved selection')
      return false
    }

    const { start, end } = selection
    const editorText = editor.textContent || ''
    
    if (start < 0 || end > editorText.length) {
      console.log('Invalid selection range')
      return false
    }

    try {
      // Focus the editor
      editor.focus()

      // Create a new range
      const range = document.createRange()
      const sel = window.getSelection()
      if (!sel) return false

      // Find the start and end nodes/offsets
      const [startNode, startOffset] = getTextNodeAndOffset(editor, start)
      const [endNode, endOffset] = getTextNodeAndOffset(editor, end)

      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)

      sel.removeAllRanges()
      sel.addRange(range)

      console.log('Restored selection:', range.toString())
      return true
    } catch (e) {
      console.error('Error restoring selection:', e)
      return false
    }
  }, [])

  useEffect(() => {
    // Track selection changes
    const handleSelectionChange = () => {
      saveSelection()
    }
    
    // Save on various events
    const handleMouseUp = () => {
      setTimeout(saveSelection, 0)
    }
    
    const handleKeyUp = () => {
      setTimeout(saveSelection, 0)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [saveSelection])

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

  // Apply formatting using direct DOM manipulation
  const applyFormatting = useCallback((tagName: string) => {
    console.log(`Applying formatting: ${tagName}`)
    
    // Restore the saved selection
    const restored = restoreSelection()
    if (!restored) {
      console.log('Could not restore selection')
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      console.log('No selection after restore')
      return
    }
    
    const range = sel.getRangeAt(0)
    if (range.collapsed) {
      console.log('Range is collapsed after restore')
      return
    }
    
    console.log('Selected text:', range.toString())
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return

    try {
      // Clone the range before modifying it
      const workingRange = range.cloneRange()
      
      // Check if we're removing or adding formatting
      const parentElement = workingRange.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? workingRange.commonAncestorContainer.parentElement
        : workingRange.commonAncestorContainer as HTMLElement
      
      let existingTag: HTMLElement | null = null
      let current: HTMLElement | null = parentElement
      
      // Look for existing formatting tag
      while (current && current !== editor) {
        if (current.tagName?.toLowerCase() === tagName.toLowerCase()) {
          existingTag = current
          break
        }
        current = current.parentElement
      }
      
      if (existingTag) {
        // Remove formatting
        const parent = existingTag.parentNode
        if (parent) {
          while (existingTag.firstChild) {
            parent.insertBefore(existingTag.firstChild, existingTag)
          }
          parent.removeChild(existingTag)
        }
      } else {
        // Add formatting - use surroundContents for simple cases
        try {
          const wrapper = document.createElement(tagName)
          workingRange.surroundContents(wrapper)
          
          // Select the newly wrapped content
          workingRange.selectNodeContents(wrapper)
          sel.removeAllRanges()
          sel.addRange(workingRange)
        } catch (e) {
          // If surroundContents fails (e.g., partial selection across elements),
          // fall back to extractContents
          const contents = workingRange.extractContents()
          const wrapper = document.createElement(tagName)
          wrapper.appendChild(contents)
          workingRange.insertNode(wrapper)
          
          // Select the newly wrapped content
          workingRange.selectNodeContents(wrapper)
          sel.removeAllRanges()
          sel.addRange(workingRange)
        }
      }
      
      // Save the new selection
      saveSelection()
      
      // Keep focus on editor
      editor.focus()
      
      // Trigger input event to update parent state
      const inputEvent = new Event('input', { bubbles: true })
      editor.dispatchEvent(inputEvent)
      
      console.log('Formatting applied successfully, new HTML:', editor.innerHTML.substring(0, 100))
    } catch (e) {
      console.error('Error applying formatting:', e)
    }
  }, [restoreSelection, saveSelection])

  // Apply block-level formatting (headings, paragraphs)
  const applyBlockFormat = useCallback((tagName: string) => {
    const restored = restoreSelection()
    if (!restored) return

    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    let range = sel.getRangeAt(0)

    try {
      // Find the block-level parent
      let blockParent = range.commonAncestorContainer as Node
      
      // If it's a text node, get its parent
      if (blockParent.nodeType === Node.TEXT_NODE) {
        blockParent = blockParent.parentNode as Node
      }
      
      // Find the nearest block-level element
      while (blockParent && blockParent !== editor) {
        const tagName = (blockParent as HTMLElement).tagName
        if (tagName && /^(P|H[1-6]|DIV|BLOCKQUOTE)$/i.test(tagName)) {
          break
        }
        blockParent = blockParent.parentNode as Node
      }
      
      // If we're at the editor level, wrap the content in the new tag
      if (blockParent === editor || !blockParent) {
        const wrapper = document.createElement(tagName)
        wrapper.appendChild(range.extractContents())
        range.insertNode(wrapper)
      } else {
        // Replace the existing block tag
        const newBlock = document.createElement(tagName)
        while (blockParent.firstChild) {
          newBlock.appendChild(blockParent.firstChild)
        }
        blockParent.parentNode?.replaceChild(newBlock, blockParent)
        
        // Restore selection
        range = document.createRange()
        range.selectNodeContents(newBlock)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      
      saveSelection()
      editor.focus()
      
      // Trigger input event to update parent state
      const inputEvent = new Event('input', { bubbles: true })
      editor.dispatchEvent(inputEvent)
    } catch (e) {
      console.error('Error applying block format:', e)
    }
  }, [restoreSelection, saveSelection])

  // Handle heading selection
  const setHeading = useCallback((level: string) => {
    if (level === 'Normal') {
      applyBlockFormat('p')
    } else {
      applyBlockFormat(level.toLowerCase())
    }
    setCurrentHeading(level)
    setShowHeadingDropdown(false)
  }, [applyBlockFormat])

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (!url) return
    
    const restored = restoreSelection()
    if (!restored) return
    
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return
    
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    
    try {
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.appendChild(range.extractContents())
      range.insertNode(link)
      
      range.selectNodeContents(link)
      sel.removeAllRanges()
      sel.addRange(range)
      
      saveSelection()
      editor.focus()
      
      // Trigger input event to update parent state
      const inputEvent = new Event('input', { bubbles: true })
      editor.dispatchEvent(inputEvent)
    } catch (e) {
      console.error('Error inserting link:', e)
    }
  }, [restoreSelection, saveSelection])

  // Insert inline code
  const insertInlineCode = useCallback(() => {
    applyFormatting('code')
  }, [applyFormatting])

  // Insert footnote
  const insertFootnote = useCallback(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return
    
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    const id = footnoteCounterRef.current++
    const sup = document.createElement('sup')
    sup.textContent = `[${id}]`
    
    range.insertNode(sup)
    range.setStartAfter(sup)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    
    editor.focus()
    
    // Trigger input event to update parent state
    const inputEvent = new Event('input', { bubbles: true })
    editor.dispatchEvent(inputEvent)
  }, [])

  // Insert horizontal rule
  const insertHR = useCallback(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return
    
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    const hr = document.createElement('hr')
    const br = document.createElement('br')
    
    range.insertNode(br)
    range.insertNode(hr)
    range.setStartAfter(br)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    
    editor.focus()
    
    // Trigger input event to update parent state
    const inputEvent = new Event('input', { bubbles: true })
    editor.dispatchEvent(inputEvent)
  }, [])

  // Clear formatting
  const clearFormatting = useCallback(() => {
    const restored = restoreSelection()
    if (!restored) return
    
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return
    
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    
    try {
      const text = range.toString()
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      
      saveSelection()
      editor.focus()
      
      // Trigger input event to update parent state
      const inputEvent = new Event('input', { bubbles: true })
      editor.dispatchEvent(inputEvent)
    } catch (e) {
      console.error('Error clearing formatting:', e)
    }
  }, [restoreSelection, saveSelection])

  return (
    <div 
      className="flex items-center gap-0.5" 
      role="toolbar"
    >
      {/* Heading Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowHeadingDropdown(!showHeadingDropdown)
          }}
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
          <div className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[120px] ${
            isDarkMode 
              ? 'bg-[#242424] border-[#3a3a3a]' 
              : 'bg-white border-gray-200'
          }`}>
            {['Normal', 'H1', 'H2', 'H3', 'H4', 'H5'].map(option => (
              <button
                key={option}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setHeading(option)
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-[#3a3a3a]' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ 
                  color: '#BBBBBB',
                  fontSize: option === 'H1' ? '18px' : 
                           option === 'H2' ? '16px' : 
                           option === 'H3' ? '15px' : 
                           option === 'H4' ? '14px' : 
                           option === 'H5' ? '13px' : '14px',
                  fontWeight: option.startsWith('H') ? 'bold' : 'normal'
                }}
              >
                {option === 'Normal' ? 'Normal' : `Heading ${option.slice(1)}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Text Formatting */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('strong')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Bold"
      >
        <Bold className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('em')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Italic"
      >
        <Italic className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('u')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Underline"
      >
        <Underline className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('s')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Insert Elements */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={insertLink}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Link"
      >
        <Link className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyBlockFormat('blockquote')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Block Quote"
      >
        <Quote className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={insertInlineCode}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Code"
      >
        <Code className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Sub/Superscript */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('sub')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Subscript"
      >
        <Subscript className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={() => applyFormatting('sup')}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Superscript"
      >
        <Superscript className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={insertFootnote}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Footnote"
      >
        <Hash className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>

      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Horizontal Rule & Clear Formatting */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={insertHR}
        className="p-1.5 rounded hover:bg-[#3a3a3a]"
        title="Insert Horizontal Rule"
      >
        <Minus className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        onClick={clearFormatting}
        className="p-1.5 rounded hover:bg-[#3a3a3a] relative"
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" style={{ color: '#BBBBBB' }} />
      </button>
    </div>
  )
}