"use client"

import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'
import { FileText, Edit3, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SerpContentEditorProps {
  darkMode: boolean
  textSecondary: string
  serpResults: any[]
  onContentSave: (content: string) => void
}

export function SerpContentEditor({ 
  darkMode, 
  textSecondary, 
  serpResults,
  onContentSave 
}: SerpContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  const generateInitialContent = () => {
    let content = '<h1>SEO Content Analysis & Strategy</h1>'
    
    content += '<h2>Target Keywords</h2>'
    content += '<p>Primary keyword analysis based on SERP research</p>'
    
    content += '<h2>Content Structure</h2>'
    content += '<h3>Recommended Headings</h3>'
    content += '<ul>'
    serpResults.forEach(result => {
      if (result.headings?.h2) {
        result.headings.h2.slice(0, 2).forEach((heading: string) => {
          content += `<li>${heading}</li>`
        })
      }
    })
    content += '</ul>'
    
    content += '<h2>Content Gaps to Address</h2>'
    content += '<ul>'
    serpResults.forEach(result => {
      if (result.gaps) {
        result.gaps.forEach((gap: string) => {
          content += `<li>${gap}</li>`
        })
      }
    })
    content += '</ul>'
    
    content += '<h2>Key Topics to Cover</h2>'
    content += '<p>Based on competitor analysis, ensure coverage of:</p>'
    content += '<ul>'
    const allTopics = new Set<string>()
    serpResults.forEach(result => {
      if (result.topics) {
        result.topics.forEach((topic: string) => allTopics.add(topic))
      }
    })
    allTopics.forEach(topic => {
      content += `<li>${topic}</li>`
    })
    content += '</ul>'
    
    return content
  }

  const startEditing = () => {
    setEditedContent(generateInitialContent())
    setIsEditing(true)
  }

  const saveContent = () => {
    onContentSave(editedContent)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  if (!isEditing) {
    return (
      <div className={`rounded-lg border ${
        darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
      } p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h3 className="text-sm font-medium">Content Strategy Document</h3>
          </div>
          <Button
            onClick={startEditing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit3 className="h-3 w-3" />
            Edit Content Plan
          </Button>
        </div>
        
        <div className={`text-xs ${textSecondary}`}>
          <p>Click "Edit Content Plan" to create a customized content strategy based on the SERP analysis.</p>
          <p className="mt-2">This will generate an editable document with:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Recommended content structure</li>
            <li>Key topics and gaps to address</li>
            <li>Heading suggestions from top performers</li>
            <li>Strategic insights for optimization</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${
      darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
    } overflow-hidden`}>
      <div className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'
      }`}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-medium">Editing Content Strategy</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveContent}
            size="sm"
            className={`flex items-center gap-2 ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button
            onClick={cancelEditing}
            size="sm"
            variant="ghost"
            className="flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
      
      <RichTextEditor
        darkMode={darkMode}
        initialContent={editedContent}
        onChange={setEditedContent}
        placeholder="Start editing your content strategy..."
      />
    </div>
  )
}