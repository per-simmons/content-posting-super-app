'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SimpleEditor } from './components/Editor/SimpleEditor'
import { CommandPalette } from './components/CommandPalette/CommandPalette'
import { AIProvider } from './components/AI/AIProvider'
import { WorkingToolbar } from './components/Toolbar/WorkingToolbar'
import { Sun, Moon, Undo, Redo, FileText, List, ListChecks } from 'lucide-react'
import './styles/editor.css'

export default function LexEditor() {
  const [content, setContent] = useState('')
  const [selection, setSelection] = useState<any>(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [title, setTitle] = useState('')
  const [showToolbar, setShowToolbar] = useState(false)
  const [editorState, setEditorState] = useState<'initial' | 'writing'>('initial')
  const titleRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const toolbar = document.querySelector('[role="toolbar"]')
      const editors = document.querySelectorAll('[contenteditable="true"]')
      const documentContainer = document.querySelector('.max-w-4xl.mx-auto')
      
      // Check if clicked inside an editor
      let clickedInEditor = false
      editors.forEach(editor => {
        if (editor.contains(target)) {
          clickedInEditor = true
        }
      })
      
      // Check if clicked inside the document container (but not in editor)
      const clickedInDocument = documentContainer && documentContainer.contains(target)
      
      // Only hide toolbar if:
      // 1. Clicked inside the document area (including editors)
      // 2. AND not clicking on the toolbar itself
      if (clickedInDocument && !toolbar?.contains(target)) {
        // Check if there's still selected text
        const selection = window.getSelection()
        if (!selection || selection.toString().trim().length === 0) {
          setShowToolbar(false)
        }
      }
      // If clicked outside document entirely, keep toolbar visible
    }
    
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0)
        
        // Check if selection is in title or main editor
        const titleEditor = document.querySelector('[data-editor-type="title"]')
        const mainEditor = document.querySelector('[data-editor-type="main"]')
        
        if ((titleEditor && titleEditor.contains(range.commonAncestorContainer)) ||
            (mainEditor && mainEditor.contains(range.commonAncestorContainer))) {
          setShowToolbar(true)
          setSelection({
            text: selection.toString(),
            range: range
          })
          return
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
    }
  }, [])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    
    // Update word and character count
    const text = newContent.replace(/<[^>]*>/g, '').trim()
    const words = text ? text.split(/\s+/).length : 0
    const chars = text.length
    
    setWordCount(words)
    setCharCount(chars)
  }, [])


  return (
    <AIProvider>
      <div className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'
      }`}>
        {/* Main Editor Container */}
        <div className="pt-12 px-6 pb-12">
          <div className={`max-w-4xl mx-auto rounded-lg overflow-hidden ${
            isDarkMode 
              ? 'bg-[#242424] border-2 border-[#3a3a3a]' 
              : 'bg-white border-2 border-gray-300'
          }`}>
            {/* Top Bar with Toolbar */}
            <div className={`px-4 py-2 border-b flex items-center justify-between ${
              isDarkMode ? 'border-[#3a3a3a] bg-[#242424]' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-sm" style={{ color: '#BBBBBB' }}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} {charCount === 1 ? 'char' : 'chars'}
                </div>
                
                {/* Toolbar appears here when text is selected */}
                {showToolbar && (
                  <div className="ml-4">
                    <WorkingToolbar isDarkMode={isDarkMode} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg transition-colors hover:bg-[#3a3a3a]`}
                  style={{ color: '#BBBBBB' }}
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors hover:bg-[#3a3a3a]`}
                  style={{ color: '#BBBBBB' }}
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className={`p-12 ${editorState === 'writing' ? '' : ''}`}>
              {/* Title Section - Always visible */}
              <div className={`${editorState === 'writing' ? 'mb-0' : 'mb-8'}`}>
                <div
                  ref={titleRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full bg-transparent outline-none"
                  style={{ 
                    color: isDarkMode ? '#BBBBBB' : '#000000',
                    minHeight: '50px'
                  }}
                  data-editor-type="title"
                  data-default-format="h1"
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement
                    setTitle(target.innerHTML || '')
                  }}
                  onFocus={(e) => {
                    const target = e.target as HTMLDivElement
                    // If empty, add H1 wrapper
                    if (!target.innerHTML || target.innerHTML === '<br>') {
                      target.innerHTML = '<h1></h1>'
                      // Place cursor inside the H1
                      const h1 = target.querySelector('h1')
                      if (h1) {
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.setStart(h1, 0)
                        range.collapse(true)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setEditorState('writing')
                      // Focus body editor
                      setTimeout(() => {
                        const mainEditor = document.querySelector('[data-editor-type="main"]') as HTMLElement
                        if (mainEditor) mainEditor.focus()
                      }, 50)
                    }
                  }}
                />
              </div>

              {/* Initial State UI - Only visible in initial state */}
              {editorState === 'initial' && (
                <div className="mb-8">
                  <p style={{ color: '#666666', fontSize: '16px' }}>Press enter to start writing.</p>
                  <p style={{ color: '#666666', fontSize: '16px' }} className="mt-3 mb-6">
                    Or, have the AI generate a starting point:
                  </p>
                  
                  {/* AI Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      className={`px-5 py-3 rounded-lg border flex items-center gap-3 transition-colors ${
                        isDarkMode 
                          ? 'border-[#3a3a3a] hover:bg-[#2a2a2a]' 
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{ color: '#888888' }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>First draft</span>
                    </button>
                    
                    <button
                      className={`px-5 py-3 rounded-lg border flex items-center gap-3 transition-colors ${
                        isDarkMode 
                          ? 'border-[#3a3a3a] hover:bg-[#2a2a2a]' 
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{ color: '#888888' }}
                    >
                      <List className="h-4 w-4" />
                      <span>Outline</span>
                    </button>
                    
                    <button
                      className={`px-5 py-3 rounded-lg border flex items-center gap-3 transition-colors ${
                        isDarkMode 
                          ? 'border-[#3a3a3a] hover:bg-[#2a2a2a]' 
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{ color: '#888888' }}
                    >
                      <ListChecks className="h-4 w-4" />
                      <span>Topics to cover</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Body Editor - Only visible in writing state */}
              {editorState === 'writing' && (
                <SimpleEditor
                  content={content}
                  onChange={handleContentChange}
                  onSelectionChange={(sel) => {
                    setSelection(sel)
                    if (sel && sel.text && sel.text.length > 0) {
                      setShowToolbar(true)
                    }
                  }}
                  isDarkMode={isDarkMode}
                  showTitle={false}
                />
              )}
            </div>
          </div>
        </div>

        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            selection={selection}
            content={content}
            onContentChange={handleContentChange}
            isDarkMode={isDarkMode}
          />
        )}
        
        {/* Theme Toggle Button - Bottom Right */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`fixed bottom-6 right-6 p-3 rounded-full transition-colors shadow-lg ${
            isDarkMode 
              ? 'bg-[#242424] hover:bg-[#3a3a3a] border border-[#3a3a3a]' 
              : 'bg-white hover:bg-gray-100 border border-gray-300'
          }`}
          style={{ color: '#BBBBBB' }}
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </AIProvider>
  )
}