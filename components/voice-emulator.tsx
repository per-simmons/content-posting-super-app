"use client"

import { useState } from "react"
import { 
  Mic, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  VoiceEmulatorSession,
  VoiceEmulatorFormData,
  PipelineStepResult,
  PIPELINE_STEPS,
  StepStatus
} from "@/lib/voice-emulator-types"

interface VoiceEmulatorProps {
  darkMode: boolean
  borderClass: string
  textSecondary: string
}

export function VoiceEmulator({ darkMode, borderClass, textSecondary }: VoiceEmulatorProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<VoiceEmulatorFormData>({
    creatorName: "",
    website: "",
    handle: "",
    niche: ""
  })
  
  const [session, setSession] = useState<VoiceEmulatorSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [progressExpanded, setProgressExpanded] = useState(true)

  const bgClass = darkMode ? "bg-neutral-950" : "bg-white"
  const bgSecondary = darkMode ? "bg-neutral-900" : "bg-neutral-50"
  const hoverBg = darkMode ? "hover:bg-neutral-900/60" : "hover:bg-neutral-50"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.creatorName.trim()) {
      toast({
        title: "Creator name required",
        description: "Please enter the name of the creator you want to emulate"
      })
      return
    }

    setIsRunning(true)
    setProgressExpanded(true)
    
    try {
      const response = await fetch("/api/voice-emulator/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to start pipeline")
      }
      
      setSession(data.session)
      pollForUpdates(data.session.id)
    } catch (error) {
      console.error("Error starting voice emulator:", error)
      toast({
        title: "Failed to start",
        description: error instanceof Error ? error.message : "An error occurred"
      })
      setIsRunning(false)
    }
  }

  const pollForUpdates = async (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice-emulator/status/${sessionId}`)
        const data = await response.json()
        
        setSession(data.session)
        
        if (data.session.status === "completed" || data.session.status === "error") {
          clearInterval(interval)
          setIsRunning(false)
          
          if (data.session.status === "completed") {
            toast({
              title: "Voice emulation complete!",
              description: "System prompt has been generated successfully"
            })
          } else {
            toast({
              title: "Pipeline failed",
              description: "Check the progress tracker for error details"
            })
          }
        }
      } catch (error) {
        console.error("Error polling for updates:", error)
      }
    }, 2000)
  }

  const toggleStepExpanded = (stepKey: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepKey)) {
      newExpanded.delete(stepKey)
    } else {
      newExpanded.add(stepKey)
    }
    setExpandedSteps(newExpanded)
  }

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-neutral-300 dark:border-neutral-700" />
    }
  }

  const copySystemPrompt = () => {
    if (session?.systemPrompt) {
      navigator.clipboard.writeText(session.systemPrompt)
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard"
      })
    }
  }

  const downloadSystemPrompt = () => {
    if (session?.systemPrompt) {
      const blob = new Blob([session.systemPrompt], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${session.creatorName.replace(/\s+/g, "-").toLowerCase()}-system-prompt.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatTime = (startTime: string, endTime?: string) => {
    if (!endTime) return "..."
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    const seconds = Math.floor(duration / 1000)
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Voice Emulator</h1>
        <p className={`text-sm ${textSecondary}`}>
          Analyze any creator's writing style and generate a system prompt to emulate their voice
        </p>
      </div>

      {/* Form */}
      <div className={`rounded-xl border ${borderClass} ${bgClass} p-6`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creatorName" className="text-sm font-medium">
              Creator Name *
            </Label>
            <Input
              id="creatorName"
              value={formData.creatorName}
              onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
              placeholder="e.g., Paul Graham, Naval Ravikant"
              className={`${darkMode ? "bg-neutral-900 border-neutral-800" : "bg-white"}`}
              disabled={isRunning}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">
                Website (optional)
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="personal-site.com"
                className={`${darkMode ? "bg-neutral-900 border-neutral-800" : "bg-white"}`}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle" className="text-sm font-medium">
                Social Handle (optional)
              </Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="@username"
                className={`${darkMode ? "bg-neutral-900 border-neutral-800" : "bg-white"}`}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche" className="text-sm font-medium">
                Niche/Topic (optional)
              </Label>
              <Input
                id="niche"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="e.g., startup, AI, philosophy"
                className={`${darkMode ? "bg-neutral-900 border-neutral-800" : "bg-white"}`}
                disabled={isRunning}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isRunning || !formData.creatorName.trim()}
            className="w-full md:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Analysis
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Progress Tracker */}
      {session && (
        <div className={`rounded-xl border ${borderClass} ${bgClass} overflow-hidden`}>
          <button
            onClick={() => setProgressExpanded(!progressExpanded)}
            className={`w-full px-4 py-3 flex items-center justify-between ${hoverBg} transition-colors`}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-medium">Pipeline Progress</h3>
              {isRunning && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {session.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {session.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
            {progressExpanded ? (
              <ChevronUp className="h-4 w-4 opacity-70" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-70" />
            )}
          </button>

          {progressExpanded && (
            <div className={`border-t ${borderClass} p-4`}>
              <div className="space-y-2">
                {PIPELINE_STEPS.map((stepDef) => {
                  const stepResult = session.steps?.find(s => s.step === stepDef.key)
                  const status = stepResult?.status || "pending"
                  const isExpanded = expandedSteps.has(stepDef.key)
                  
                  return (
                    <div key={stepDef.key} className={`rounded-lg border ${borderClass} overflow-hidden`}>
                      <button
                        onClick={() => toggleStepExpanded(stepDef.key)}
                        disabled={!stepResult || status === "pending"}
                        className={`w-full px-3 py-2 flex items-center justify-between ${
                          stepResult && status !== "pending" ? hoverBg : ""
                        } transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          {getStepIcon(status)}
                          <div className="text-left">
                            <div className="text-sm font-medium">{stepDef.label}</div>
                            <div className={`text-xs ${textSecondary}`}>{stepDef.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stepResult && status === "running" && (
                            <span className="text-xs text-blue-500">In progress...</span>
                          )}
                          {stepResult && status === "completed" && (
                            <span className={`text-xs ${textSecondary}`}>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatTime(stepResult.startTime, stepResult.endTime)}
                            </span>
                          )}
                          {stepResult && status !== "pending" && (
                            isExpanded ? (
                              <ChevronUp className="h-4 w-4 opacity-70" />
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-70" />
                            )
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && stepResult && (
                        <div className={`px-3 py-2 border-t ${borderClass} ${bgSecondary}`}>
                          {stepResult.error ? (
                            <div className="text-xs text-red-500">{stepResult.error}</div>
                          ) : stepResult.preview ? (
                            <div className={`text-xs ${textSecondary} font-mono`}>
                              {stepResult.preview}
                            </div>
                          ) : (
                            <div className={`text-xs ${textSecondary}`}>Processing...</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Prompt Output */}
      {session?.systemPrompt && (
        <div className={`rounded-xl border ${borderClass} ${bgClass} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-medium">Generated System Prompt</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              >
                {showSystemPrompt ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={copySystemPrompt}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadSystemPrompt}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          {showSystemPrompt && (
            <div className="p-4">
              <pre className={`text-xs font-mono ${textSecondary} whitespace-pre-wrap break-words`}>
                {session.systemPrompt}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {session?.status === "completed" && (
        <div className={`rounded-xl border ${borderClass} ${bgClass} p-4`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className={`text-xs ${textSecondary} mb-1`}>Sources Found</div>
              <div className="text-lg font-semibold">{session.sources?.length || 0}</div>
            </div>
            <div>
              <div className={`text-xs ${textSecondary} mb-1`}>Content Pieces</div>
              <div className="text-lg font-semibold">{session.totalContentPieces || 0}</div>
            </div>
            <div>
              <div className={`text-xs ${textSecondary} mb-1`}>Tokens Processed</div>
              <div className="text-lg font-semibold">
                {session.totalTokensProcessed?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className={`text-xs ${textSecondary} mb-1`}>Processing Time</div>
              <div className="text-lg font-semibold">
                {session.completedAt && session.createdAt
                  ? `${Math.floor(
                      (new Date(session.completedAt).getTime() - new Date(session.createdAt).getTime()) / 1000
                    )}s`
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}