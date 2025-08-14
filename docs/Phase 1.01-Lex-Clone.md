# Phase 1.01 - Lex.page Clone Implementation Plan

## Project Overview
Build a pixel-perfect clone of Lex.page - a minimalist, AI-enhanced writing environment with Claude integration.

## Core Features Analysis

### 1. Editor Features (from screenshots)
- **Clean minimal interface** with dark background (#1a1a1a or similar)
- **Word/character counter** in top-left (format: "X words • Y chars")
- **Formatting toolbar** with essential controls
- **Command palette** triggered by Cmd+K
- **AI assistant integration** for editing, continuing, and chatting
- **Right sidebar** with Edit/Chat/Comment actions

### 2. Command Palette Features (Cmd+K menu)
- ✏️ AI: Edit selected text
- ✅ AI: Run checks
- 💬 AI: Chat about your document
- ➕ AI: Continue writing
- 📷 Insert image
- 📝 Format options
- 📋 Copy selected text as...
- 👁️ View options
- 📜 History
- 🔄 Switch document

## Technical Architecture

### Tech Stack
```
- Next.js 14 (existing)
- React 18 (existing)
- TypeScript (existing)
- Tailwind CSS (existing)
- ContentEditable or Lexical/Slate.js for rich text
- Claude API (Anthropic SDK)
- Framer Motion for animations
- Radix UI for accessible components
```

### Component Structure
```
/app/lex/
├── page.tsx                 # Main editor page
├── layout.tsx               # Editor layout wrapper
└── components/
    ├── Editor/
    │   ├── Editor.tsx       # Main editor component
    │   ├── Toolbar.tsx      # Formatting toolbar
    │   ├── WordCounter.tsx  # Word/char counter
    │   └── Selection.tsx    # Text selection handler
    ├── CommandPalette/
    │   ├── CommandPalette.tsx    # Cmd+K menu
    │   ├── CommandItem.tsx       # Individual command
    │   └── CommandSearch.tsx     # Command search input
    ├── AI/
    │   ├── AIProvider.tsx        # Claude API context
    │   ├── AIChat.tsx            # Chat interface
    │   ├── AIEdit.tsx            # Edit suggestions
    │   └── AIContinue.tsx        # Continue writing
    └── Sidebar/
        ├── Sidebar.tsx           # Right sidebar
        └── SidebarActions.tsx    # Edit/Chat/Comment buttons
```

## Implementation Steps

### Phase 1: Basic Editor Setup (Day 1-2)

#### 1.1 Create Editor Foundation
```tsx
// /app/lex/page.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@/app/lex/components/Editor/Editor'
import { CommandPalette } from '@/app/lex/components/CommandPalette/CommandPalette'
import { Sidebar } from '@/app/lex/components/Sidebar/Sidebar'
import { AIProvider } from '@/app/lex/components/AI/AIProvider'

export default function LexEditor() {
  const [content, setContent] = useState('')
  const [selection, setSelection] = useState(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <AIProvider>
      <div className="min-h-screen bg-[#1a1a1a] text-gray-300">
        <Editor 
          content={content}
          onChange={setContent}
          onSelectionChange={setSelection}
        />
        <Sidebar selection={selection} />
        {showCommandPalette && (
          <CommandPalette 
            onClose={() => setShowCommandPalette(false)}
            selection={selection}
          />
        )}
      </div>
    </AIProvider>
  )
}
```

#### 1.2 ContentEditable Editor Component
```tsx
// /app/lex/components/Editor/Editor.tsx
import { useRef, useEffect } from 'react'
import { Toolbar } from './Toolbar'
import { WordCounter } from './WordCounter'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selection: any) => void
}

export function Editor({ content, onChange, onSelectionChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerText)
    }
  }
  
  const handleSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      onSelectionChange({
        text: selection.toString(),
        range: selection.getRangeAt(0)
      })
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <WordCounter text={content} />
      <Toolbar />
      
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[600px] outline-none text-lg leading-relaxed text-gray-100 
                   placeholder:text-gray-600 focus:outline-none"
        onInput={handleInput}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        suppressContentEditableWarning
      >
        {content || 'Start writing...'}
      </div>
    </div>
  )
}
```

### Phase 2: Command Palette (Day 2-3)

#### 2.1 Command Palette Component
```tsx
// /app/lex/components/CommandPalette/CommandPalette.tsx
import { useState, useEffect, useRef } from 'react'
import { 
  Edit3, CheckCircle, MessageCircle, PlusCircle, 
  Image, Type, Copy, Eye, Clock, FileText 
} from 'lucide-react'

const commands = [
  { 
    id: 'edit', 
    label: 'AI: Edit selected text', 
    icon: Edit3,
    shortcut: null,
    action: 'edit'
  },
  { 
    id: 'check', 
    label: 'AI: Run checks', 
    icon: CheckCircle,
    shortcut: null,
    action: 'check'
  },
  { 
    id: 'chat', 
    label: 'AI: Chat about your document', 
    icon: MessageCircle,
    shortcut: '⌘ \\',
    action: 'chat'
  },
  { 
    id: 'continue', 
    label: 'AI: Continue writing', 
    icon: PlusCircle,
    shortcut: '+++',
    action: 'continue'
  },
  { 
    id: 'image', 
    label: 'Insert image', 
    icon: Image,
    shortcut: null,
    action: 'image'
  },
  { 
    id: 'format', 
    label: 'Format', 
    icon: Type,
    shortcut: null,
    action: 'format'
  },
  { 
    id: 'copy', 
    label: 'Copy selected text as...', 
    icon: Copy,
    shortcut: null,
    action: 'copy'
  },
  { 
    id: 'view', 
    label: 'View options', 
    icon: Eye,
    shortcut: null,
    action: 'view'
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: Clock,
    shortcut: null,
    action: 'history'
  },
  { 
    id: 'switch', 
    label: 'Switch document', 
    icon: FileText,
    shortcut: '⌘ P',
    action: 'switch'
  }
]

export function CommandPalette({ onClose, selection }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(filteredCommands[selectedIndex])
    }
  }
  
  const executeCommand = (command) => {
    // Handle command execution
    console.log('Executing:', command.action)
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#242424] rounded-xl shadow-2xl w-[600px] max-h-[400px] overflow-hidden border border-gray-800">
        <div className="p-3 border-b border-gray-800">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full bg-transparent outline-none text-gray-300 placeholder:text-gray-600"
          />
        </div>
        
        <div className="overflow-y-auto max-h-[320px]">
          {filteredCommands.map((cmd, index) => {
            const Icon = cmd.icon
            return (
              <div
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                className={`
                  flex items-center justify-between px-3 py-2.5 cursor-pointer
                  ${index === selectedIndex ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-gray-600">{cmd.shortcut}</span>
                )}
              </div>
            )
          })}
        </div>
        
        {search && (
          <div className="p-2 border-t border-gray-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Phase 3: Claude API Integration (Day 3-4)

#### 3.1 AI Provider Setup
```tsx
// /app/lex/components/AI/AIProvider.tsx
import { createContext, useContext, useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Only for development
})

interface AIContextType {
  editText: (text: string, instruction: string) => Promise<string>
  continueWriting: (text: string) => Promise<string>
  runChecks: (text: string) => Promise<string[]>
  chatAboutDocument: (text: string, question: string) => Promise<string>
}

const AIContext = createContext<AIContextType | null>(null)

export function AIProvider({ children }) {
  const editText = async (text: string, instruction: string) => {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Edit the following text according to this instruction: "${instruction}"\n\nText: ${text}`
        }
      ]
    })
    return response.content[0].text
  }
  
  const continueWriting = async (text: string) => {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Continue writing from where this text ends. Match the style and tone:\n\n${text}`
        }
      ]
    })
    return response.content[0].text
  }
  
  const runChecks = async (text: string) => {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Check this text for grammar, spelling, clarity, and style issues. Return a list of suggestions:\n\n${text}`
        }
      ]
    })
    return response.content[0].text.split('\n').filter(Boolean)
  }
  
  const chatAboutDocument = async (text: string, question: string) => {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Based on this document:\n\n${text}\n\nAnswer this question: ${question}`
        }
      ]
    })
    return response.content[0].text
  }
  
  return (
    <AIContext.Provider value={{
      editText,
      continueWriting,
      runChecks,
      chatAboutDocument
    }}>
      {children}
    </AIContext.Provider>
  )
}

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) throw new Error('useAI must be used within AIProvider')
  return context
}
```

### Phase 4: Styling & Polish (Day 4-5)

#### 4.1 Exact Lex.page Styles
```css
/* globals.css additions */
.lex-editor {
  /* Main editor styles */
  background: #1a1a1a;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 18px;
  line-height: 1.7;
}

.lex-toolbar {
  /* Toolbar styles */
  background: #242424;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 4px;
}

.lex-toolbar-button {
  padding: 6px 10px;
  border-radius: 4px;
  color: #999;
  transition: all 0.15s;
}

.lex-toolbar-button:hover {
  background: #2a2a2a;
  color: #e0e0e0;
}

.lex-toolbar-button.active {
  background: #333;
  color: white;
}

/* Command palette styles */
.command-palette {
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Selection highlight */
::selection {
  background: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* Sidebar styles */
.lex-sidebar {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lex-sidebar-button {
  padding: 8px 16px;
  background: #242424;
  border: 1px solid #333;
  border-radius: 6px;
  color: #999;
  font-size: 13px;
  transition: all 0.15s;
  cursor: pointer;
}

.lex-sidebar-button:hover {
  background: #2a2a2a;
  color: #e0e0e0;
  border-color: #444;
}
```

### Phase 5: Advanced Features (Day 5-6)

#### 5.1 Formatting Toolbar
```tsx
// /app/lex/components/Editor/Toolbar.tsx
import { 
  Bold, Italic, Underline, Strikethrough, 
  Link, Quote, List, ListOrdered,
  Code, Heading1, Heading2, AlignLeft, 
  AlignCenter, AlignRight, MoreHorizontal
} from 'lucide-react'

export function Toolbar() {
  const tools = [
    { icon: Heading1, command: 'formatBlock', value: 'H1' },
    { divider: true },
    { icon: Bold, command: 'bold' },
    { icon: Italic, command: 'italic' },
    { icon: Underline, command: 'underline' },
    { icon: Strikethrough, command: 'strikethrough' },
    { divider: true },
    { icon: Link, command: 'createLink' },
    { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE' },
    { icon: Code, command: 'formatBlock', value: 'CODE' },
    { divider: true },
    { icon: List, command: 'insertUnorderedList' },
    { icon: ListOrdered, command: 'insertOrderedList' },
    { divider: true },
    { icon: AlignLeft, command: 'justifyLeft' },
    { icon: AlignCenter, command: 'justifyCenter' },
    { icon: AlignRight, command: 'justifyRight' },
    { divider: true },
    { icon: MoreHorizontal, command: 'more' }
  ]
  
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }
  
  return (
    <div className="flex items-center gap-1 mb-8 p-1 bg-[#242424] rounded-lg border border-gray-800">
      {tools.map((tool, index) => {
        if (tool.divider) {
          return <div key={index} className="w-px h-6 bg-gray-700" />
        }
        
        const Icon = tool.icon
        return (
          <button
            key={index}
            onClick={() => executeCommand(tool.command, tool.value)}
            className="p-2 rounded hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
```

#### 5.2 Word Counter Component
```tsx
// /app/lex/components/Editor/WordCounter.tsx
export function WordCounter({ text }: { text: string }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  
  return (
    <div className="text-sm text-gray-600 mb-4">
      {words} {words === 1 ? 'word' : 'words'} • {chars} {chars === 1 ? 'char' : 'chars'}
    </div>
  )
}
```

### Phase 6: Testing & Refinement (Day 6-7)

#### Key Testing Areas:
1. **Selection handling** - Ensure text selection works smoothly
2. **Command palette** - Test all keyboard shortcuts
3. **AI integration** - Verify Claude API responses
4. **Performance** - Optimize for large documents
5. **Cross-browser** - Test on Chrome, Safari, Firefox
6. **Keyboard navigation** - Full keyboard accessibility

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

## Installation Steps

```bash
# 1. Install additional dependencies
npm install @anthropic-ai/sdk framer-motion @radix-ui/react-dialog

# 2. Create the lex directory structure
mkdir -p app/lex/components/{Editor,CommandPalette,AI,Sidebar}

# 3. Add the route to your app
# The editor will be available at: http://localhost:3000/lex
```

## Deployment Considerations

1. **API Key Security**: Move API calls to server-side API routes
2. **Rate Limiting**: Implement request throttling
3. **Error Handling**: Add comprehensive error boundaries
4. **Auto-save**: Implement local storage or database persistence
5. **Collaboration**: Consider adding real-time collaboration with WebSockets

## Performance Optimizations

1. **Debounce API calls** - Prevent excessive requests
2. **Virtual scrolling** - For long documents
3. **Lazy load features** - Load AI features on demand
4. **Cache responses** - Store AI suggestions locally
5. **Optimize re-renders** - Use React.memo and useMemo

## Future Enhancements

- **Version history** with diff viewer
- **Document templates** for quick starts
- **Export options** (PDF, Word, Markdown)
- **Voice dictation** support
- **Multi-language** support
- **Theme customization** (light mode, custom colors)
- **Plugin system** for extensibility

## Conclusion

This implementation provides a pixel-perfect clone of Lex.page with full Claude AI integration. The modular architecture allows for easy extension and customization while maintaining the clean, minimalist aesthetic that makes Lex.page so appealing to writers.

Total estimated development time: 6-7 days for MVP