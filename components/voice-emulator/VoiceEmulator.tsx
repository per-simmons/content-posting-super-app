"use client"

import { useState } from "react"
import { Mic, Loader2, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface StepOutput {
  stepNumber: number
  stepName: string
  status: "pending" | "processing" | "completed" | "failed"
  startTime?: Date
  endTime?: Date
  input?: any
  output?: any
  error?: string
}

const PIPELINE_STEPS = [
  "Intake & Target Selection",
  "Discovery Pass",
  "Newsletter Ingest",
  "Twitter/X Ingest",
  "LinkedIn Ingest",
  "Blog Ingest",
  "Consolidation & Google Docs",
  "Vectorization",
  "Retrieval & Evidence Pack",
  "Voice Analysis",
  "System Prompt Synthesis"
]

interface VoiceEmulatorProps {
  darkMode: boolean
  borderClass: string
  textSecondary: string
}

export default function VoiceEmulator({ darkMode, borderClass, textSecondary }: VoiceEmulatorProps) {
  const [creatorName, setCreatorName] = useState("")
  const [hints, setHints] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepOutput[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null)

  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"
  const hoverBg = darkMode ? "hover:bg-neutral-900/60" : "hover:bg-neutral-50"

  async function startPipeline() {
    if (!creatorName.trim()) return

    setIsProcessing(true)
    setSystemPrompt(null)
    
    // Initialize all steps as pending
    const initialSteps: StepOutput[] = PIPELINE_STEPS.map((name, i) => ({
      stepNumber: i + 1,
      stepName: name,
      status: "pending"
    }))
    setSteps(initialSteps)

    try {
      const response = await fetch("/api/voice-emulator/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          creatorName: creatorName.trim(),
          hints: hints.trim() || undefined
        })
      })

      const { jobId } = await response.json()
      setJobId(jobId)

      // Start polling for updates
      pollForUpdates(jobId)
    } catch (error) {
      console.error("Failed to start pipeline:", error)
      setIsProcessing(false)
    }
  }

  async function pollForUpdates(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice-emulator/status?jobId=${jobId}`)
        const data = await response.json()

        setSteps(data.steps)

        if (data.status === "completed") {
          clearInterval(interval)
          setIsProcessing(false)
          setSystemPrompt(data.systemPrompt)
        } else if (data.status === "failed") {
          clearInterval(interval)
          setIsProcessing(false)
        }
      } catch (error) {
        console.error("Failed to fetch status:", error)
      }
    }, 2000) // Poll every 2 seconds
  }

  function toggleStepExpansion(stepNumber: number) {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }

  function getStatusIcon(status: StepOutput["status"]) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 opacity-40" />
    }
  }

  function formatDuration(start?: Date, end?: Date) {
    if (!start) return ""
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = Math.floor((endTime - startTime) / 1000)
    if (duration < 60) return `${duration}s`
    return `${Math.floor(duration / 60)}m ${duration % 60}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Emulator
        </h2>
        <p className={`mt-1 text-sm ${textMuted}`}>
          Analyze an internet creator's writing style and generate a system prompt to emulate their voice
        </p>
      </div>

      {/* Input Form */}
      {!isProcessing && !systemPrompt && (
        <div className={`rounded-xl border ${borderClass} ${surfaceBg} p-5`}>
          <div className="space-y-4">
            <div>
              <label className={`text-xs font-medium ${textMuted} uppercase tracking-wide`}>
                Creator Name *
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g., Paul Graham, Naval Ravikant"
                className={`mt-2 w-full bg-transparent outline-none border-0 border-b ${borderClass} focus:border-neutral-400 dark:focus:border-neutral-600 pb-1 text-sm`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${textMuted} uppercase tracking-wide`}>
                Hints (Optional)
              </label>
              <input
                type="text"
                value={hints}
                onChange={(e) => setHints(e.target.value)}
                placeholder="Website, Twitter handle, company, niche..."
                className={`mt-2 w-full bg-transparent outline-none border-0 border-b ${borderClass} focus:border-neutral-400 dark:focus:border-neutral-600 pb-1 text-sm`}
              />
              <p className={`mt-1 text-xs ${textMuted}`}>
                Provide additional context to help find the right person
              </p>
            </div>

            <button
              onClick={startPipeline}
              disabled={!creatorName.trim()}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                creatorName.trim()
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
                  : "bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-600 cursor-not-allowed"
              }`}
            >
              Start Voice Analysis
            </button>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {(isProcessing || steps.length > 0) && !systemPrompt && (
        <div className={`rounded-xl border ${borderClass} ${surfaceBg}`}>
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Pipeline Progress</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={textMuted}>
                  {steps.filter(s => s.status === "completed").length} / {steps.length} completed
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ 
                  width: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100}%` 
                }}
              />
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: darkMode ? "#262626" : "#e5e5e5" }}>
            {steps.map((step) => (
              <div key={step.stepNumber}>
                <button
                  onClick={() => toggleStepExpansion(step.stepNumber)}
                  className={`w-full px-4 py-3 flex items-center justify-between ${hoverBg}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        Step {step.stepNumber}: {step.stepName}
                      </div>
                      {step.status === "processing" && (
                        <div className={`text-xs ${textMuted} mt-0.5`}>
                          Processing... {formatDuration(step.startTime)}
                        </div>
                      )}
                      {step.status === "completed" && step.startTime && step.endTime && (
                        <div className={`text-xs ${textMuted} mt-0.5`}>
                          Completed in {formatDuration(step.startTime, step.endTime)}
                        </div>
                      )}
                      {step.status === "failed" && step.error && (
                        <div className="text-xs text-red-500 mt-0.5">
                          {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedSteps.has(step.stepNumber) ? (
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  )}
                </button>

                {expandedSteps.has(step.stepNumber) && (
                  <div className={`px-4 py-3 border-t ${borderClass} bg-neutral-50 dark:bg-neutral-900/40`}>
                    {step.input && (
                      <div className="mb-3">
                        <div className={`text-xs font-medium ${textMuted} uppercase tracking-wide mb-1`}>
                          Input
                        </div>
                        <pre className="text-xs overflow-x-auto p-2 rounded bg-neutral-100 dark:bg-neutral-900">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <div className={`text-xs font-medium ${textMuted} uppercase tracking-wide mb-1`}>
                          Output
                        </div>
                        <pre className="text-xs overflow-x-auto p-2 rounded bg-neutral-100 dark:bg-neutral-900">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {!step.input && !step.output && (
                      <p className={`text-xs ${textMuted}`}>
                        {step.status === "pending" ? "Waiting to start..." : "Processing..."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Prompt Result */}
      {systemPrompt && (
        <div className={`rounded-xl border ${borderClass} ${surfaceBg} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              System Prompt Generated
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(systemPrompt)
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border ${borderClass} ${hoverBg}`}
            >
              Copy to Clipboard
            </button>
          </div>
          
          <div className={`rounded-lg border ${borderClass} p-4 bg-neutral-50 dark:bg-neutral-900/40`}>
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {systemPrompt}
            </pre>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setCreatorName("")
                setHints("")
                setSteps([])
                setSystemPrompt(null)
                setJobId(null)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm border ${borderClass} ${hoverBg}`}
            >
              Analyze Another Creator
            </button>
          </div>
        </div>
      )}
    </div>
  )
}