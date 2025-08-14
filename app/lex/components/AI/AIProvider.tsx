"use client"

import { createContext, useContext } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true
})

interface AIContextType {
  editText: (text: string, instruction: string) => Promise<string>
  continueWriting: (text: string) => Promise<string>
  runChecks: (text: string) => Promise<string[]>
  chatAboutDocument: (text: string, question: string) => Promise<string>
}

const AIContext = createContext<AIContextType | null>(null)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const editText = async (text: string, instruction: string) => {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Edit the following text according to this instruction: "${instruction}"\n\nText: ${text}\n\nProvide only the edited text without any explanation.`
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return text
    } catch (error) {
      console.error('Edit text error:', error)
      throw error
    }
  }
  
  const continueWriting = async (text: string) => {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Continue writing from where this text ends. Match the style and tone. Provide only the continuation without any explanation:\n\n${text}`
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return ''
    } catch (error) {
      console.error('Continue writing error:', error)
      throw error
    }
  }
  
  const runChecks = async (text: string) => {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Check this text for grammar, spelling, clarity, and style issues. Return a bullet-point list of specific suggestions. If there are no issues, say "No issues found":\n\n${text}`
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text.split('\n').filter(Boolean)
      }
      return ['No issues found']
    } catch (error) {
      console.error('Run checks error:', error)
      throw error
    }
  }
  
  const chatAboutDocument = async (text: string, question: string) => {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Based on this document:\n\n${text}\n\nAnswer this question concisely: ${question}`
          }
        ]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return 'Unable to process the question'
    } catch (error) {
      console.error('Chat error:', error)
      throw error
    }
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