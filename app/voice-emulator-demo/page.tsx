"use client"

import { VoiceEmulatorFlow } from '@/components/voice-emulator/VoiceEmulatorFlow'

export default function VoiceEmulatorDemoPage() {
  const darkMode = true // Match your app's theme
  const textSecondary = "text-neutral-400"

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <VoiceEmulatorFlow 
        darkMode={darkMode}
        textSecondary={textSecondary}
      />
    </div>
  )
}