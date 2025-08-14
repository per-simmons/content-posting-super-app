import { VoiceEmulatorSession, PipelineStep, StepStatus } from "@/lib/voice-emulator-types"

// In-memory session store (replace with database in production)
const sessions = new Map<string, VoiceEmulatorSession>()

export async function createVoiceEmulatorSession(
  creatorName: string,
  hints?: {
    website?: string
    handle?: string
    niche?: string
  }
): Promise<VoiceEmulatorSession> {
  const sessionId = `ve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const session: VoiceEmulatorSession = {
    id: sessionId,
    creatorName,
    hints,
    status: "pending",
    steps: [],
    createdAt: new Date().toISOString()
  }
  
  sessions.set(sessionId, session)
  return session
}

export async function getVoiceEmulatorSession(
  sessionId: string
): Promise<VoiceEmulatorSession | null> {
  return sessions.get(sessionId) || null
}

export async function updateVoiceEmulatorSession(
  sessionId: string,
  updates: Partial<VoiceEmulatorSession>
): Promise<VoiceEmulatorSession | null> {
  const session = sessions.get(sessionId)
  if (!session) return null
  
  const updatedSession = { ...session, ...updates }
  sessions.set(sessionId, updatedSession)
  return updatedSession
}

export async function updateSessionStep(
  sessionId: string,
  step: PipelineStep,
  status: StepStatus,
  data?: {
    output?: any
    error?: string
    preview?: string
  }
): Promise<void> {
  const session = sessions.get(sessionId)
  if (!session) return
  
  // Initialize steps array if not present
  if (!session.steps) {
    session.steps = []
  }
  
  const existingStepIndex = session.steps.findIndex(s => s.step === step)
  const now = new Date().toISOString()
  
  if (existingStepIndex >= 0) {
    // Update existing step
    session.steps[existingStepIndex] = {
      ...session.steps[existingStepIndex],
      status,
      ...(status === "running" && { startTime: now }),
      ...(status === "completed" && { endTime: now }),
      ...(status === "error" && { endTime: now }),
      ...data
    }
  } else {
    // Add new step
    session.steps.push({
      step,
      status,
      startTime: now,
      ...data
    })
  }
  
  // Update session status
  if (status === "running" && session.status !== "running") {
    session.status = "running"
    session.currentStep = step
  } else if (status === "error") {
    session.status = "error"
  }
  
  sessions.set(sessionId, session)
}