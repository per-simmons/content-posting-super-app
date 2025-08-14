'use client'

import { useRef, useEffect } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selection: any) => void
  isDarkMode: boolean
  showTitle: boolean
}

export function Editor({ content, onChange, onSelectionChange, isDarkMode, showTitle }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        const editorElement = editorRef.current
        
        // Check if selection is within the editor
        let isWithinEditor = false
        let node = container as Node | null
        while (node) {
          if (node === editorElement) {
            isWithinEditor = true
            break
          }
          node = node.parentNode
        }
        
        if (isWithinEditor) {
          onSelectionChange({
            text: selection.toString(),
            range: range
          })
          return
        }
      }
      
      onSelectionChange(null)
    }

    // Handle both mouse and keyboard selection
    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10)
    }
    
    const handleKeyUp = () => {
      setTimeout(handleSelectionChange, 10)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [onSelectionChange])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showTitle) {
      e.preventDefault()
      document.execCommand('insertHTML', false, '<br><br>')
    }
  }

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
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: content }}
      suppressContentEditableWarning
    />
  )
}