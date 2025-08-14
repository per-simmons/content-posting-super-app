"use client"

import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link2, 
  Heading1, 
  Heading2, 
  Heading3,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './RichTextEditor.module.css'

interface RichTextEditorProps {
  darkMode: boolean
  initialContent?: string
  placeholder?: string
  onChange?: (content: string) => void
  className?: string
}

export function RichTextEditor({ 
  darkMode, 
  initialContent = '', 
  placeholder = 'Start typing or press / for commands...', 
  onChange,
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
    }
  }, [initialContent])

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
    setShowFormatMenu(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && editorRef.current?.innerText === '') {
      e.preventDefault()
      setShowFormatMenu(true)
      const rect = editorRef.current.getBoundingClientRect()
      setMenuPosition({ x: rect.left, y: rect.top + 30 })
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const selection = window.getSelection()
      if (selection && selection.toString()) {
        setSelectedText(selection.toString())
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setMenuPosition({ x: rect.left, y: rect.top - 40 })
        setShowFormatMenu(true)
      }
    }

    if ((e.metaKey || e.ctrlKey)) {
      switch(e.key) {
        case 'b':
          e.preventDefault()
          executeCommand('bold')
          break
        case 'i':
          e.preventDefault()
          executeCommand('italic')
          break
        case 'u':
          e.preventDefault()
          executeCommand('underline')
          break
      }
    }
  }

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertHeading = (level: number) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const heading = document.createElement(`h${level}`)
      heading.textContent = selection.toString() || `Heading ${level}`
      range.deleteContents()
      range.insertNode(heading)
      range.collapse(false)
    }
    setShowFormatMenu(false)
  }

  const formatOptions = [
    { icon: Heading1, label: 'Heading 1', action: () => insertHeading(1), shortcut: '⌘+1' },
    { icon: Heading2, label: 'Heading 2', action: () => insertHeading(2), shortcut: '⌘+2' },
    { icon: Heading3, label: 'Heading 3', action: () => insertHeading(3), shortcut: '⌘+3' },
    { divider: true },
    { icon: Bold, label: 'Bold', action: () => executeCommand('bold'), shortcut: '⌘+B' },
    { icon: Italic, label: 'Italic', action: () => executeCommand('italic'), shortcut: '⌘+I' },
    { icon: Underline, label: 'Underline', action: () => executeCommand('underline'), shortcut: '⌘+U' },
    { divider: true },
    { icon: List, label: 'Bullet List', action: () => executeCommand('insertUnorderedList'), shortcut: '⌘+⇧+8' },
    { icon: ListOrdered, label: 'Numbered List', action: () => executeCommand('insertOrderedList'), shortcut: '⌘+⇧+7' },
    { icon: Quote, label: 'Quote', action: () => executeCommand('formatBlock', '<blockquote>'), shortcut: '⌘+⇧+>' },
    { icon: Code, label: 'Code', action: () => executeCommand('formatBlock', '<pre>'), shortcut: '⌘+E' },
  ]

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center gap-1 p-2 border-b ${
        darkMode ? 'border-neutral-800' : 'border-neutral-200'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('undo')}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('redo')}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertHeading(1)}
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertHeading(2)}
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertHeading(3)}
          className="h-8 w-8 p-0"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyLeft')}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyCenter')}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyRight')}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className={`${styles.editor} ${!darkMode ? styles.editorLight : ''} min-h-[400px] p-4 focus:outline-none ${
          darkMode ? 'bg-neutral-950 text-white' : 'bg-white'
        } prose prose-sm max-w-none ${
          darkMode ? 'prose-invert' : ''
        }`}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {showFormatMenu && (
        <div 
          className={`absolute z-50 rounded-lg border shadow-lg p-1 min-w-[200px] ${
            darkMode 
              ? 'bg-neutral-900 border-neutral-800' 
              : 'bg-white border-neutral-200'
          }`}
          style={{ 
            left: `${menuPosition.x}px`, 
            top: `${menuPosition.y}px` 
          }}
        >
          <div className="text-xs font-medium px-2 py-1 opacity-60">
            Format
          </div>
          {formatOptions.map((option, idx) => {
            if (option.divider) {
              return (
                <div 
                  key={idx} 
                  className={`my-1 border-t ${
                    darkMode ? 'border-neutral-800' : 'border-neutral-200'
                  }`} 
                />
              )
            }
            const Icon = option.icon!
            return (
              <button
                key={idx}
                onClick={option.action}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                  darkMode 
                    ? 'hover:bg-neutral-800' 
                    : 'hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{option.label}</span>
                </div>
                <span className="opacity-50 text-xs">
                  {option.shortcut}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setShowFormatMenu(false)}
            className={`w-full px-2 py-1 text-xs opacity-60 ${
              darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
            } rounded mt-1`}
          >
            Cancel (Esc)
          </button>
        </div>
      )}

    </div>
  )
}