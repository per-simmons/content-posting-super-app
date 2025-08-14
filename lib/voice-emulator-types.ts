export type PipelineStep = 
  | "intake"
  | "discovery"
  | "newsletter"
  | "twitter"
  | "linkedin"
  | "blog"
  | "consolidation"
  | "vectorization"
  | "retrieval"
  | "analysis"
  | "synthesis"

export type StepStatus = "pending" | "running" | "completed" | "error"

export type ContentSource = {
  type: "newsletter" | "twitter" | "linkedin" | "blog"
  url: string
  contentCount: number
  extractedAt?: string
}

export type PipelineStepResult = {
  step: PipelineStep
  status: StepStatus
  startTime: string
  endTime?: string
  output?: any
  error?: string
  preview?: string
}

export type VoiceEmulatorSession = {
  id: string
  creatorName: string
  aliases?: string[]
  hints?: {
    website?: string
    handle?: string
    niche?: string
  }
  status: "pending" | "running" | "completed" | "error"
  currentStep?: PipelineStep
  steps?: PipelineStepResult[]
  sources?: ContentSource[]
  voiceProfileJson?: any
  systemPrompt?: string
  createdAt: string | Date
  updatedAt?: string | Date
  completedAt?: string
  totalTokensProcessed?: number
  totalContentPieces?: number
}

export type VoiceEmulatorFormData = {
  creatorName: string
  website?: string
  handle?: string
  niche?: string
}

export const PIPELINE_STEPS: { key: PipelineStep; label: string; description: string }[] = [
  { key: "intake", label: "Intake & Target Selection", description: "Normalizing creator information" },
  { key: "discovery", label: "Discovery Pass", description: "Finding official sources via Perplexity" },
  { key: "newsletter", label: "Newsletter Ingest", description: "Extracting newsletter/blog content" },
  { key: "twitter", label: "Twitter/X Ingest", description: "Fetching top 50 engaged tweets" },
  { key: "linkedin", label: "LinkedIn Ingest", description: "Fetching top 20 engaged posts" },
  { key: "blog", label: "Blog Ingest", description: "Extracting blog articles" },
  { key: "consolidation", label: "Consolidation", description: "Merging all content sources" },
  { key: "vectorization", label: "Vectorization", description: "Creating embeddings for content" },
  { key: "retrieval", label: "Evidence Retrieval", description: "Finding representative examples" },
  { key: "analysis", label: "Voice Analysis", description: "Analyzing writing patterns" },
  { key: "synthesis", label: "System Prompt Synthesis", description: "Generating final prompt" }
]