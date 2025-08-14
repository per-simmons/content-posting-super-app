import { createAppRoute } from "@trigger.dev/nextjs"
import { client } from "@/trigger"

export const { GET, POST, dynamic } = createAppRoute(client)