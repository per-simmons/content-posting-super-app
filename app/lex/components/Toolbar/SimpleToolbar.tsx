'use client'

import { useEffect, useRef } from 'react'

interface SimpleToolbarProps {
  isDarkMode: boolean
}

export function SimpleToolbar({ isDarkMode }: SimpleToolbarProps) {
  const savedSelectionRef = useRef<Range | null>(null)

  useEffect(() => {
    // Save selection whenever it changes in the editor
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        // Only save if selection is in editor
        const editor = document.querySelector('[contenteditable="true"]')
        if (editor && editor.contains(range.commonAncestorContainer)) {
          savedSelectionRef.current = range.cloneRange()
        }
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('keyup', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('keyup', handleSelectionChange)
    }
  }, [])

  const restoreAndExec = (command: string, value?: string) => {
    // Find the editor
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) return

    // Focus the editor
    editor.focus()

    // Restore saved selection
    if (savedSelectionRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelectionRef.current)
      }
    }

    // Execute the command
    document.execCommand(command, false, value || undefined)
    
    // Keep focus on editor
    editor.focus()
  }

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('bold'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm"
        style={{ color: '#BBBBBB' }}
        title="Bold"
      >
        B
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('italic'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm italic"
        style={{ color: '#BBBBBB' }}
        title="Italic"
      >
        I
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('underline'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm underline"
        style={{ color: '#BBBBBB' }}
        title="Underline"
      >
        U
      </button>
      
      <div className="w-px h-4 bg-gray-600 mx-1" />
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => {
          const url = prompt('Enter URL:')
          if (url) restoreAndExec('createLink', url)
        })}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm"
        style={{ color: '#BBBBBB' }}
        title="Insert Link"
      >
        Link
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('formatBlock', 'H1'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm font-bold"
        style={{ color: '#BBBBBB' }}
        title="Heading 1"
      >
        H1
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('formatBlock', 'H2'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm font-bold"
        style={{ color: '#BBBBBB' }}
        title="Heading 2"
      >
        H2
      </button>
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => handleButtonClick(e, () => restoreAndExec('formatBlock', 'P'))}
        className="px-2 py-1 rounded hover:bg-[#3a3a3a] text-sm"
        style={{ color: '#BBBBBB' }}
        title="Normal Text"
      >
        Normal
      </button>
    </div>
  )
}