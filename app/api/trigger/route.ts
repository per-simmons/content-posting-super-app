import { handler } from "@trigger.dev/sdk/v3/nextjs"

export const { GET, POST } = handler({
  path: "/api/trigger",
  secret: process.env.TRIGGER_DEV_API_KEY || "",
})