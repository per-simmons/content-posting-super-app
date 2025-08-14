import VoiceEmulatorAsync from '@/components/voice-emulator/VoiceEmulatorAsync'

export default function VoiceEmulatorAsyncPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Voice Emulator (Background Processing)</h1>
        <p className="text-gray-600">
          This version runs the Voice Emulator pipeline in the background, avoiding timeout issues.
          The process typically takes 5-15 minutes to complete.
        </p>
      </div>
      <VoiceEmulatorAsync />
    </div>
  )
}