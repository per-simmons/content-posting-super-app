'use client'

import { useRef, useEffect } from 'react'

interface SimpleEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selection: any) => void
  isDarkMode: boolean
  showTitle: boolean
}

export function SimpleEditor({ content, onChange, onSelectionChange, isDarkMode, showTitle }: SimpleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && content) {
      editorRef.current.innerHTML = content
    }
  }, [])

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0)
        const editorElement = editorRef.current
        
        // Check if selection is within the editor
        if (editorElement && editorElement.contains(range.commonAncestorContainer)) {
          onSelectionChange({
            text: selection.toString(),
            range: range
          })
          return
        }
      }
      
      onSelectionChange(null)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
    }
  }, [onSelectionChange])

  const handleInput = () => {
    if (editorRef.current && !isInternalChange.current) {
      // Clean up empty-line classes when content is added
      const emptyLines = editorRef.current.querySelectorAll('.empty-line')
      emptyLines.forEach(line => {
        if (line.textContent && line.textContent.trim() !== '') {
          line.classList.remove('empty-line')
          line.removeAttribute('data-placeholder')
        }
      })
      
      onChange(editorRef.current.innerHTML)
    }
    isInternalChange.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle backspace at beginning to go back to title
    if (e.key === 'Backspace' && editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        // If at the very beginning of the editor
        if (range.startOffset === 0 && range.collapsed) {
          const firstNode = editorRef.current.firstChild
          if (!firstNode || (firstNode.textContent === '')) {
            e.preventDefault()
            // Focus back to title
            const titleEditor = document.querySelector('[data-editor-type="title"]') as HTMLElement
            if (titleEditor) {
              titleEditor.focus()
              // Place cursor at end of title
              const range = document.createRange()
              const sel = window.getSelection()
              range.selectNodeContents(titleEditor)
              range.collapse(false)
              sel?.removeAllRanges()
              sel?.addRange(range)
            }
          }
        }
      }
    }
    // Handle Enter key to create placeholder divs
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Insert a div with placeholder class
      document.execCommand('insertHTML', false, '<div class="empty-line" data-placeholder="Type ⌘K for commands"><br></div>')
    }
    // Handle special Shift+Enter key behavior
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertLineBreak')
      document.execCommand('insertHTML', false, '<br>')
    }
  }

  // Listen for formatting changes from toolbar
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const observer = new MutationObserver(() => {
      isInternalChange.current = true
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    })

    observer.observe(editor, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    })

    return () => observer.disconnect()
  }, [onChange])

  return (
    <div
      ref={editorRef}
      contentEditable
      className={`min-h-[400px] outline-none text-lg leading-relaxed focus:outline-none transition-colors`}
      style={{ 
        color: isDarkMode ? '#BBBBBB' : '#000000',
        direction: 'ltr',
        textAlign: 'left'
      }}
      data-editor-type="main"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
    />
  )
}