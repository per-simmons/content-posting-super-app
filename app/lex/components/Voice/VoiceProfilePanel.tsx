'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  Plus, 
  MoreHorizontal, 
  ArrowRight, 
  LibraryBig, 
  PencilLine, 
  FileText, 
  Cpu, 
  Mic, 
  ArrowUp 
} from 'lucide-react'

interface VoiceProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectProfile: (profile: string, message: string) => void
  isDarkMode: boolean
  selectedText?: string
  docTitle?: string
}

interface VoiceProfile {
  id: string
  name: string
  description: string
  traits: string[]
  examples: string[]
  lastUpdated?: string
}

type Channel = "auto" | "youtube" | "linkedin" | "twitter" | "newsletter" | "blog";

const CHANNEL_META: Record<Channel, {label: string; className: string}> = {
  auto:       { label: "Auto",       className: "channel--auto" },
  youtube:    { label: "YouTube",    className: "channel--youtube" },
  linkedin:   { label: "LinkedIn",   className: "channel--linkedin" },
  twitter:    { label: "Twitter",    className: "channel--twitter" },
  newsletter: { label: "Newsletter", className: "channel--newsletter" },
  blog:       { label: "Blog",       className: "channel--blog" },
};

export function VoiceProfilePanel({ 
  isOpen, 
  onClose, 
  onSelectProfile, 
  isDarkMode, 
  selectedText,
  docTitle = 'Untitled'
}: VoiceProfilePanelProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<Channel>("auto")
  const [showChannelPopover, setShowChannelPopover] = useState(false)
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [loadingVoices, setLoadingVoices] = useState(true)

  // Load voice profiles from API
  useEffect(() => {
    const loadVoiceProfiles = async () => {
      try {
        setLoadingVoices(true)
        const response = await fetch('/api/voice/profiles')
        const data = await response.json()
        
        if (data.success) {
          setVoiceProfiles(data.voices)
        } else {
          console.error('Failed to load voice profiles')
        }
      } catch (error) {
        console.error('Error loading voice profiles:', error)
      } finally {
        setLoadingVoices(false)
      }
    }

    loadVoiceProfiles()
  }, [])

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const panel = document.getElementById('chat-panel')
      if (panel && !panel.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close channel popover when clicking outside
  useEffect(() => {
    if (!showChannelPopover) return

    const handleClickOutside = (e: MouseEvent) => {
      const container = document.querySelector('.channel-selector-container')
      if (container && !container.contains(e.target as Node)) {
        setShowChannelPopover(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showChannelPopover])

  const handleVoiceClick = (voiceId: string) => {
    router.push(`/voice-emulator?voice=${voiceId}`)
  }

  const handlePromptLibraryClick = () => {
    router.push('/voice-emulator')
  }

  const handleCreatePromptsClick = () => {
    router.push('/prompts')
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    // For now, just log the message with selected channel
    console.log('Sending message:', message, 'with channel:', selectedChannel)
    setMessage('')
  }

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
    setShowChannelPopover(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Transparent backdrop */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Chat Panel */}
      <aside 
        id="chat-panel"
        className="chat-panel"
        aria-label="Chat"
        style={{
          '--panel-bg': '#171717',
          '--elevated-bg': '#171717',
          '--border': '#2a2a2a',
          '--shadow': '0 12px 28px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35)',
          '--text-strong': '#ffffff',
          '--text': '#e5e5e5',
          '--text-muted': '#a3a3a3',
          '--blue': '#3b82f6',
          '--row-hover': 'rgba(255,255,255,.05)',
          '--row-active': 'rgba(59,130,246,.1)',
          '--chip-bg': 'rgba(64,64,64,.8)',
          '--chip-fg': '#e5e5e5',
          '--input-bg': '#2a2a2a',
          '--input-bg-focus': '#404040',
          '--radius-lg': '12px',
          '--radius-md': '8px',
          '--radius-pill': '999px',
          '--icon-size': '16px',
          '--icon-stroke': '2'
        } as React.CSSProperties}
      >
        {/* Header */}
        <header className="chat-header">
          <button 
            className="icon-button"
            aria-label="New chat"
          >
            <Plus size={18} strokeWidth={1.75} />
          </button>
          <h3 className="chat-title">Chat</h3>
          <button 
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="chat-scroll">
          {/* Assistant Greeting */}
          <div className="assistant-bubble">
            Hi—how can I help you?
          </div>

          {/* Large spacing gap */}
          <div className="large-gap"></div>
        </div>

        {/* Voice Shortcuts - positioned above composer */}
        <nav aria-label="Voices" className="voice-shortcuts">
          {loadingVoices ? (
            // Loading state
            <div className="loading-state">
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Loading voices...
              </span>
            </div>
          ) : voiceProfiles.length > 0 ? (
            // Dynamic voices from database
            voiceProfiles.map((voice) => (
              <button
                key={voice.id}
                className="prompt-row"
                onClick={() => handleVoiceClick(voice.id)}
                role="button"
                tabIndex={0}
                title={voice.description}
              >
                <MoreHorizontal size={16} strokeWidth={2} />
                <span className="prompt-label">{voice.name}</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            ))
          ) : (
            // Fallback message
            <div className="no-voices-state">
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No voices available
              </span>
            </div>
          )}
          
          {/* Prompt Library Section */}
          <div className="prompt-library-section">
            <button
              className="prompt-row"
              onClick={handlePromptLibraryClick}
              role="button"
              tabIndex={0}
              title="Access prompt library"
            >
              <LibraryBig size={16} strokeWidth={2} />
              <span className="prompt-label">Prompt library</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            
            <button
              className="prompt-row"
              onClick={handleCreatePromptsClick}
              role="button"
              tabIndex={0}
              title="Create and manage prompts"
            >
              <PencilLine size={16} strokeWidth={2} />
              <span className="prompt-label">Create & manage Prompts</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </nav>

        {/* Composer Footer */}
        <footer className="composer">
          {/* Document Title or Selected Text Chip */}
          <div className="doc-chip">
            <FileText size={14} strokeWidth={1.75} />
            <span>{selectedText ? `"${selectedText}"` : docTitle}</span>
          </div>

          {/* Input Pill */}
          <div className="input-pill">
            {/* Message Input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message…"
              className="message-input"
              aria-label="Message composer"
            />

            {/* Mic Button */}
            <button className="icon-button" aria-label="Voice">
              <Mic size={18} strokeWidth={1.75} />
            </button>

            {/* Send Button */}
            <button 
              className={`send-button ${message.trim() ? 'send--primary' : ''}`}
              onClick={handleSendMessage}
              disabled={!message.trim()}
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Channel Selector - Inside input pill */}
          <div className="channel-selector-row">
            <div className="channel-selector-container">
              <button 
                className={`channel channel--composer ${CHANNEL_META[selectedChannel].className}`}
                onClick={() => setShowChannelPopover(!showChannelPopover)}
                aria-haspopup="listbox"
                aria-expanded={showChannelPopover}
              >
                {CHANNEL_META[selectedChannel].label}
              </button>
              
              {showChannelPopover && (
                <div className="channel-pop">
                  {Object.entries(CHANNEL_META).map(([key, meta]) => (
                    <button
                      key={key}
                      className={`channel channel--menu ${meta.className}`}
                      onClick={() => handleChannelSelect(key as Channel)}
                    >
                      <span className="label">{meta.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>

        <style jsx>{`
          .chat-panel {
            width: 420px;
            height: 100%;
            background: var(--elevated-bg);
            border-left: 1px solid var(--border);
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
          }

          .chat-header {
            height: 48px;
            display: grid;
            grid-template-columns: 32px 1fr 32px;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            border-bottom: 1px solid var(--border);
            background: var(--elevated-bg);
          }

          .chat-title {
            font-size: 16px;
            line-height: 24px;
            font-weight: 600;
            color: var(--text-strong);
            text-align: center;
            margin: 0;
          }

          .icon-button {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: rgba(255, 255, 255, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .icon-button:hover {
            background: var(--row-hover);
            color: #fff;
          }

          .chat-scroll {
            flex: 1;
            overflow: auto;
            padding: 12px 16px;
          }

          .assistant-bubble {
            background: var(--input-bg);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            color: var(--text);
            font-size: 14px;
            line-height: 20px;
            margin-bottom: 16px;
            max-width: 280px;
            position: relative;
          }

          .assistant-bubble::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 16px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid var(--input-bg);
          }

          .large-gap {
            height: 120px;
          }

          .voice-shortcuts {
            padding: 12px 16px;
            margin-bottom: 0;
          }

          .prompt-library-section {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
          }

          .prompt-row {
            width: 100%;
            height: 32px;
            padding: 6px 0;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
            white-space: nowrap;
            text-align: left;
            margin-bottom: 2px;
          }

          .prompt-row:hover {
            background: var(--row-hover);
          }

          .prompt-row:active {
            background: var(--row-active);
            transform: translateY(0.5px);
          }

          .prompt-row:focus-visible {
            outline: 2px solid rgba(59, 130, 246, 0.55);
            outline-offset: 2px;
          }

          .prompt-row svg {
            width: var(--icon-size);
            height: var(--icon-size);
            stroke-width: var(--icon-stroke);
            color: var(--text-muted);
            flex-shrink: 0;
          }

          .prompt-label {
            flex: 1 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .prompt-row svg:last-child {
            margin-left: auto;
          }

          .composer {
            padding: 12px 16px;
            border-top: 1px solid var(--border);
          }

          .doc-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 24px;
            padding: 0 10px;
            border-radius: var(--radius-pill);
            background: var(--chip-bg);
            color: var(--chip-fg);
            font-size: 12px;
            line-height: 16px;
            font-weight: 500;
            margin-bottom: 8px;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .input-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 44px;
            padding: 0 16px;
            background: var(--input-bg);
            border-radius: 22px;
            transition: background 0.15s ease;
          }

          .input-pill:focus-within {
            background: var(--input-bg-focus);
          }

          .channel-selector-row {
            display: flex;
            justify-content: flex-start;
            margin-top: 8px;
          }

          .channel-selector-container {
            position: relative;
          }

          /* POPUP PANEL */
          .channel-pop {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 8px;
            background: #151922;
            border: 1px solid #262A33;
            border-radius: 12px;
            box-shadow: 0 12px 28px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35);
            padding: 8px;
            width: 220px;
            z-index: 1000;
          }

          .channel-pop::after {
            content: "";
            position: absolute;
            width: 8px;
            height: 8px;
            background: #151922;
            border: 1px solid #262A33;
            border-top: none;
            border-left: none;
            transform: rotate(45deg);
            bottom: -5px;
            left: 20px;
          }

          /* CHIPS (menu + composer) */
          .channel {
            border-radius: 9999px;
            color: #fff;
            font: 600 14px/20px Inter, system-ui;
            letter-spacing: 0.2px;
            padding: 0 16px;
            height: 36px;
            display: flex;
            align-items: center;
            text-shadow: 0 1px 0 rgba(0,0,0,.25);
            border: none;
            cursor: pointer;
            transition: filter 0.15s ease;
          }

          .channel--menu {
            margin: 6px 4px;
          }

          .channel--composer {
            height: 28px;
            padding: 0 14px;
            font-size: 13px;
            line-height: 18px;
          }

          .channel--auto {
            background: var(--chip-bg);
            color: var(--chip-fg);
            text-shadow: none;
          }

          .channel--youtube {
            background: rgba(255, 0, 0, .88);
          }

          .channel--linkedin {
            background: rgba(10, 102, 194, .88);
          }

          .channel--twitter {
            background: rgba(0, 0, 0, .90);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
          }

          .channel--newsletter {
            background: rgba(124, 77, 255, .88);
          }

          .channel--blog {
            background: rgba(255, 122, 0, .88);
          }

          .channel:hover {
            filter: brightness(1.06) saturate(1.02);
          }

          .channel:active {
            filter: brightness(1.12) saturate(1.04);
          }

          .channel:focus-visible {
            outline: 2px solid rgba(47,129,247,.55);
            outline-offset: 2px;
          }

          .label {
            flex: 1 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .message-input {
            flex: 1;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: var(--text-strong);
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
          }

          .message-input::placeholder {
            color: var(--text-muted);
          }

          .send-button {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: none;
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .send-button:disabled {
            cursor: not-allowed;
          }

          .send--primary {
            background: var(--blue);
            color: white;
          }

          .send--primary:hover:not(:disabled) {
            background: #4A90F9;
          }
        `}</style>
      </aside>
    </div>
  )
}