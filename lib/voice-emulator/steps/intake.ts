import { getVoiceEmulatorSession } from "../session-store"

export async function runIntakeStep(sessionId: string, context: any) {
  const session = await getVoiceEmulatorSession(sessionId)
  if (!session) throw new Error("Session not found")
  
  // Normalize creator name and extract potential aliases
  const creatorName = session.creatorName.trim()
  const normalizedName = creatorName.toLowerCase().replace(/[^\w\s]/g, '')
  
  // Build search query from hints
  const searchQuery = [
    creatorName,
    session.hints?.website,
    session.hints?.handle,
    session.hints?.niche
  ].filter(Boolean).join(' ')
  
  return {
    creatorName,
    normalizedName,
    searchQuery,
    hints: session.hints
  }
}