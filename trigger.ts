import { TriggerClient } from "@trigger.dev/nextjs"

export const client = new TriggerClient({
  id: process.env.TRIGGER_PROJECT_ID || "voice-emulator-project",
  apiKey: process.env.TRIGGER_DEV_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
})

// Import job definitions
import "./jobs/voice-emulator"