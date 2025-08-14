'use client'

import { useEffect, useRef } from 'react'
import { 
  Heading1, Heading2, Heading3,
  Bold, Italic, Underline, Strikethrough,
  Link, Quote, Code, CodeSquare,
  List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Subscript, Superscript,
  Indent, Outdent, Pilcrow,
  Undo, Redo, Image,
  MoreHorizontal
} from 'lucide-react'

interface FloatingToolbarProps {
  position: { top: number; left: number }
  isDarkMode: boolean
  selectedText: string
  onAction: (action: string, value?: string) => void
}

export function FloatingToolbar({ position, isDarkMode, selectedText, onAction }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect()
      const adjustedLeft = Math.min(
        Math.max(10, position.left - rect.width / 2),
        window.innerWidth - rect.width - 10
      )
      
      toolbarRef.current.style.left = `${adjustedLeft}px`
      toolbarRef.current.style.top = `${Math.max(10, position.top)}px`
    }
  }, [position])

  const tools = [
    { icon: Heading1, action: 'h1', label: 'Heading 1' },
    { icon: Heading2, action: 'h2', label: 'Heading 2' },
    { icon: Heading3, action: 'h3', label: 'Heading 3' },
    { divider: true },
    { icon: Bold, action: 'bold', label: 'Bold' },
    { icon: Italic, action: 'italic', label: 'Italic' },
    { icon: Underline, action: 'underline', label: 'Underline' },
    { icon: Strikethrough, action: 'strikethrough', label: 'Strikethrough' },
    { divider: true },
    { icon: Highlighter, action: 'highlight', label: 'Highlight' },
    { icon: Subscript, action: 'subscript', label: 'Subscript' },
    { icon: Superscript, action: 'superscript', label: 'Superscript' },
    { divider: true },
    { icon: Link, action: 'link', label: 'Link' },
    { icon: Quote, action: 'quote', label: 'Quote' },
    { icon: Code, action: 'code', label: 'Inline Code' },
    { icon: CodeSquare, action: 'codeblock', label: 'Code Block' },
    { divider: true },
    { icon: List, action: 'list', label: 'Bullet List' },
    { icon: ListOrdered, action: 'orderedList', label: 'Numbered List' },
    { icon: ListChecks, action: 'checklist', label: 'Checklist' },
    { divider: true },
    { icon: AlignLeft, action: 'alignLeft', label: 'Align Left' },
    { icon: AlignCenter, action: 'alignCenter', label: 'Align Center' },
    { icon: AlignRight, action: 'alignRight', label: 'Align Right' },
    { icon: AlignJustify, action: 'alignJustify', label: 'Justify' },
    { divider: true },
    { icon: Indent, action: 'indent', label: 'Indent' },
    { icon: Outdent, action: 'outdent', label: 'Outdent' },
    { divider: true },
    { icon: Image, action: 'image', label: 'Insert Image' },
    { icon: Pilcrow, action: 'paragraph', label: 'Paragraph' },
    { icon: MoreHorizontal, action: 'more', label: 'More Options' }
  ]

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-50 flex items-center gap-0.5 p-1 rounded-lg shadow-lg border transition-opacity animate-in fade-in duration-200 ${
        isDarkMode 
          ? 'bg-[#2a2a2a] border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {tools.map((tool, index) => {
        if (tool.divider) {
          return (
            <div 
              key={`divider-${index}`} 
              className={`w-px h-6 mx-0.5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} 
            />
          )
        }
        
        const Icon = tool.icon
        if (!Icon) return null
        return (
          <button
            key={tool.action}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAction(tool.action!)
            }}
            className={`p-1.5 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-[#3a3a3a] text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title={tool.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}