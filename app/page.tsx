"use client"

import type * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Info,
  UploadIcon,
  FileText,
  Scissors,
  Captions,
  Sparkles,
  Home,
  FolderKanban,
  Activity,
  MessageSquare,
  ImageIcon,
  Hammer,
  Megaphone,
  PlaySquare,
  Rss,
  Menu,
  Video,
  TypeIcon,
  Wand2,
  Search,
  Mail,
  Loader2,
  Mic
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ReloadIcon, ChevronRightIcon, ChevronLeftIcon, PlusIcon, SunIcon, MoonIcon, EnvelopeClosedIcon, Cross2Icon, CheckIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { VoiceEmulator } from "@/components/voice-emulator"

// -----------------------------
// Types & Static Data
// -----------------------------

type NavItem = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type AmplifyFeature = "mini" | "sped" | "miniVideo" | "process" // Removed captions and description (moved to Craft)
type AECategory = "longform" | "shortform" | "text" | "blogs" | "newsletter"
type EditorMode = "craft" | "amplify" | "highlight" | "mashup" | "newsletter" | "keyword" | "seo"

type NewsletterSource = {
  id: string
  type: "article" | "tweet" | "reddit"
  title: string
  subhead: string
  url: string
  publishedAt: string // ISO string
  image?: string // optional header image
}

type AmplifyOutput = {
  captions?: string[]
  description?: string
  miniCuts?: { title: string; start: string; end: string }[]
  sped?: { title: string; start: string; end: string; notes: string }
  miniVideo?: { title: string; start: string; end: string; notes: string }
  process?: { 
    highlights: { title: string; start: string; end: string }[]
    openerScript: string
    closerScript: string
    recordingScript: string
  }
}

type AmplifyRun = {
  id: string
  feature: AmplifyFeature
  status: "ready" | "running" | "error"
  createdAt: string
  summary?: string
  data?: AmplifyOutput
}

type BlogSiteKey = "clearhaven" | "ai-for-mortals" | "solar-lift"

const BLOG_SITES: Record<BlogSiteKey, { name: string; logo: string; short: string }> = {
  clearhaven: { name: "Clearhaven Blog", logo: "/images/Clearhaven logo.png", short: "Clearhaven" },
  "ai-for-mortals": { name: "AI For Mortals", logo: "/images/AI For Mortals Logo.png", short: "AI For Mortals" },
  "solar-lift": { name: "Solar Lift", logo: "/images/Solar Lift logo (500 x 500 px).png", short: "Solar Lift" },
}

type CraftMode = "agentic" | "youtube"

type AEProject = {
  id: string
  name: string
  category: AECategory
  tool?:
    | "agentic"
    | "amplify"
    | "highlight"
    | "mashup"
    | "twitter"
    | "linkedin"
    | "keyword"
    | "seo"
    | "contentstream"
    | "drafts"
    | "issues"
  craftMode?: CraftMode // For craft projects, which mode they're in
  files: { name: string; size: number }[]
  amplifyFeatures?: AmplifyFeature[] // selected amplify features
  amplifyResults?: AmplifyRun[] // generated outputs per feature
  sources?: NewsletterSource[] // newsletter sources (only for category: newsletter)
  blog?: BlogSiteKey
}

const PRIMARY: NavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "projects", label: "Projects", icon: FolderKanban },
]

const FEATURES: NavItem[] = [
  { key: "analytics", label: "Analytics", icon: Activity },
  { key: "commentResponder", label: "Comment Responder", icon: MessageSquare },
  { key: "thumbnailHub", label: "Thumbnail Hub", icon: ImageIcon },
  { key: "scriptWriter", label: "Script Writer", icon: FileText },
  { key: "voiceEmulator", label: "Voice Emulator", icon: Mic },
]

// Long-Form group items
const LONGFORM_ITEMS: NavItem[] = [
  { key: "craft", label: "Craft", icon: Hammer },
  { key: "amplify", label: "Amplify", icon: Megaphone },
]

// Short-Form group items
const SHORTFORM_ITEMS: NavItem[] = [
  { key: "highlight", label: "Highlight", icon: Scissors },
  { key: "mashup", label: "Mashup", icon: PlaySquare },
]

// Blogs sub-nav items
const BLOGS_ITEMS: NavItem[] = [
  { key: "keyword", label: "Keyword Research", icon: Search },
  { key: "seo", label: "SEO Writing Agent", icon: FileText },
]

// Newsletter sub-nav items
const NEWSLETTER_ITEMS: NavItem[] = [
  { key: "newsletter-home", label: "Home", icon: Home },
  { key: "newsletter-stream", label: "Content Stream", icon: Rss },
]

// Mock feature catalog  
const AMPLIFY_FEATURES_MOCK = [
  { key: "miniCuts", label: "Mini Cuts", icon: Scissors },
  { key: "sped", label: "Sped Up Demo", icon: Sparkles },
  { key: "miniVideo", label: "Mini Video", icon: Sparkles },
  { key: "process", label: "Process Preview", icon: Sparkles },
] as const

// Amplify selection chips and tool view
const AMPLIFY_FEATURES: { key: AmplifyFeature; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "mini", label: "Mini Video Finder", icon: Scissors },
  { key: "sped", label: "Sped Up Demo Maker", icon: PlaySquare },
  { key: "miniVideo", label: "Mini Video Maker", icon: PlaySquare },
  { key: "process", label: "Process Preview Maker", icon: PlaySquare },
]

// Mock Content Stream items with dates and optional header images
const RSS_ITEMS: NewsletterSource[] = [
  {
    id: "src-1",
    type: "article",
    title: "Using Vercel to Scale your Next.js App",
    subhead: "A deep dive into deploying, previewing, and scaling modern apps.",
    url: "https://example.com/scale-nextjs-app",
    publishedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
    image: "/developer-blog-header.png",
  },
  {
    id: "src-2",
    type: "reddit",
    title: "r/nextjs: How to structure app router projects",
    subhead: "Community guidance and patterns for large projects.",
    url: "https://reddit.com/r/nextjs",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hr ago
  },
  {
    id: "src-3",
    type: "tweet",
    title: "“Ship small, ship often.”",
    subhead: "A reminder that iteration beats perfection on day one.",
    url: "https://twitter.com/someone/status/123",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hr ago
    image: "/tweet-header.png",
  },
  {
    id: "src-4",
    type: "article",
    title: "The Power of Partial Prerendering",
    subhead: "Mixing static and dynamic content to get the best of both.",
    url: "https://example.com/ppr",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
]

// -----------------------------
// Utils
// -----------------------------

function headingForMode(mode: EditorMode): string {
  if (mode === "craft") return "Agentic Editor"
  if (mode === "amplify") return "Amplify"
  if (mode === "highlight") return "Highlight Finder"
  if (mode === "mashup") return "Mashup Maker"
  if (mode === "keyword") return "Keyword Research"
  if (mode === "seo") return "SEO Writing Agent"
  return "Editor"
}

function toolForMode(mode: EditorMode): AEProject["tool"] | null {
  if (mode === "craft") return "agentic"
  if (mode === "amplify") return "amplify"
  if (mode === "highlight") return "highlight"
  if (mode === "mashup") return "mashup"
  if (mode === "keyword") return "keyword"
  if (mode === "seo") return "seo"
  return null
}

function singleOnlyForMode(mode: EditorMode): boolean {
  if (mode === "craft") return false
  if (mode === "amplify") return false
  if (mode === "highlight") return true
  if (mode === "mashup") return true
  if (mode === "keyword") return false
  if (mode === "seo") return false
  return false
}

function isEditorMode(key: string): key is EditorMode {
  return (
    key === "craft" ||
    key === "amplify" ||
    key === "highlight" ||
    key === "mashup" ||
    key === "newsletter" ||
    key === "keyword" ||
    key === "seo"
  )
}

function labelFor(key: string): string {
  const item = [...PRIMARY, ...FEATURES].find((i) => i.key === key)
  return item?.label ?? "Unknown"
}

function suggestNextIssueName(projects: AEProject[]): string {
  const issues = projects.filter((p) => p.category === "newsletter").map((p) => p.name)
  if (issues.length === 0) return "Newsletter Issue 1"
  const lastIssue = issues.sort().reverse()[0]
  const match = lastIssue.match(/(\d+)$/)
  if (!match) return `${lastIssue} 2`
  const num = Number.parseInt(match[1])
  return lastIssue.replace(/(\d+)$/, String(num + 1))
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatDate(isoDateString: string): string {
  const date = new Date(isoDateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

// Deduplicate consecutive breadcrumb labels and strip empties.
function buildBreadcrumbLabels(parts: Array<string | undefined | null>) {
  const filtered = parts.filter(Boolean) as string[]
  const deduped: string[] = []
  for (const label of filtered) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== label) {
      deduped.push(label)
    }
  }
  return deduped
}

// Fixed, clamped popover positioning
function useAnchoredPopover(triggerRef: React.RefObject<HTMLElement>, open: boolean) {
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden", position: "fixed" })

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const trigger = triggerRef.current
    const rect = trigger.getBoundingClientRect()
    let top = rect.bottom + 8
    let left = rect.left
    const width = 320
    const vw = window.innerWidth
    const vh = window.innerHeight

    setStyle({
      position: "fixed",
      top,
      left,
      minWidth: width,
      maxWidth: Math.min(width, vw - 16),
      visibility: "hidden",
      zIndex: 60,
    })

    const raf = requestAnimationFrame(() => {
      const height = popoverRef.current?.getBoundingClientRect().height ?? 200
      top = Math.min(Math.max(8, top), vh - height - 8)
      left = Math.min(Math.max(8, left), vw - width - 8)
      setStyle({
        position: "fixed",
        top,
        left,
        minWidth: width,
        maxWidth: Math.min(width, vw - 16),
        visibility: "visible",
        zIndex: 60,
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [open, triggerRef])

  return { popoverRef, style }
}

function InfoPopover({
  open,
  onOpenChange,
  triggerRef,
  title = "About Amplify",
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
  title?: string
  children: React.ReactNode
}) {
  const { popoverRef, style } = useAnchoredPopover(triggerRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target as Node)
      ) {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onClick)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onClick)
    }
  }, [open, onOpenChange, popoverRef, triggerRef])

  if (!open) return null
  return (
    <div
      ref={popoverRef}
      style={style}
      role="dialog"
      aria-modal="false"
      className="rounded-md border bg-popover text-popover-foreground shadow-lg"
    >
      <div className="p-3">
        <div className="mb-2 text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

type AmplifyFeatureKey = (typeof AMPLIFY_FEATURES_MOCK)[number]["key"]

// Inline info button (unchanged)
function InlineInfoButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="More info"
        className="inline-flex h-7 w-7 items-center justify-center rounded border text-muted-foreground hover:bg-accent"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="h-4 w-4" />
      </button>
      <InfoPopover open={open} onOpenChange={setOpen} triggerRef={ref} title="What happens next?">
        After you click Next, we save your selections, then you&apos;ll see a dashboard with cards for each selected
        feature. This popover is positioned relative to the info button and clamped to the viewport, so it won&apos;t
        appear off-screen.
      </InfoPopover>
    </>
  )
}

function BlogBadge({ site, size = "sm" }: { site: BlogSiteKey; size?: "sm" | "md" }) {
  const meta = BLOG_SITES[site]
  const cls = size === "sm" ? "h-5 w-5" : "h-6 w-6"
  const textCls = size === "sm" ? "text-xs" : "text-sm"
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-2 py-1">
      <img src={meta.logo || "/placeholder.svg"} alt={`${meta.name} logo`} className={`${cls} rounded`} />
      <span className={`${textCls}`}>{meta.short}</span>
    </span>
  )
}

// A simple tool runner (kept)
function ToolRunner({ toolKey }: { toolKey: (typeof AMPLIFY_FEATURES_MOCK)[number]["key"] }) {
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const label = AMPLIFY_FEATURES_MOCK.find((f) => f.key === toolKey)?.label ?? "Tool"

  async function run() {
    setRunning(true)
    setOutput(null)
    await new Promise((r) => setTimeout(r, 1000))
    const text =
      toolKey === "miniCuts"
        ? "3 mini-cuts identified at 00:18, 02:42, and 05:10."
        : toolKey === "sped"
          ? "Speed-up demo created: 2x speed with key moments highlighted."
          : toolKey === "miniVideo"
            ? "Mini video generated: 30-second highlight reel ready."
            : "Process preview complete: All systems operational."
    setOutput(text)
    setRunning(false)
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={run} disabled={running}>
          {running ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run mock generation
            </>
          )}
        </Button>

        {output && <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">{output}</pre>}
      </CardContent>
    </Card>
  )
}

// -----------------------------
// Components
// -----------------------------

function NavGroup({
  items,
  active,
  onSelect,
  collapsed,
  activeBg,
  hoverFill,
  textSecondary,
}: {
  items: NavItem[]
  active: string
  onSelect: (k: string) => void
  collapsed: boolean
  activeBg: string
  hoverFill: string
  textSecondary: string
}) {
  return (
    <nav className="px-2 py-1">
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <li key={item.key}>
              <button
                onClick={() => onSelect(item.key)}
                aria-current={isActive ? "page" : undefined}
                className={`group flex w-full items-center ${
                  collapsed ? "justify-center" : "gap-3"
                } rounded-lg px-2 py-2 text-[13px] ${isActive ? activeBg : `${textSecondary} ${hoverFill}`}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SectionHeader({
  title,
  collapsed,
  textSecondary,
}: {
  title: string
  collapsed: boolean
  textSecondary: string
}) {
  return (
    <div className={`${collapsed ? "hidden" : "block"} px-3 pt-2 pb-1`}>
      <div className={`text-[11px] uppercase tracking-wide ${textSecondary}`}>
        <span className="underline underline-offset-4">{title}</span>
      </div>
    </div>
  )
}

function EditorLeftNav({
  activeMode,
  newsletterTab,
  onSelectMode,
  onSelectNewsletterTab,
  collapsed,
  activeBg,
  hoverFill,
  textSecondary,
  borderClass,
  darkMode,
}: {
  activeMode: EditorMode
  newsletterTab: "home" | "stream"
  onSelectMode: (k: EditorMode) => void
  onSelectNewsletterTab: (k: "home" | "stream") => void
  collapsed: boolean
  activeBg: string
  hoverFill: string
  textSecondary: string
  borderClass: string
  darkMode: boolean
}) {
  const renderGroup = (label: string, items: NavItem[], activeKey: string, onSelect: (k: string) => void) => (
    <>
      <SectionHeader title={label} collapsed={collapsed} textSecondary={textSecondary} />
      <nav className="px-2 py-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = activeKey === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onSelect(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex w-full items-center ${
                    collapsed ? "justify-center" : "gap-3"
                  } rounded-lg px-2 py-2 text-[13px] ${isActive ? activeBg : `${textSecondary} ${hoverFill}`}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )

  if (activeMode === "craft" || activeMode === "amplify") {
    return <div>{renderGroup("Long Form", LONGFORM_ITEMS, activeMode, (k) => onSelectMode(k as EditorMode))}</div>
  }

  if (activeMode === "highlight" || activeMode === "mashup") {
    return <div>{renderGroup("Short Form", SHORTFORM_ITEMS, activeMode, (k) => onSelectMode(k as EditorMode))}</div>
  }

  if (activeMode === "keyword" || activeMode === "seo") {
    return <div>{renderGroup("Blogs", BLOGS_ITEMS, activeMode, (k) => onSelectMode(k as EditorMode))}</div>
  }

  const activeNewsletterKey = newsletterTab === "home" ? "newsletter-home" : "newsletter-stream"
  return (
    <div>
      {renderGroup("Newsletter", NEWSLETTER_ITEMS, activeNewsletterKey, (k) =>
        onSelectNewsletterTab(k === "newsletter-home" ? "home" : "stream"),
      )}
      <div className={`mx-3 my-2 h-px ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />
    </div>
  )
}

function CreateModal({
  darkMode,
  onClose,
  borderClass,
  onSelectLongForm,
  onSelectShortForm,
  onSelectNewsletter,
  onSelectBlogs,
}: {
  darkMode: boolean
  onClose: () => void
  borderClass: string
  onSelectLongForm: () => void
  onSelectShortForm: () => void
  onSelectNewsletter: () => void
  onSelectBlogs: () => void
}) {
  const overlayBg = darkMode ? "bg-black/60" : "bg-neutral-900/20"
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"
  const labelClass = "text-sm font-medium"
  const sentenceClass = `text-xs ${textMuted}`

  const cards = [
    {
      key: "longform",
      label: "Long Form",
      icon: Video,
      sentence: "Agentic Editor, Caption Generator, Mini Video Finder.",
    },
    { key: "shortform", label: "Short Form", icon: Scissors, sentence: "Highlight Finder, Mashup Maker." },
    { key: "text", label: "Text", icon: TypeIcon, sentence: "Twitter Ghost Writer, LinkedIn Ghost Writer." },
    { key: "blogs", label: "Blogs", icon: FileText, sentence: "Keyword Research, SEO Writing Agent." },
    { key: "newsletter", label: "Newsletter", icon: Mail, sentence: "Content Stream, Drafts, Issues." },
  ]

  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`}>
      <div className={`w-full max-w-3xl rounded-2xl border ${borderClass} ${surfaceBg} shadow-xl`}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "inherit" }}>
          <h2 className="text-base font-medium">Create</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
          {cards.map(({ key, label, icon: Icon, sentence }) => (
            <button
              key={key}
              onClick={() => {
                if (key === "longform") onSelectLongForm()
                else if (key === "shortform") onSelectShortForm()
                else if (key === "newsletter") onSelectNewsletter()
                else if (key === "blogs") onSelectBlogs()
                else onClose()
              }}
              className={`group flex flex-col items-start gap-2 rounded-xl border ${borderClass} p-4 text-left ${
                darkMode ? "hover:bg-neutral-900/60" : "hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className={labelClass}>{label}</span>
              </div>
              <p className={sentenceClass}>{sentence}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function LongFormModal({
  darkMode,
  onClose,
  borderClass,
  hoverFill,
  onBackToCreate,
  onSaveCraftProject,
  onSaveAmplifyProject,
  startStep = "choose",
  startMode = "craft",
}: {
  darkMode: boolean
  onClose: () => void
  borderClass: string
  hoverFill: string
  onBackToCreate: () => void
  onSaveCraftProject: (name: string) => void
  onSaveAmplifyProject: (name: string) => void
  startStep?: "choose" | "setup"
  startMode?: "craft" | "amplify"
}) {
  const overlayBg = darkMode ? "bg-black/60" : "bg-neutral-900/20"
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"

  const [step, setStep] = useState<"choose" | "setup">(startStep)
  const [mode, setMode] = useState<"craft" | "amplify">(startMode)
  useEffect(() => setStep(startStep), [startStep])
  useEffect(() => setMode(startMode), [startMode])

  const craftInfo =
    "Only use this feature AFTER a video has been recorded. Use all raw footage from a recorded video. It allows you to create a rough cut for an editor."
  const amplifyInfo = {
    yt: "AFTER a video has been edited and approved. Upload the video to generate YouTube captions (timestamps) and a Description for the video",
    mini: 'An LLM will find smaller videos in a larger video. Example: In a 30+ minute "Building Agency Vlog" the LLM might find a 4 minute segment about how I use Arcads to run Facebook ads.',
    demo: "Use this feature to create a short, focused demo from a longer video to post on Twitter.",
  } as const

  const [popover, setPopover] = useState<null | { id: string; x: number; y: number; text: string }>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  function openPopover(e: React.MouseEvent, id: string, text: string) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (popover && popover.id === id) {
      setPopover(null)
      return
    }
    setPopover({ id, x: rect.left + rect.width / 2, y: rect.bottom + 6, text })
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const nameRef = useRef<HTMLInputElement | null>(null)
  const [projectName, setProjectName] = useState<string>(
    mode === "craft" ? "Agentic Editor Project 1" : "Amplify Project 1",
  )
  useEffect(() => {
    if (step === "setup") {
      requestAnimationFrame(() => {
        nameRef.current?.focus()
        nameRef.current?.select()
      })
    }
  }, [step])
  useEffect(() => {
    if (step === "setup") {
      setProjectName(mode === "craft" ? "Agentic Editor Project 1" : "Amplify Project 1")
    }
  }, [mode]) // eslint-disable-line

  const craftCardRef = useRef<HTMLButtonElement | null>(null)
  const amplifyCardRef = useRef<HTMLButtonElement | null>(null)
  function handleModalContentClick(e: React.MouseEvent) {
    e.stopPropagation()
    const t = e.target as Node
    if (
      popover &&
      !craftCardRef.current?.contains(t) &&
      !amplifyCardRef.current?.contains(t) &&
      !popoverRef.current?.contains(t)
    ) {
      setPopover(null)
    }
  }

  const heading = mode === "craft" ? "Agentic Editor" : "Amplify"

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`}
      onClick={() => setPopover(null)}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl border ${borderClass} ${surfaceBg} shadow-xl`}
        onClick={handleModalContentClick}
      >
        {/* Breadcrumbs */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "inherit" }}>
          <nav className="text-xs">
            <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={onBackToCreate}>
              Create
            </button>
            <span className="mx-1">›</span>
            {step === "setup" ? (
              <>
                <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={() => setStep("choose")}>
                  Long Form
                </button>
                <span className="mx-1">›</span>
                <span className="font-medium">{heading}</span>
              </>
            ) : (
              <span className="font-medium">Long Form</span>
            )}
          </nav>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                ref={craftCardRef}
                onClick={() => {
                  setMode("craft")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="text-sm font-semibold tracking-tight">Craft</div>
                <ul className={`mt-3 space-y-2 text-xs ${textMuted}`}>
                  <li className="flex items-center gap-2">
                    <span>Agentic Editor</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "craft-agentic", craftInfo)}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>YouTube Description & Caption Generator</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "craft-yt", amplifyInfo.yt)}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ul>
              </button>

              <button
                ref={amplifyCardRef}
                onClick={() => {
                  setMode("amplify")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="text-sm font-semibold tracking-tight">Amplify</div>
                <ul className={`mt-3 space-y-2 text-xs ${textMuted}`}>
                  <li className="flex items-center gap-2">
                    <span>Mini Video Finder</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "amp-mini", amplifyInfo.mini)}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>Sped Up Demo Maker</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "amp-sped", amplifyInfo.demo)}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>Mini Video Maker</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "amp-miniVideo", amplifyInfo.demo)}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>Process Preview Maker</span>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => openPopover(e, "amp-process", "Finds key segments for highlight cuts and generates opener/closer scripts. Outputs timestamps for editor and recording scripts for you. <a href='https://www.notion.so/Process-Preview-24f3bb56baf980348253fedb095332bc?source=copy_link' target='_blank' rel='noopener noreferrer' style='color: #3b82f6; text-decoration: underline;'>More details here.</a>")}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ul>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="mt-1 flex items-center gap-2">
              {mode === "craft" ? (
                <Wand2 className="h-4 w-4 opacity-80" />
              ) : (
                <Megaphone className="h-4 w-4 opacity-80" />
              )}
              <div>
                <div className="text-base font-medium leading-none">
                  {mode === "craft" ? "Agentic Editor" : "Amplify"}
                </div>
                <div className={`mt-1 text-xs ${textMuted}`}>
                  {mode === "craft"
                    ? "Set up your project for the agentic rough-cut workflow and YouTube content generation."
                    : "Set up your project for Amplify workflows (mini-video finder, sped up demo maker, mini video maker, process preview maker)."}
                </div>
              </div>
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setPopover({
                    id: "setup-head",
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 6,
                    text: mode === "craft" ? craftInfo : amplifyInfo.yt,
                  })
                }}
                className="ml-auto cursor-pointer opacity-70 hover:opacity-100"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5">
              <label className={`text-xs ${textMuted}`}>Project Name</label>
              <input
                ref={nameRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`mt-1 w-full bg-transparent outline-none border-0 border-b ${
                  darkMode
                    ? "border-neutral-800 focus:border-neutral-600"
                    : "border-neutral-200 focus:border-neutral-400"
                } pb-1`}
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
                }`}
                onClick={() => {
                  if (mode === "craft") onSaveCraftProject(projectName)
                  else onSaveAmplifyProject(projectName)
                }}
              >
                Save {mode === "craft" ? "Craft" : "Amplify"} Project
              </button>
              <button className="text-sm opacity-80 hover:opacity-100" onClick={() => setStep("choose")}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {popover && (
          <div
            ref={popoverRef}
            className={`fixed z-[60] w-80 rounded-md border ${borderClass} ${surfaceBg} p-3 text-xs shadow-xl`}
            style={{
              left: (() => {
                const gutter = 12
                const PANEL_W = 320
                const left = popover.x - PANEL_W / 2
                const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 0) - gutter - PANEL_W
                return `${Math.max(gutter, Math.min(left, Math.max(gutter, maxLeft)))}px`
              })(),
              top: `${popover.y}px`,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: popover.text }} />
          </div>
        )}
      </div>
    </div>
  )
}

function ShortFormModal({
  darkMode,
  onClose,
  borderClass,
  hoverFill,
  onBackToCreate,
  startStep = "choose",
  startMode = "highlight",
  onSave,
}: {
  darkMode: boolean
  onClose: () => void
  borderClass: string
  hoverFill: string
  onBackToCreate: () => void
  startStep?: "choose" | "setup"
  startMode?: "highlight" | "mashup"
  onSave: (kind: "highlight" | "mashup", name: string) => void
}) {
  const overlayBg = darkMode ? "bg-black/60" : "bg-neutral-900/20"
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"

  const highlightInfo =
    "Automatically detects short, high-impact moments from a longer video. Ideal for creating multiple separate quick clips (30–60s) from vlogs or build videos."
  const mashupInfo =
    "Combines multiple standout moments into a single reel. Useful for handing over to a Short-Form editor."

  const [step, setStep] = useState<"choose" | "setup">(startStep)
  const [mode, setMode] = useState<"highlight" | "mashup">(startMode)
  useEffect(() => setStep(startStep), [startStep])
  useEffect(() => setMode(startMode), [startMode])

  const [popover, setPopover] = useState<null | { id: string; x: number; y: number; text: string }>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  function openPopover(e: React.MouseEvent, id: string, text: string) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (popover && popover.id === id) {
      setPopover(null)
      return
    }
    setPopover({ id, x: rect.left + rect.width / 2, y: rect.bottom + 6, text })
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const nameRef = useRef<HTMLInputElement | null>(null)
  const defaultName = mode === "highlight" ? "Highlight Finder Project 1" : "Mashup Maker Project 1"
  const [projectName, setProjectName] = useState<string>(defaultName)
  useEffect(() => {
    if (step === "setup") {
      requestAnimationFrame(() => {
        nameRef.current?.focus()
        nameRef.current?.select()
      })
    }
  }, [step])
  useEffect(() => {
    if (step === "setup") {
      setProjectName(mode === "highlight" ? "Highlight Finder Project 1" : "Mashup Maker Project 1")
    }
  }, [mode]) // eslint-disable-line

  function handleModalContentClick(e: React.MouseEvent) {
    e.stopPropagation()
    const t = e.target as Node
    if (popover && !popoverRef.current?.contains(t)) {
      setPopover(null)
    }
  }

  const heading = mode === "highlight" ? "Highlight Finder" : "Mashup Maker"

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`}
      onClick={() => setPopover(null)}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl border ${borderClass} ${surfaceBg} shadow-xl`}
        onClick={handleModalContentClick}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "inherit" }}>
          <nav className="text-xs">
            <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={onBackToCreate}>
              Create
            </button>
            <span className="mx-1">›</span>
            {step === "setup" ? (
              <>
                <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={() => setStep("choose")}>
                  Short Form
                </button>
                <span className="mx-1">›</span>
                <span className="font-medium">{heading}</span>
              </>
            ) : (
              <span className="font-medium">Short Form</span>
            )}
          </nav>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                onClick={() => {
                  setMode("highlight")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-base md:text-lg font-semibold tracking-tight">Highlight Finder</div>
                  <button
                    type="button"
                    aria-label="More info"
                    className="cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                    onClick={(e) => openPopover(e, "sf-highlight", highlightInfo)}
                  >
                    <Info className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </div>
              </button>

              <button
                onClick={() => {
                  setMode("mashup")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-base md:text-lg font-semibold tracking-tight">Mashup Maker</div>
                  <button
                    type="button"
                    aria-label="More info"
                    className="cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                    onClick={(e) => openPopover(e, "sf-mashup", mashupInfo)}
                  >
                    <Info className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="mt-1 flex items-center gap-2">
              <Scissors className="h-4 w-4 opacity-80" />
              <div>
                <div className="text-base font-medium leading-none">{heading}</div>
                <div className={`mt-1 text-xs ${textMuted}`}>Name your project to get started.</div>
              </div>
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setPopover({
                    id: "sf-setup-head",
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 6,
                    text: mode === "highlight" ? highlightInfo : mashupInfo,
                  })
                }}
                className="ml-auto cursor-pointer opacity-70 hover:opacity-100"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5">
              <label className={`text-xs ${textMuted}`}>Project Name</label>
              <input
                ref={nameRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`mt-1 w-full bg-transparent outline-none border-0 border-b ${
                  darkMode
                    ? "border-neutral-800 focus:border-neutral-600"
                    : "border-neutral-200 focus:border-neutral-400"
                } pb-1`}
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
                }`}
                onClick={() => onSave(mode, projectName)}
              >
                Save {heading} Project
              </button>
              <button className="text-sm opacity-80 hover:opacity-100" onClick={() => setStep("choose")}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {popover && (
          <div
            ref={popoverRef}
            className={`fixed z-[60] w-80 rounded-md border ${borderClass} ${surfaceBg} p-3 text-xs shadow-xl`}
            style={{
              left: (() => {
                const gutter = 12
                const PANEL_W = 320
                const left = popover.x - PANEL_W / 2
                const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 0) - gutter - PANEL_W
                return `${Math.max(gutter, Math.min(left, Math.max(gutter, maxLeft)))}px`
              })(),
              top: `${popover.y}px`,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: popover.text }} />
          </div>
        )}
      </div>
    </div>
  )
}

function NewsletterCreateModal({
  darkMode,
  borderClass,
  onClose,
  onBackToCreate,
  defaultName = "Newsletter Issue 1",
  onSave,
}: {
  darkMode: boolean
  borderClass: string
  onClose: () => void
  onBackToCreate: () => void
  defaultName?: string
  onSave: (name: string) => void
}) {
  const overlayBg = darkMode ? "bg-black/60" : "bg-neutral-900/20"
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"

  const [name, setName] = useState<string>(defaultName)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`} aria-modal="true" role="dialog">
      <div className={`w-full max-w-lg rounded-2xl border ${borderClass} ${surfaceBg} shadow-xl`}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "inherit" }}>
          <nav className="text-xs">
            <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={onBackToCreate}>
              Create
            </button>
            <span className="mx-1">›</span>
            <span className="font-medium">Newsletter</span>
          </nav>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mt-1 flex items-center gap-2">
            <EnvelopeClosedIcon className="h-4 w-4 opacity-80" />
            <div>
              <div className="text-base font-medium leading-none">New Newsletter</div>
              <div className={`mt-1 text-xs ${textMuted}`}>Name your newsletter issue.</div>
            </div>
          </div>

          <div className="mt-5">
            <label className={`text-xs ${textMuted}`}>Issue Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 w-full bg-transparent outline-none border-0 border-b ${
                darkMode ? "border-neutral-800 focus:border-neutral-600" : "border-neutral-200 focus:border-neutral-400"
              } pb-1`}
            />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
              }`}
              onClick={() => onSave(name)}
            >
              Save Newsletter
            </button>
            <button className="text-sm opacity-80 hover:opacity-100" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorList({
  mode,
  darkMode,
  borderClass,
  textSecondary,
  projects,
  onOpenProject,
  onOpenLongFormChoose,
  onOpenLongFormSetup,
  onOpenShortFormChoose,
  onOpenShortFormSetup,
  onOpenBlogsChoose,
  onOpenBlogsSetup,
}: {
  mode: EditorMode
  darkMode: boolean
  borderClass: string
  textSecondary: string
  projects: AEProject[]
  onOpenProject: (id: string) => void
  onOpenLongFormChoose: () => void
  onOpenLongFormSetup: () => void
  onOpenShortFormChoose: () => void
  onOpenShortFormSetup: () => void
  onOpenBlogsChoose: () => void
  onOpenBlogsSetup: () => void
}) {
  const heading = headingForMode(mode)
  const filterByTool = toolForMode(mode)
  const filtered = projects.filter((p) => (filterByTool ? p.tool === filterByTool : p.tool === "agentic"))

  function handleOpenCreator() {
    if (mode === "craft" || mode === "amplify") {
      onOpenLongFormSetup()
    } else if (mode === "highlight" || mode === "mashup") {
      onOpenShortFormSetup()
    } else if (mode === "keyword" || mode === "seo") {
      onOpenBlogsSetup()
    }
  }

  function Breadcrumbs() {
    if (mode === "craft" || mode === "amplify") {
      return (
        <nav className="text-xs">
          <button className="opacity-80 hover:opacity-100 underline" onClick={onOpenLongFormChoose}>
            Long Form
          </button>
          <span className="mx-1">›</span>
          <span className="font-medium">{heading} Projects</span>
        </nav>
      )
    } else if (mode === "highlight" || mode === "mashup") {
      return (
        <nav className="text-xs">
          <button className="opacity-80 hover:opacity-100 underline" onClick={onOpenShortFormChoose}>
            Short Form
          </button>
          <span className="mx-1">›</span>
          <span className="font-medium">{heading} Projects</span>
        </nav>
      )
    }
    // Blogs
    return (
      <nav className="text-xs">
        <button className="opacity-80 hover:opacity-100 underline" onClick={onOpenBlogsChoose}>
          Blogs
        </button>
        <span className="mx-1">›</span>
        <span className="font-medium">{heading} Projects</span>
      </nav>
    )
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Saved {heading} Projects</h2>
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-2 bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800`}
          onClick={handleOpenCreator}
          title={`New ${heading} Project`}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>New {heading}</span>
        </button>
      </div>

      <div className={`overflow-hidden rounded-md border ${borderClass}`}>
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-sm">No projects yet. Save a {heading} project to see it here.</div>
        ) : (
          <ul className={`divide-y`} style={{ borderColor: darkMode ? "#262626" : "#e5e7eb" }}>
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                    darkMode ? "hover:bg-neutral-900/40" : "hover:bg-neutral-50"
                  }`}
                  onClick={() => onOpenProject(p.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col truncate">
                      <div className="font-medium">{p.name}</div>
                      {(mode === "keyword" || mode === "seo") && p.blog ? (
                        <span className="ml-2">
                          <BlogBadge site={p.blog} size="sm" />
                        </span>
                      ) : null}
                      <div className={`text-xs ${textSecondary}`}>
                        {p.files.length} file{p.files.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EditorUpload({
  mode,
  darkMode,
  borderClass,
  textSecondary,
  project,
  onUpload,
  onDeleteFile,
  onBackToEditor,
  onOpenLongFormChoose,
  onOpenLongFormSetup,
  onOpenShortFormChoose,
  onOpenShortFormSetup,
  onToggleAmplifyFeature,
  onAmplifyProceed,
  onUpdateCraftMode,
}: {
  mode: EditorMode
  darkMode: boolean
  borderClass: string
  textSecondary: string
  project: AEProject | null
  onUpload: (files: FileList | null) => void
  onDeleteFile: (index: number) => void
  onBackToEditor: () => void
  onOpenLongFormChoose: () => void
  onOpenLongFormSetup: () => void
  onOpenShortFormChoose: () => void
  onOpenShortFormSetup: () => void
  onToggleAmplifyFeature: (feature: AmplifyFeature) => void
  onAmplifyProceed: () => void
  onUpdateCraftMode?: (mode: CraftMode) => void
}) {
  const heading = headingForMode(mode)
  const singleOnly = singleOnlyForMode(mode)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  function handleFileSelect() {
    fileInputRef.current?.click()
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    onUpload(e.target.files)
    e.target.value = "" // clear the input
  }

  const [proceeding, setProceeding] = useState(false)
  const canProceedAmplify =
    mode === "amplify" && (project?.files?.length ?? 0) > 0 && (project?.amplifyFeatures?.length ?? 0) > 0

  function handleProceed() {
    setProceeding(true)
    setTimeout(() => {
      setProceeding(false)
      onAmplifyProceed()
    }, 1000)
  }

  function Breadcrumbs() {
    if (mode === "craft" || mode === "amplify") {
      return (
        <nav className="text-xs">
          <button className="opacity-80 hover:opacity-100 underline" onClick={onOpenLongFormChoose}>
            Long Form
          </button>
          <span className="mx-1">›</span>
          <span>{heading}</span>
          <span className="mx-1">›</span>
          <button className="opacity-80 hover:opacity-100 underline" onClick={onBackToEditor}>
            {project?.name ?? "Project"}
          </button>
          <span className="mx-1">›</span>
          <span className="font-medium">Upload</span>
        </nav>
      )
    }
    return (
      <nav className="text-xs">
        <button className="opacity-80 hover:opacity-100 underline" onClick={onOpenShortFormChoose}>
          Short Form
        </button>
        <span className="mx-1">›</span>
        <span>{heading}</span>
        <span className="mx-1">›</span>
        <button className="opacity-80 hover:opacity-100 underline" onClick={onBackToEditor}>
          {project?.name ?? "Project"}
        </button>
        <span className="mx-1">›</span>
        <span className="font-medium">Upload</span>
      </nav>
    )
  }

  const [selectedCraftMode, setSelectedCraftMode] = useState<CraftMode>(project?.craftMode || "agentic")

  // Update project craft mode when changed
  useEffect(() => {
    if (mode === "craft" && project && project.craftMode !== selectedCraftMode) {
      // We need to add a callback to update the project
      onUpdateCraftMode?.(selectedCraftMode)
    }
  }, [selectedCraftMode])

  return (
    <div className="space-y-4">
      <Breadcrumbs />

      {mode === "craft" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Select Mode</div>
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCraftMode === "agentic"
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : `${borderClass} hover:bg-neutral-100`
                }`}
                onClick={() => setSelectedCraftMode("agentic")}
              >
                Agentic Editor
              </button>
              <button
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCraftMode === "youtube"
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : `${borderClass} hover:bg-neutral-100`
                }`}
                onClick={() => setSelectedCraftMode("youtube")}
              >
                YouTube Caption & Description Generator
              </button>
            </div>
          </div>
          
          {selectedCraftMode === "youtube" && (
            <div className={`rounded-md border ${borderClass} p-4 bg-neutral-50`}>
              <div className="text-sm font-medium mb-2">YouTube Tools</div>
              <p className={`text-xs ${textSecondary} mb-3`}>
                Upload your video file to automatically generate captions and descriptions optimized for YouTube.
              </p>
              <div className="text-xs space-y-1">
                <div>• Auto-generates timestamped captions</div>
                <div>• Creates SEO-optimized descriptions</div>
                <div>• Includes relevant tags and keywords</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          {project?.name ?? heading} Files ({project?.files.length ?? 0})
        </h2>
        <div className="flex items-center gap-2">
          {mode === "amplify" && (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-2 ${
                canProceedAmplify
                  ? "bg-neutral-900 text-white hover:bg-neutral-800"
                  : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
              }`}
              disabled={!canProceedAmplify || proceeding}
              onClick={handleProceed}
              title="Next"
            >
              {proceeding ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  <span>Preparing…</span>
                </>
              ) : (
                <>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  <span>Next</span>
                </>
              )}
            </button>
          )}
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-2 bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800`}
            onClick={handleFileSelect}
            title="Upload Files"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Upload Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={!singleOnly}
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>
      </div>

      {mode === "amplify" && project?.amplifyFeatures && (
        <div className="flex flex-wrap items-center gap-2">
          {AMPLIFY_FEATURES.map(({ key, label, icon: Icon }) => {
            const active = project.amplifyFeatures?.includes(key)
            return (
              <button
                key={key}
                className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-black/5 ${
                  active
                    ? "bg-green-500 text-white hover:bg-green-400"
                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                }`}
                onClick={() => onToggleAmplifyFeature(key)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
                {active && <CheckIcon className="h-3 w-3 text-white" />}
              </button>
            )
          })}
        </div>
      )}

      {proceeding && mode === "amplify" && (
        <div className={`rounded-md border ${borderClass} p-4`}>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Preparing Amplify workflows…</span>
          </div>
          <p className={`mt-2 text-xs ${textSecondary}`}>We&apos;re creating feature workspaces for your selection.</p>
        </div>
      )}

      <div className={`overflow-hidden rounded-md border ${borderClass}`}>
        {project?.files.length === 0 ? (
          <div className="px-3 py-3 text-sm">No files yet. Upload files to get started.</div>
        ) : (
          <ul className={`divide-y`} style={{ borderColor: darkMode ? "#262626" : "#e5e7eb" }}>
            {project?.files.map((f, i) => (
              <li key={i}>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex flex-col truncate">
                    <div className="font-medium">{f.name}</div>
                    <div className={`text-xs ${textSecondary}`}>{formatBytes(f.size)}</div>
                  </div>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                    onClick={() => onDeleteFile(i)}
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProjectsHomeList({
  darkMode,
  borderClass,
  textSecondary,
  aeProjects,
  onOpenProject,
}: {
  darkMode: boolean
  borderClass: string
  textSecondary: string
  aeProjects: AEProject[]
  onOpenProject: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">All Projects</h2>
      </div>

      <div className={`overflow-hidden rounded-md border ${borderClass}`}>
        {aeProjects.length === 0 ? (
          <div className="px-3 py-3 text-sm">No projects yet. Create a project to see it here.</div>
        ) : (
          <ul className={`divide-y`} style={{ borderColor: darkMode ? "#262626" : "#e5e7eb" }}>
            {aeProjects.map((p) => (
              <li key={p.id}>
                <button
                  className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                    darkMode ? "hover:bg-neutral-900/40" : "hover:bg-neutral-50"
                  }`}
                  onClick={() => onOpenProject(p.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col truncate">
                      <div className="font-medium">{p.name}</div>
                      <div className={`text-xs ${textSecondary}`}>
                        {p.files.length} file{p.files.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Newsletter Content Stream with newsfeed style and anchored add panel
 */
function NewsletterContentStream({
  darkMode,
  borderClass,
  textSecondary,
  projects,
  items,
  onAddToProject,
  onCreateNew,
  onGoHome,
}: {
  darkMode: boolean
  borderClass: string
  textSecondary: string
  projects: AEProject[]
  items: NewsletterSource[]
  onAddToProject: (projectId: string, source: NewsletterSource, checked: boolean) => void
  onCreateNew: (defaultName: string, source: NewsletterSource) => void
  onGoHome: () => void
}) {
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const [panel, setPanel] = useState<null | { source: NewsletterSource; x: number; y: number }>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanel(null)
    }
    const onClickAway = (e: MouseEvent) => {
      const t = e.target as Node
      if (panel && panelRef.current && !panelRef.current.contains(t)) {
        setPanel(null)
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClickAway)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClickAway)
    }
  }, [panel])

  function openPanel(e: React.MouseEvent, source: NewsletterSource) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPanel({ source, x: r.left + r.width / 2, y: r.bottom + 8 })
  }

  function isChecked(project: AEProject, source: NewsletterSource) {
    return (project.sources ?? []).some((s) => s.id === source.id)
  }

  const gutter = 12
  const PANEL_W = 320

  return (
    <div className="space-y-4 relative">
      <div className="text-sm font-medium">Content Stream</div>

      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border ${borderClass} p-4`}>
            <div className="flex items-start gap-3">
              <div
                className={`rounded-md px-2 py-0.5 text-[10px] uppercase ${
                  item.type === "article"
                    ? darkMode
                      ? "bg-emerald-900/40 text-emerald-200"
                      : "bg-emerald-100 text-emerald-800"
                    : item.type === "reddit"
                      ? darkMode
                        ? "bg-purple-900/40 text-purple-200"
                        : "bg-purple-100 text-purple-800"
                      : darkMode
                        ? "bg-blue-900/40 text-blue-200"
                        : "bg-blue-100 text-blue-800"
                }`}
              >
                {item.type}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className={`mt-1 text-xs ${textSecondary}`}>{item.subhead}</div>
                    <div className={`mt-1 text-[11px] ${textSecondary}`}>{formatDate(item.publishedAt)}</div>
                  </div>
                  <button
                    className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800"
                    title="Add to newsletter"
                    onClick={(e) => openPanel(e, item)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                {item.image && (
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt="Header image"
                    className="mt-3 h-48 w-full rounded-md object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {panel && (
        <div
          ref={panelRef}
          className={`fixed z-50 w-80 rounded-lg border ${borderClass} ${surfaceBg} p-3 shadow-xl`}
          style={{
            left: (() => {
              const left = panel.x - PANEL_W / 2
              const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 0) - gutter - PANEL_W
              return `${Math.max(gutter, Math.min(left, Math.max(gutter, maxLeft)))}px`
            })(),
            top: `${panel.y}px`,
          }}
        >
          <div className="flex items-center">
            <div className="text-xs font-medium">Add to Newsletter</div>
            <button
              className="ml-auto text-xs opacity-80 hover:opacity-100"
              onClick={() => setPanel(null)}
              title="Done"
            >
              Done
            </button>
          </div>
          <div className="mt-2 max-h-64 overflow-auto space-y-2">
            {projects.length === 0 ? (
              <div className={`text-xs ${textSecondary}`}>No newsletters yet.</div>
            ) : (
              projects.map((p) => {
                const checked = isChecked(p, panel.source)
                return (
                  <label key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onAddToProject(p.id, panel.source, e.target.checked)}
                    />
                    <span className="text-sm">{p.name}</span>
                    {checked && <CheckIcon className="ml-auto h-4 w-4 text-emerald-500" />}
                  </label>
                )
              })
            )}
          </div>
          <div className={`my-2 h-px ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />
          <button
            className={`w-full inline-flex items-center justify-center gap-2 rounded-md border ${borderClass} px-2 py-1 text-sm ${
              darkMode ? "hover:bg-neutral-900/60" : "hover:bg-neutral-50"
            }`}
            onClick={() => {
              onCreateNew("Newsletter Issue 1", panel.source)
              setPanel(null)
            }}
          >
            <PlusIcon className="h-4 w-4" />
            <span>New newsletter</span>
          </button>
        </div>
      )}
    </div>
  )
}

function NewsletterDetail({
  darkMode,
  borderClass,
  textSecondary,
  project,
  onBackToList,
}: {
  darkMode: boolean
  borderClass: string
  textSecondary: string
  project: AEProject | null
  onBackToList: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{project?.name}</h2>
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-2 bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800`}
          onClick={onBackToList}
          title="Back to Newsletter List"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          <span>Back to Newsletter List</span>
        </button>
      </div>

      <div className={`overflow-hidden rounded-md border ${borderClass}`}>
        {project?.sources?.length === 0 ? (
          <div className="px-3 py-3 text-sm">No content yet. Add content from the Content Stream.</div>
        ) : (
          <ul className={`divide-y`} style={{ borderColor: darkMode ? "#262626" : "#e5e7eb" }}>
            {project?.sources?.map((item) => {
              const published = new Date(item.publishedAt)
              const isToday = published.toDateString() === new Date().toDateString()
              const time = isToday
                ? published.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : published.toLocaleDateString()
              return (
                <li key={item.id}>
                  <div className={`flex w-full items-start gap-3 px-3 py-3 text-left`}>
                    {item.image && (
                      <div className="relative aspect-video h-20 w-32 shrink-0 overflow-hidden rounded-md">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="absolute inset-0 object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="font-medium">{item.title}</div>
                      <div className={`text-xs ${textSecondary}`}>{item.subhead}</div>
                      <div className={`mt-1 text-xs ${textSecondary}`}>
                        {item.type} — {time}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function NewsletterList({
  darkMode,
  borderClass,
  textSecondary,
  projects,
  onOpenProject,
  onCreateNew,
}: {
  darkMode: boolean
  borderClass: string
  textSecondary: string
  projects: AEProject[]
  onOpenProject: (id: string) => void
  onCreateNew: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Newsletters</h2>
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-2 bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800`}
          onClick={onCreateNew}
          title="Create New Newsletter"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Create New Newsletter</span>
        </button>
      </div>

      <div className={`overflow-hidden rounded-md border ${borderClass}`}>
        {projects.length === 0 ? (
          <div className="px-3 py-3 text-sm">No newsletters yet. Create a newsletter to get started.</div>
        ) : (
          <ul className={`divide-y`} style={{ borderColor: darkMode ? "#262626" : "#e5e7eb" }}>
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                    darkMode ? "hover:bg-neutral-900/40" : "hover:bg-neutral-50"
                  }`}
                  onClick={() => onOpenProject(p.id)}
                >
                  <div className="flex items-center gap-2">
                    <EnvelopeClosedIcon className="h-4 w-4 opacity-80" />
                    <div className="flex flex-col truncate">
                      <div className="font-medium">{p.name}</div>
                      <div className={`text-xs ${textSecondary}`}>
                        {p.sources?.length ?? 0} source{p.sources?.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Amplify Dashboard
 */
function AmplifyDashboard({
  project,
  darkMode,
  borderClass,
  textSecondary,
  onOpenFeature,
  onBackToUpload,
}: {
  project: AEProject | null
  darkMode: boolean
  borderClass: string
  textSecondary: string
  onOpenFeature: (f: AmplifyFeature) => void
  onBackToUpload: () => void
}) {
  const features = (project?.amplifyFeatures ?? []) as AmplifyFeature[]

  return (
    <div className="space-y-4">
      <nav className="text-xs">
        <button className="opacity-80 hover:opacity-100 underline" onClick={onBackToUpload}>
          Upload
        </button>
        <span className="mx-1">›</span>
        <span>{project?.name ?? "Project"}</span>
        <span className="mx-1">›</span>
        <span className="font-medium">Amplify</span>
      </nav>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Amplify Workflows</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {features.length === 0 ? (
          <div className={`rounded-md border ${borderClass} p-4 text-sm`}>
            No features selected. Go back to Upload and select options.
          </div>
        ) : (
          features.map((f) => {
            const meta = AMPLIFY_FEATURES.find((x) => x.key === f)!
            const Icon = meta.icon
            return (
              <div key={f} className={`rounded-xl border ${borderClass} p-4`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-neutral-100 p-2 dark:bg-neutral-900">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className={`mt-1 text-xs ${textSecondary}`}>Click to open the {meta.label} flow.</div>
                    <div className="mt-3">
                      <button
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                          darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
                        }`}
                        onClick={() => onOpenFeature(f)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * Amplify Tool View
 */
function AmplifyToolView({
  project,
  feature,
  darkMode,
  borderClass,
  textSecondary,
  onBack,
  onSaveRun,
}: {
  project: AEProject | null
  feature: AmplifyFeature | null
  darkMode: boolean
  borderClass: string
  textSecondary: string
  onBack: () => void
  onSaveRun: (run: AmplifyRun) => void
}) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [summary, setSummary] = useState<string>("")
  const [captions, setCaptions] = useState<string[]>([])
  const [description, setDescription] = useState<string>("")
  const [miniCuts, setMiniCuts] = useState<{ title: string; start: string; end: string }[]>([])
  const [sped, setSped] = useState<{ title: string; start: string; end: string; notes: string } | undefined>(undefined)
  const [miniVideo, setMiniVideo] = useState<{ title: string; start: string; end: string; notes: string } | undefined>(undefined)
  const [process, setProcess] = useState<{ 
    highlights: { title: string; start: string; end: string }[]
    openerScript: string
    closerScript: string
    recordingScript: string
  } | undefined>(undefined)

  const isMini = feature === "mini"
  const isSped = feature === "sped"
  const isMiniVideo = feature === "miniVideo"
  const isProcess = feature === "process"

  const meta = feature ? AMPLIFY_FEATURES.find((x) => x.key === feature)! : null

  async function handleRun() {
    setStatus("running")
    setSummary("")
    setCaptions([])
    setDescription("")
    setMiniCuts([])
    setSped(undefined)
    setMiniVideo(undefined)
    setProcess(undefined)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (isMini) {
      setSummary("Found 2 mini cuts")
      setMiniCuts([
        { title: "Arcads Facebook Ads", start: "1:20", end: "4:50" },
        { title: "Building Agency Vlog", start: "10:00", end: "12:30" },
      ])
    }

    if (isSped) {
      setSummary("Created sped up demo")
      setSped({
        title: "Sped Up Demo",
        start: "0:15",
        end: "0:45",
        notes: "Speed up 2x for quick overview",
      })
    }

    if (isMiniVideo) {
      setSummary("Created mini video")
      setMiniVideo({
        title: "Mini Video",
        start: "0:10",
        end: "0:30",
        notes: "Short-form version optimized for social",
      })
    }

    if (isProcess) {
      setSummary("Created process preview")
      setProcess({
        highlights: [
          { title: "Key Moment 1", start: "0:05", end: "0:15" },
          { title: "Key Moment 2", start: "0:20", end: "0:35" },
          { title: "Key Moment 3", start: "0:40", end: "0:50" },
        ],
        openerScript: "Welcome to this process overview. Let me show you the key steps...",
        closerScript: "That's how you complete this process. Thanks for watching!",
        recordingScript: "Start with step 1, then move to step 2, and finally complete with step 3.",
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStatus("done")

    const data: AmplifyOutput = {}
    if (isMini) data.miniCuts = miniCuts
    if (isSped) data.sped = sped
    if (isMiniVideo) data.miniVideo = miniVideo
    if (isProcess) data.process = process

    onSaveRun({
      id: `${Date.now()}`,
      feature: feature!,
      status: "ready",
      createdAt: new Date().toISOString(),
      summary,
      data,
    })
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs">
        <span>Upload</span>
        <span className="mx-1">›</span>
        <span>{project?.name ?? "Project"}</span>
        <span className="mx-1">›</span>
        <button className="opacity-80 hover:opacity-100 underline" onClick={onBack}>
          Amplify
        </button>
        <span className="mx-1">›</span>
        <span className="font-medium">{meta?.label}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{meta?.label}</h2>
      </div>

      <div className={`rounded-md border ${borderClass} p-4`}>
        {status === "idle" ? (
          <>
            <p className={`text-sm ${textSecondary}`}>Click Run to generate {meta?.label}.</p>
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
              }`}
              onClick={handleRun}
            >
              Run {meta?.label}
            </button>
          </>
        ) : status === "running" ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 animate-spin" />
              <span>Generating {meta?.label}…</span>
            </div>
            <p className={`mt-2 text-xs ${textSecondary}`}>This may take a few seconds.</p>
          </>
        ) : status === "done" ? (
          <>
            <div className="text-sm font-medium">Generated {meta?.label}</div>
            <div className={`mt-1 text-xs ${textSecondary}`}>{summary}</div>
          </>
        ) : (
          <div className="text-sm font-medium">Error generating {meta?.label}</div>
        )}
      </div>
    </div>
  )
}

/**
 * Blogs Modal: Keyword Research and SEO Writing Agent
 */

/**
 * SEO Writing Agent Flow
 * - Global breadcrumb: Create › Blogs › SEO Writing Agent (active)
 * - Step breadcrumb: 10 steps the user can click through
 */
function SEOAgentFlow({
  project,
  darkMode,
  borderClass,
  textSecondary,
  onBackToBlogs,
  onChangeSite,
}: {
  project: AEProject | null
  darkMode: boolean
  borderClass: string
  textSecondary: string
  onBackToBlogs: () => void
  onChangeSite: (site: BlogSiteKey) => void
}) {
  const STEPS = [
    "Keyword Input",
    "SERP Analyzer",
    "Strategy Agent",
    "Outline Agent",
    "Writer Agent",
    "Images Throughout Finder",
    "Graph Generator",
    "Header Image Generator",
    "Finalizer Agent",
  ] as const

  const [stepIndex, setStepIndex] = useState(0)
  const [keywords, setKeywords] = useState<string[]>([])
  const [serpAnalysis, setSerpAnalysis] = useState<any>(null)
  const [strategyData, setStrategyData] = useState<any>(null)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const currentSite: BlogSiteKey | undefined = project?.blog

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function prev() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const handleKeywordsConfirmed = (confirmedKeywords: string[]) => {
    setKeywords(confirmedKeywords)
    // Don't set autoAdvance here - we want to stay on SERP analyzer
  }

  const handleSerpAnalysisComplete = (analysis: any) => {
    setSerpAnalysis(analysis)
    // Don't auto-advance - user should click "Continue to Strategy"
  }

  return (
    <div className="space-y-4">
      {/* Global breadcrumb */}
      <nav className="text-xs">
        <span className="opacity-80">Create</span>
        <span className="mx-1">›</span>
        <button className="opacity-80 hover:opacity-100 underline" onClick={onBackToBlogs}>
          Blogs
        </button>
        <span className="mx-1">›</span>
        <span className="font-medium">SEO Writing Agent</span>
      </nav>

      {/* Project context */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentSite && (
            <img
              src={BLOG_SITES[currentSite].logo || "/placeholder.svg"}
              alt={`${BLOG_SITES[currentSite].name} logo`}
              className="h-6 w-6 rounded"
            />
          )}
          <h2 className="text-sm font-medium">{project?.name ?? "SEO Writing Agent Project"}</h2>
          {currentSite && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {BLOG_SITES[currentSite].short}
            </span>
          )}
        </div>

        {currentSite ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-accent">
                <img
                  src={BLOG_SITES[currentSite].logo || "/placeholder.svg"}
                  alt={`${BLOG_SITES[currentSite].name} logo`}
                  className="h-5 w-5 rounded"
                />
                <span>{BLOG_SITES[currentSite].short}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {(Object.keys(BLOG_SITES) as BlogSiteKey[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => onChangeSite(key)} className="gap-2">
                  <img
                    src={BLOG_SITES[key].logo || "/placeholder.svg"}
                    alt={`${BLOG_SITES[key].name} logo`}
                    className="h-5 w-5 rounded"
                  />
                  <span>{BLOG_SITES[key].name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* Step breadcrumb / stepper */}
      <div className={`overflow-auto rounded-md border ${borderClass} p-2`}>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <button
                className={`rounded-md px-2 py-1 text-xs ${
                  idx === stepIndex
                    ? darkMode
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-900 text-white"
                    : darkMode
                      ? "hover:bg-neutral-900/60"
                      : "hover:bg-neutral-50"
                }`}
                onClick={() => setStepIndex(idx)}
                aria-current={idx === stepIndex ? "step" : undefined}
              >
                {idx + 1}. {label}
              </button>
              {idx < STEPS.length - 1 && <span className={`mx-2 text-xs ${textSecondary}`}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className={`rounded-md border ${borderClass} p-4`}>
        {stepIndex === 0 && (
          <KeywordInput 
            darkMode={darkMode} 
            textSecondary={textSecondary}
            onKeywordsConfirmed={handleKeywordsConfirmed}
            onNext={next}
          />
        )}
        {stepIndex === 1 && (
          <SerpAnalyzer
            darkMode={darkMode}
            textSecondary={textSecondary}
            keywords={keywords}
            existingAnalysis={serpAnalysis}
            onAnalysisComplete={handleSerpAnalysisComplete}
            onNext={next}
          />
        )}
        {stepIndex === 2 && (
          <StrategyAgent
            darkMode={darkMode}
            textSecondary={textSecondary}
            keywords={keywords}
            serpAnalysis={serpAnalysis}
            existingStrategy={strategyData}
            onStrategyComplete={(strategy) => {
              console.log('Strategy generated:', strategy)
              setStrategyData(strategy)
            }}
            onNext={next}
          />
        )}
        {stepIndex === 3 && (
          <SEOOutlineAgent 
            darkMode={darkMode} 
            textSecondary={textSecondary}
          />
        )}
        {stepIndex === 4 && <SEOWriterAgent darkMode={darkMode} textSecondary={textSecondary} />}
        {stepIndex === 5 && <SEOImagesThroughout darkMode={darkMode} textSecondary={textSecondary} />}
        {stepIndex === 6 && <SEOGraphGenerator darkMode={darkMode} textSecondary={textSecondary} />}
        {stepIndex === 7 && <SEOHeaderImageGenerator darkMode={darkMode} textSecondary={textSecondary} />}
        {stepIndex === 8 && <SEOFinalizerAgent darkMode={darkMode} textSecondary={textSecondary} />}

        {stepIndex > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                stepIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : darkMode
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-900 text-white"
              }`}
              disabled={stepIndex === 0}
              onClick={prev}
            >
              Previous
            </button>
            <div className={`text-xs ${textSecondary}`}>
              Step {stepIndex + 1} of {STEPS.length}
            </div>
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                stepIndex === STEPS.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : darkMode
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-900 text-white"
              }`}
              disabled={stepIndex === STEPS.length - 1}
              onClick={next}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { KeywordInput } from '@/components/seo/KeywordInput'
import { SerpAnalyzer } from '@/components/seo/SerpAnalyzer'
import { RichTextEditor } from '@/components/seo/RichTextEditor'
import { StrategyAgent } from '@/components/seo/StrategyAgent'

function SEOStrategyAgent({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Strategy Agent</div>
      <p className={`text-xs ${textSecondary}`}>
        Generate a content strategy tailored to the chosen keyword and audience.
      </p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Strategy preview will appear here.</div>
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"}`}
        >
          Generate Strategy
        </button>
        <button className={`rounded-md px-3 py-1.5 text-xs ${darkMode ? "bg-neutral-900/50" : "bg-neutral-100"}`}>
          Edit Settings
        </button>
      </div>
    </div>
  )
}

function SEOOutlineAgent({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Outline Agent</div>
      <p className={`text-xs ${textSecondary}`}>
        Draft a comprehensive outline with H2/H3 structure and talking points.
      </p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Outline will appear here.</div>
      </div>
      <button
        className={`rounded-md px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"}`}
      >
        Generate Outline
      </button>
    </div>
  )
}

function SEOWriterAgent({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Writer Agent</div>
      <p className={`text-xs ${textSecondary}`}>Create a first draft aligned with the outline and strategy.</p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Draft will render here.</div>
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"}`}
        >
          Generate Draft
        </button>
        <button className={`rounded-md px-3 py-1.5 text-xs ${darkMode ? "bg-neutral-900/50" : "bg-neutral-100"}`}>
          Adjust Tone
        </button>
      </div>
    </div>
  )
}

function SEOImagesThroughout({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Images Throughout Finder</div>
      <p className={`text-xs ${textSecondary}`}>Suggest images to insert throughout the article with alt text.</p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Inline image suggestions will appear here.</div>
      </div>
    </div>
  )
}

function SEOGraphGenerator({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Graph Generator</div>
      <p className={`text-xs ${textSecondary}`}>Generate simple charts/graphs to support the narrative.</p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Graph ideas and previews will appear here.</div>
      </div>
    </div>
  )
}

function SEOHeaderImageGenerator({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Header Image Generator</div>
      <p className={`text-xs ${textSecondary}`}>Propose header image concepts and aspect ratios for the blog.</p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Header image suggestions will appear here.</div>
      </div>
    </div>
  )
}

function SEOFinalizerAgent({ darkMode, textSecondary }: { darkMode: boolean; textSecondary: string }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Finalizer Agent</div>
      <p className={`text-xs ${textSecondary}`}>Polish, check links and citations, and prepare for publish.</p>
      <div className={`rounded-md border ${darkMode ? "border-neutral-800" : "border-neutral-200"} p-3`}>
        <div className={`text-xs ${textSecondary}`}>Final checks and export options will appear here.</div>
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"}`}
        >
          Export Draft
        </button>
        <button className={`rounded-md px-3 py-1.5 text-xs ${darkMode ? "bg-neutral-900/50" : "bg-neutral-100"}`}>
          Open Preview
        </button>
      </div>
    </div>
  )
}

/**
 * Blogs Modal: Keyword Research and SEO Writing Agent
 */

function BlogsModal({
  darkMode,
  onClose,
  borderClass,
  hoverFill,
  onBackToCreate,
  startStep = "choose",
  startMode = "keyword",
  onSave,
}: {
  darkMode: boolean
  onClose: () => void
  borderClass: string
  hoverFill: string
  onBackToCreate: () => void
  startStep?: "choose" | "setup"
  startMode?: "keyword" | "seo"
  onSave: (kind: "keyword" | "seo", name: string, site: BlogSiteKey) => void
}) {
  const overlayBg = darkMode ? "bg-black/60" : "bg-neutral-900/20"
  const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
  const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"

  const keywordInfo =
    "Research keywords to find the best topics for your blog. This tool will help you find the best keywords to target for your blog."
  const seoInfo =
    "Create SEO-optimized content for your blog. This tool will help you create content that is optimized for search engines."

  const [step, setStep] = useState<"choose" | "setup">(startStep)
  const [mode, setMode] = useState<"keyword" | "seo">(startMode)
  useEffect(() => setStep(startStep), [startStep])
  useEffect(() => setMode(startMode), [startMode])

  const [popover, setPopover] = useState<null | { id: string; x: number; y: number; text: string }>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  function openPopover(e: React.MouseEvent, id: string, text: string) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (popover && popover.id === id) {
      setPopover(null)
      return
    }
    setPopover({ id, x: rect.left + rect.width / 2, y: rect.bottom + 6, text })
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const nameRef = useRef<HTMLInputElement | null>(null)
  const defaultName = mode === "keyword" ? "Keyword Research Project 1" : "SEO Writing Agent Project 1"
  const [projectName, setProjectName] = useState<string>(defaultName)
  useEffect(() => {
    if (step === "setup") {
      requestAnimationFrame(() => {
        nameRef.current?.focus()
        nameRef.current?.select()
      })
    }
  }, [step])
  useEffect(() => {
    if (step === "setup") {
      setProjectName(mode === "keyword" ? "Keyword Research Project 1" : "SEO Writing Agent Project 1")
    }
  }, [mode]) // eslint-disable-line

  const [selectedSite, setSelectedSite] = useState<BlogSiteKey>("clearhaven")

  function handleModalContentClick(e: React.MouseEvent) {
    e.stopPropagation()
    const t = e.target as Node
    if (popover && !popoverRef.current?.contains(t)) {
      setPopover(null)
    }
  }

  const heading = mode === "keyword" ? "Keyword Research" : "SEO Writing Agent"

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`}
      onClick={() => setPopover(null)}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl border ${borderClass} ${surfaceBg} shadow-xl`}
        onClick={handleModalContentClick}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "inherit" }}>
          <nav className="text-xs">
            <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={onBackToCreate}>
              Create
            </button>
            <span className="mx-1">›</span>
            {step === "setup" ? (
              <>
                <button className="opacity-80 hover:opacity-100 cursor-pointer" onClick={() => setStep("choose")}>
                  Blogs
                </button>
                <span className="mx-1">›</span>
                <span className="font-medium">{heading}</span>
              </>
            ) : (
              <span className="font-medium">Blogs</span>
            )}
          </nav>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                onClick={() => {
                  setMode("keyword")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-base md:text-lg font-semibold tracking-tight">Keyword Research</div>
                  <button
                    type="button"
                    aria-label="More info"
                    className="cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                    onClick={(e) => openPopover(e, "sf-keyword", keywordInfo)}
                  >
                    <Info className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </div>
              </button>

              <button
                onClick={() => {
                  setMode("seo")
                  setStep("setup")
                }}
                className={`cursor-default rounded-xl border ${borderClass} p-4 md:p-5 text-left ${hoverFill}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-base md:text-lg font-semibold tracking-tight">SEO Writing Agent</div>
                  <button
                    type="button"
                    aria-label="More info"
                    className="cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                    onClick={(e) => openPopover(e, "sf-seo", seoInfo)}
                  >
                    <Info className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="mt-1 flex items-center gap-2">
              <FileText className="h-4 w-4 opacity-80" />
              <div>
                <div className="text-base font-medium leading-none">{heading}</div>
                <div className={`mt-1 text-xs ${textMuted}`}>Name your project to get started.</div>
              </div>
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setPopover({
                    id: "sf-setup-head",
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 6,
                    text: mode === "keyword" ? keywordInfo : seoInfo,
                  })
                }}
                className="ml-auto cursor-pointer opacity-70 hover:opacity-100"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5">
              <label className={`text-xs ${textMuted}`}>Project Name</label>
              <input
                ref={nameRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`mt-1 w-full bg-transparent outline-none border-0 border-b ${
                  darkMode
                    ? "border-neutral-800 focus:border-neutral-600"
                    : "border-neutral-200 focus:border-neutral-400"
                } pb-1`}
              />
            </div>

            <div className="mt-5">
              <label className={`text-xs ${textMuted}`}>Blog Site</label>
              <div className="flex gap-2">
                {(Object.keys(BLOG_SITES) as BlogSiteKey[]).map((key) => {
                  const meta = BLOG_SITES[key]
                  const active = selectedSite === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSite(key)}
                      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-all ${
                        active
                          ? `ring-2 ring-offset-1 ${darkMode ? "ring-white bg-neutral-800 text-white ring-offset-neutral-950" : "ring-neutral-900 bg-neutral-100 text-neutral-900 ring-offset-white"}`
                          : `${darkMode ? "hover:bg-neutral-800 border-neutral-700 text-neutral-200" : "hover:bg-neutral-100 border-neutral-300 text-neutral-700"}`
                      }`}
                    >
                      <img
                        src={meta.logo || "/placeholder.svg"}
                        alt={`${meta.name} logo`}
                        className="h-5 w-5 rounded"
                      />
                      <span>{meta.short}</span>
                      {active && <CheckIcon className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
                }`}
                onClick={() => onSave(mode, projectName, selectedSite)}
              >
                Save {heading} Project
              </button>
              <button className="text-sm opacity-80 hover:opacity-100" onClick={() => setStep("choose")}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {popover && (
          <div
            ref={popoverRef}
            className={`fixed z-[60] w-80 rounded-md border ${borderClass} ${surfaceBg} p-3 text-xs shadow-xl`}
            style={{
              left: (() => {
                const gutter = 12
                const PANEL_W = 320
                const left = popover.x - PANEL_W / 2
                const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 0) - gutter - PANEL_W
                return `${Math.max(gutter, Math.min(left, Math.max(gutter, maxLeft)))}px`
              })(),
              top: `${popover.y}px`,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: popover.text }} />
          </div>
        )}
      </div>
    </div>
  )
}

// -----------------------------
// Root Component
// -----------------------------

export default function Page() {
  const [active, setActive] = useState<string>("home")
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [showCreate, setShowCreate] = useState<boolean>(false)

  // Long Form modal
  const [showLongForm, setShowLongForm] = useState<boolean>(false)
  const [longFormStartStep, setLongFormStartStep] = useState<"choose" | "setup">("choose")
  const [longFormStartMode, setLongFormStartMode] = useState<"craft" | "amplify">("craft")

  // Short Form modal
  const [showShortForm, setShowShortForm] = useState<boolean>(false)
  const [shortFormStartStep, setShortFormStartStep] = useState<"choose" | "setup">("choose")
  const [shortFormStartMode, setShortFormStartMode] = useState<"highlight" | "mashup">("highlight")

  // Newsletter modal
  const [showNewsletter, setShowNewsletter] = useState<boolean>(false)
  const [newsletterDefaultName, setNewsletterDefaultName] = useState<string>("Newsletter Issue 1")
  const [queuedSourceToAdd, setQueuedSourceToAdd] = useState<NewsletterSource | null>(null)

  // Blogs modal (NEW)
  const [showBlogs, setShowBlogs] = useState<boolean>(false)
  const [blogsStartStep, setBlogsStartStep] = useState<"choose" | "setup">("choose")
  const [blogsStartMode, setBlogsStartMode] = useState<"keyword" | "seo">("keyword")

  // Editor state
  const [editorView, setEditorView] = useState<boolean>(false)
  const [editorSubView, setEditorSubView] = useState<
    "list" | "upload" | "stream" | "detail" | "amplify" | "amplify-tool" | "seo-flow"
  >("list")
  const [editorMode, setEditorMode] = useState<EditorMode>("craft")
  const [newsletterTab, setNewsletterTab] = useState<"home" | "stream">("home")
  const [amplifyFeatureView, setAmplifyFeatureView] = useState<AmplifyFeature | null>(null)

  const [aeProjects, setAeProjects] = useState<AEProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [homePanelOpen, setHomePanelOpen] = useState<boolean>(false)

  const { toast } = useToast()

  const bgClass = darkMode ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900"
  const panelBg = darkMode ? "bg-neutral-950/60" : "bg-white"
  const borderClass = darkMode ? "border-neutral-900/80" : "border-neutral-200"
  const hoverFill = darkMode ? "hover:bg-neutral-900/70" : "hover:bg-neutral-100"
  const activeBg = darkMode ? "bg-neutral-800/80 text-white" : "bg-neutral-200 text-neutral-900"
  const textSecondary = darkMode ? "text-neutral-300" : "text-neutral-600"

  // Amplify setup dialog state (unused in UI here)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<AmplifyFeatureKey[]>([])
  const [currentTool, setCurrentTool] = useState<AmplifyFeatureKey | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [isLoadingNext, setIsLoadingNext] = useState(false)

  // Setup dialog local state for the sample info popover
  const [tempProjectName, setTempProjectName] = useState("")
  const [tempFeatures, setTempFeatures] = useState<Record<AmplifyFeatureKey, boolean>>({
    miniCuts: false,
    sped: false,
    miniVideo: false,
    process: false,
  })
  const [uploads, setUploads] = useState<Array<{ name: string; size: number; date: number }>>([])
  const [infoOpen, setInfoOpen] = useState(false)
  const infoBtnRef = useRef<HTMLButtonElement | null>(null)

  const canContinue = useMemo(() => {
    const hasFeature = Object.values(tempFeatures).some(Boolean)
    const hasUpload = uploads.length > 0
    return hasFeature && hasUpload
  }, [tempFeatures, uploads])

  function resetToDashboard() {
    setCurrentTool(null)
  }

  function openTool(tool: AmplifyFeatureKey) {
    setCurrentTool(tool)
  }

  function toggleFeature(key: AmplifyFeatureKey) {
    setTempFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function onFilesSelected(files: FileList | null) {
    if (!files) return
    const now = Date.now()
    const next = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      date: now,
    }))
    setUploads((prev) => [...prev, ...next])
  }

  function removeUpload(idx: number) {
    setUploads((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onNextFromSetup() {
    if (!canContinue) return
    setIsLoadingNext(true)
    await new Promise((r) => setTimeout(r, 1000))
    const selected = Object.entries(tempFeatures)
      .filter(([, v]) => v)
      .map(([k]) => k as AmplifyFeatureKey)
    setSelectedFeatures(selected)
    setProjectName(tempProjectName.trim() || "Untitled Project")
    setShowSetup(false)
    setIsLoadingNext(false)
    setTempProjectName("")
  }

  // Save Craft
  function onSaveCraftProject(name: string) {
    const id = `${Date.now()}`
    const newProject: AEProject = {
      id,
      name: name.trim() || "Agentic Editor Project",
      category: "longform",
      tool: "agentic",
      files: [],
    }
    setAeProjects((prev) => [...prev, newProject])
    setSelectedProjectId(null)
    setShowLongForm(false)
    setShowCreate(false)
    setEditorMode("craft")
    setEditorView(true)
    setEditorSubView("list")
    setActive("projects")
  }

  // Save Amplify
  function onSaveAmplifyProject(name: string) {
    const id = `${Date.now()}`
    const newProject: AEProject = {
      id,
      name: name.trim() || "Amplify Project",
      category: "longform",
      tool: "amplify",
      files: [],
      amplifyFeatures: [],
      amplifyResults: [],
    }
    setAeProjects((prev) => [...prev, newProject])
    setSelectedProjectId(null)
    setShowLongForm(false)
    setShowCreate(false)
    setEditorMode("amplify")
    setEditorView(true)
    setEditorSubView("list")
    setActive("projects")
  }

  // Save Short-Form (Highlight or Mashup)
  function onSaveShortFormProject(kind: "highlight" | "mashup", name: string) {
    const id = `${Date.now()}`
    const newProject: AEProject = {
      id,
      name: name.trim() || (kind === "highlight" ? "Highlight Finder Project" : "Mashup Maker Project"),
      category: "shortform",
      tool: kind,
      files: [],
    }
    setAeProjects((prev) => [...prev, newProject])
    setSelectedProjectId(null)
    setShowShortForm(false)
    setShowCreate(false)
    setEditorMode(kind)
    setEditorView(true)
    setEditorSubView("list")
    setActive("projects")
  }

  function onSaveBlogsProject(kind: "keyword" | "seo", name: string, site: BlogSiteKey) {
    const id = `${Date.now()}`
    const newProject: AEProject = {
      id,
      name: name.trim() || (kind === "keyword" ? "Keyword Research Project" : "SEO Writing Agent Project"),
      category: "blogs",
      tool: kind,
      blog: site,
      files: [],
    }
    setAeProjects((prev) => [...prev, newProject])
    setSelectedProjectId(null)
    setShowBlogs(false)
    setShowCreate(false)
    setEditorMode(kind)
    setEditorView(true)
    setEditorSubView(kind === "seo" ? "seo-flow" : "list")
    setActive("projects")
  }

  // Save Newsletter
  function onSaveNewsletterProject(name: string, sourceToAttach?: NewsletterSource | null) {
    const id = `${Date.now()}`
    const newProject: AEProject = {
      id,
      name: name.trim() || "Newsletter Issue",
      category: "newsletter",
      tool: "issues",
      files: [],
      sources: sourceToAttach ? [sourceToAttach] : [],
    }
    setAeProjects((prev) => [...prev, newProject])
    setSelectedProjectId(null)
    setShowNewsletter(false)
    setShowCreate(false)
    setQueuedSourceToAdd(null)
    setEditorMode("newsletter")
    setEditorView(true)
    setEditorSubView("list")
    setNewsletterTab("home")
    setActive("projects")
    if (sourceToAttach) {
      toast({
        title: "Added to new newsletter",
        description: `“${sourceToAttach.title}” added to ${newProject.name}`,
      })
    }
  }

  // Handle uploads
  function handleFilesSelected(projectId: string, files: FileList | null, limit = Number.POSITIVE_INFINITY) {
    if (!files || files.length === 0) return
    const toAdd = Array.from(files)
      .slice(0, limit)
      .map((f) => ({ name: f.name, size: f.size }))
    setAeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        if (limit === 1 && p.files.length >= 1) return p
        return { ...p, files: [...p.files, ...toAdd] }
      }),
    )
  }

  function deleteFile(projectId: string, index: number) {
    setAeProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, files: p.files.filter((_, i) => i !== index) } : p)),
    )
  }

  function toggleAmplifyFeature(projectId: string, feature: AmplifyFeature) {
    setAeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const set = new Set(p.amplifyFeatures ?? [])
        if (set.has(feature)) set.delete(feature)
        else set.add(feature)
        return { ...p, amplifyFeatures: Array.from(set) }
      }),
    )
  }

  function addSourceToNewsletter(projectId: string, source: NewsletterSource, checked: boolean) {
    setAeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const current = p.sources ?? []
        const exists = current.some((s) => s.id === source.id)
        if (checked && !exists) {
          return { ...p, sources: [...current, source] }
        } else if (!checked && exists) {
          return { ...p, sources: current.filter((s) => s.id !== source.id) }
        }
        return p
      }),
    )
    toast({
      title: checked ? "Added to newsletter" : "Removed from newsletter",
      description: `“${source.title}” ${checked ? "added to" : "removed from"} ${
        aeProjects.find((p) => p.id === projectId)?.name ?? "newsletter"
      }`,
    })
  }

  function openProjectInEditor(projectId: string) {
    const p = aeProjects.find((x) => x.id === projectId)
    if (!p) return
    if (p.category === "newsletter") {
      setEditorMode("newsletter")
      setEditorView(true)
      setEditorSubView("detail")
      setSelectedProjectId(projectId)
      setNewsletterTab("home")
      setActive("projects")
      setHomePanelOpen(false)
      return
    }
    const mode: EditorMode =
      p.tool === "amplify" || p.tool === "highlight" || p.tool === "mashup" || p.tool === "keyword" || p.tool === "seo"
        ? (p.tool as EditorMode)
        : "craft"
    setEditorMode(mode)
    setEditorView(true)
    setEditorSubView(p.tool === "seo" ? "seo-flow" : "upload")
    setSelectedProjectId(projectId)
    setActive("projects")
    setHomePanelOpen(false)
  }

  // Proceed Amplify
  function proceedAmplify(projectId: string) {
    setEditorSubView("amplify")
    setAmplifyFeatureView(null)
  }

  function updateCraftMode(projectId: string, mode: CraftMode) {
    setAeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return { ...p, craftMode: mode }
      })
    )
  }

  function upsertAmplifyResult(projectId: string, run: AmplifyRun) {
    setAeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const current = p.amplifyResults ?? []
        const idx = current.findIndex((r) => r.feature === run.feature)
        const next = [...current]
        if (idx >= 0) next[idx] = run
        else next.push(run)
        return { ...p, amplifyResults: next }
      }),
    )
  }

  const selectedProject = aeProjects.find((p) => p.id === selectedProjectId) || null
  const editorTitle = headingForMode(editorMode)
  const newsletterProjects = useMemo(() => aeProjects.filter((p) => p.category === "newsletter"), [aeProjects])

  const breadcrumbLabels = useMemo(() => {
    const base = ["Upload", "Amplify"]
    const parts = currentTool
      ? [...base, projectName ?? undefined, AMPLIFY_FEATURES_MOCK.find((f) => f.key === currentTool)?.label]
      : projectName
        ? [...base, projectName]
        : base
    return buildBreadcrumbLabels(parts)
  }, [projectName, currentTool])

  return (
    <div className={`flex h-screen w-full ${bgClass}`}>
      {/* LEFT RAIL + (optional) HOME DRAWER + MAIN */}
      <aside
        className={`flex flex-col border-r ${borderClass} backdrop-blur transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Top area in Editor */}
        {editorView ? (
          <div className="flex items-center gap-1 px-3 py-4">
            <button
              aria-label="Open Home panel"
              onClick={() => setHomePanelOpen((v) => !v)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${hoverFill}`}
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {homePanelOpen && (
              <button
                aria-label="Close Home panel"
                onClick={() => setHomePanelOpen(false)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${hoverFill}`}
                title="Collapse"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center px-3 py-4">
            {/* Modern circular black Create button */}
            <button
              aria-label="Create"
              onClick={() => setShowCreate(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              title="Create"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Editor-specific grouped nav or generic */}
        {editorView ? (
          <EditorLeftNav
            activeMode={editorMode}
            newsletterTab={newsletterTab}
            onSelectMode={(k) => {
              if (isEditorMode(k)) {
                setEditorMode(k)
                setEditorSubView(k === "seo" ? "seo-flow" : "list")
                setSelectedProjectId(null)
              }
            }}
            onSelectNewsletterTab={(tab) => {
              setNewsletterTab(tab)
              setEditorSubView(tab === "home" ? "list" : "stream")
              setSelectedProjectId(null)
            }}
            collapsed={collapsed}
            activeBg={activeBg}
            hoverFill={hoverFill}
            textSecondary={textSecondary}
            borderClass={borderClass}
            darkMode={darkMode}
          />
        ) : (
          <>
            <NavGroup
              items={PRIMARY}
              active={active}
              onSelect={(k) => setActive(k)}
              collapsed={collapsed}
              activeBg={activeBg}
              hoverFill={hoverFill}
              textSecondary={textSecondary}
            />
            <div className={`mx-3 my-2 h-px ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />
            <NavGroup
              items={FEATURES}
              active={active}
              onSelect={(k) => setActive(k)}
              collapsed={collapsed}
              activeBg={activeBg}
              hoverFill={hoverFill}
              textSecondary={textSecondary}
            />
          </>
        )}

        {/* Footer icons */}
        <div className="mt-auto px-2 py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className={`inline-flex h-8 w-8 items-center justify-center opacity-70 ${
                darkMode ? "hover:text-white" : "hover:text-neutral-900"
              } hover:opacity-100`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className={`inline-flex h-8 w-8 items-center justify-center opacity-70 ${
                darkMode ? "hover:text-white" : "hover:text-neutral-900"
              } hover:opacity-100`}
              aria-label="Toggle theme"
              title="Toggle light/dark mode"
            >
              {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Home drawer that PUSHES content to the right */}
      {editorView && (
        <div
          className={`transition-[width] duration-200 overflow-hidden border-r ${borderClass}`}
          style={{ width: homePanelOpen ? (collapsed ? 208 : 256) : 0, order: -1 }}
        >
          {homePanelOpen && (
            <div className={`h-full ${panelBg} p-2`}>
              {/* Top bar with Create (+) */}
              <div className="flex items-center justify-between px-1 pb-2">
                <div className={`text-xs ${textSecondary}`}>Home</div>
                <button
                  aria-label="Create"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-800"
                  title="Create"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col">
                {[...PRIMARY, ...FEATURES].map(({ key, label, icon: Icon }) => (
                  <button
                    key={`quick-${key}`}
                    className={`group flex items-center ${
                      collapsed ? "justify-center" : "gap-3"
                    } rounded-lg px-2 py-2 text-[13px] ${textSecondary} ${hoverFill}`}
                    onClick={() => {
                      setActive(key)
                      setEditorView(false)
                      setEditorSubView("list")
                      setSelectedProjectId(null)
                      setHomePanelOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`flex items-center justify-between gap-3 border-b ${borderClass} px-5 py-3 backdrop-blur`}>
          <div className="min-w-0">
            <div className={`truncate text-xs uppercase tracking-wide ${textSecondary}`}>PerSimmons Super App</div>
            <h1 className="truncate text-base font-medium tracking-[-0.01em]">
              {editorView ? editorTitle : labelFor(active)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {editorView && (editorMode === "seo" || editorMode === "keyword") && selectedProject?.blog ? (
              <BlogBadge site={selectedProject.blog} size="sm" />
            ) : null}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          {!editorView ? (
            active === "projects" ? (
              <ProjectsHomeList
                darkMode={darkMode}
                borderClass={borderClass}
                textSecondary={textSecondary}
                aeProjects={aeProjects}
                onOpenProject={openProjectInEditor}
              />
            ) : active === "voiceEmulator" ? (
              <VoiceEmulator
                darkMode={darkMode}
                borderClass={borderClass}
                textSecondary={textSecondary}
              />
            ) : (
              <section className={`rounded-xl border ${borderClass} ${panelBg} p-6`}>
                <p className={`text-sm ${textSecondary}`}>
                  Design surface for{" "}
                  <span className={darkMode ? "text-white" : "text-neutral-900"}>{labelFor(active)}</span>.
                </p>
              </section>
            )
          ) : editorMode === "newsletter" ? (
            editorSubView === "stream" ? (
              <NewsletterContentStream
                darkMode={darkMode}
                borderClass={borderClass}
                textSecondary={textSecondary}
                projects={newsletterProjects}
                items={RSS_ITEMS}
                onAddToProject={addSourceToNewsletter}
                onCreateNew={(defaultName, source) => {
                  setNewsletterDefaultName(defaultName)
                  setQueuedSourceToAdd(source)
                  setShowNewsletter(true)
                }}
                onGoHome={() => {
                  setNewsletterTab("home")
                  setEditorSubView("list")
                }}
              />
            ) : editorSubView === "detail" ? (
              <NewsletterDetail
                darkMode={darkMode}
                borderClass={borderClass}
                textSecondary={textSecondary}
                project={selectedProject}
                onBackToList={() => {
                  setEditorSubView("list")
                  setSelectedProjectId(null)
                }}
              />
            ) : (
              <NewsletterList
                darkMode={darkMode}
                borderClass={borderClass}
                textSecondary={textSecondary}
                projects={newsletterProjects}
                onOpenProject={(id) => {
                  setSelectedProjectId(id)
                  setEditorSubView("detail")
                }}
                onCreateNew={() => {
                  setQueuedSourceToAdd(null)
                  setNewsletterDefaultName(suggestNextIssueName(newsletterProjects))
                  setShowNewsletter(true)
                }}
              />
            )
          ) : editorMode === "seo" && editorSubView === "seo-flow" ? (
            <SEOAgentFlow
              project={selectedProject}
              darkMode={darkMode}
              borderClass={borderClass}
              textSecondary={textSecondary}
              onBackToBlogs={() => {
                setEditorMode("seo")
                setEditorSubView("list")
                setSelectedProjectId(null)
              }}
              onChangeSite={(site) => {
                if (!selectedProject) return
                setAeProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? { ...p, blog: site } : p)))
              }}
            />
          ) : editorSubView === "list" ? (
            <EditorList
              mode={editorMode}
              darkMode={darkMode}
              borderClass={borderClass}
              textSecondary={textSecondary}
              projects={aeProjects}
              onOpenProject={(id) => {
                setSelectedProjectId(id)
                setEditorSubView(editorMode === "seo" ? "seo-flow" : "upload")
              }}
              onOpenLongFormChoose={() => {
                setLongFormStartMode(editorMode === "amplify" ? "amplify" : "craft")
                setLongFormStartStep("choose")
                setShowLongForm(true)
              }}
              onOpenLongFormSetup={() => {
                setLongFormStartMode(editorMode === "amplify" ? "amplify" : "craft")
                setLongFormStartStep("setup")
                setShowLongForm(true)
              }}
              onOpenShortFormChoose={() => {
                setShortFormStartMode(editorMode === "mashup" ? "mashup" : "highlight")
                setShortFormStartStep("choose")
                setShowShortForm(true)
              }}
              onOpenShortFormSetup={() => {
                setShortFormStartMode(editorMode === "mashup" ? "mashup" : "highlight")
                setShortFormStartStep("setup")
                setShowShortForm(true)
              }}
              onOpenBlogsChoose={() => {
                setBlogsStartMode(editorMode === "seo" ? "seo" : "keyword")
                setBlogsStartStep("choose")
                setShowBlogs(true)
              }}
              onOpenBlogsSetup={() => {
                setBlogsStartMode(editorMode === "seo" ? "seo" : "keyword")
                setBlogsStartStep("setup")
                setShowBlogs(true)
              }}
            />
          ) : editorSubView === "upload" ? (
            <EditorUpload
              mode={editorMode}
              darkMode={darkMode}
              borderClass={borderClass}
              textSecondary={textSecondary}
              project={selectedProject}
              onUpload={(files) =>
                selectedProject &&
                handleFilesSelected(
                  selectedProject.id,
                  files,
                  singleOnlyForMode(editorMode) ? 1 : Number.POSITIVE_INFINITY,
                )
              }
              onDeleteFile={(index) => selectedProject && deleteFile(selectedProject.id, index)}
              onBackToEditor={() => {
                setEditorSubView("list")
                setSelectedProjectId(null)
              }}
              onOpenLongFormChoose={() => {
                setLongFormStartMode(editorMode === "amplify" ? "amplify" : "craft")
                setLongFormStartStep("choose")
                setShowLongForm(true)
              }}
              onOpenLongFormSetup={() => {
                setLongFormStartMode(editorMode === "amplify" ? "amplify" : "craft")
                setLongFormStartStep("setup")
                setShowLongForm(true)
              }}
              onOpenShortFormChoose={() => {
                setShortFormStartMode(editorMode === "mashup" ? "mashup" : "highlight")
                setShortFormStartStep("choose")
                setShowShortForm(true)
              }}
              onOpenShortFormSetup={() => {
                setShortFormStartMode(editorMode === "mashup" ? "mashup" : "highlight")
                setShortFormStartStep("setup")
                setShowShortForm(true)
              }}
              onToggleAmplifyFeature={(feature) => selectedProject && toggleAmplifyFeature(selectedProject.id, feature)}
              onAmplifyProceed={() => selectedProject && proceedAmplify(selectedProject.id)}
              onUpdateCraftMode={(mode) => selectedProject && updateCraftMode(selectedProject.id, mode)}
            />
          ) : editorSubView === "amplify" ? (
            <AmplifyDashboard
              project={selectedProject}
              darkMode={darkMode}
              borderClass={borderClass}
              textSecondary={textSecondary}
              onOpenFeature={(f) => {
                setAmplifyFeatureView(f)
                setEditorSubView("amplify-tool")
              }}
              onBackToUpload={() => setEditorSubView("upload")}
            />
          ) : (
            <AmplifyToolView
              project={selectedProject}
              feature={amplifyFeatureView}
              darkMode={darkMode}
              borderClass={borderClass}
              textSecondary={textSecondary}
              onBack={() => setEditorSubView("amplify")}
              onSaveRun={(run) => selectedProject && upsertAmplifyResult(selectedProject.id, run)}
            />
          )}
        </main>
      </div>

      {/* Create & Modals */}
      {showCreate && (
        <CreateModal
          darkMode={darkMode}
          onClose={() => setShowCreate(false)}
          borderClass={borderClass}
          onSelectLongForm={() => {
            setShowCreate(false)
            setLongFormStartMode("craft")
            setLongFormStartStep("choose")
            setShowLongForm(true)
          }}
          onSelectShortForm={() => {
            setShowCreate(false)
            setShortFormStartMode("highlight")
            setShortFormStartStep("choose")
            setShowShortForm(true)
          }}
          onSelectNewsletter={() => {
            setShowCreate(false)
            setNewsletterDefaultName(suggestNextIssueName(newsletterProjects))
            setQueuedSourceToAdd(null)
            setShowNewsletter(true)
          }}
          onSelectBlogs={() => {
            setShowCreate(false)
            setBlogsStartMode("keyword")
            setBlogsStartStep("choose")
            setShowBlogs(true)
          }}
        />
      )}

      {showLongForm && (
        <LongFormModal
          darkMode={darkMode}
          onClose={() => setShowLongForm(false)}
          borderClass={borderClass}
          hoverFill={hoverFill}
          startStep={longFormStartStep}
          startMode={longFormStartMode}
          onBackToCreate={() => {
            setShowLongForm(false)
            setShowCreate(true)
          }}
          onSaveCraftProject={onSaveCraftProject}
          onSaveAmplifyProject={onSaveAmplifyProject}
        />
      )}

      {showShortForm && (
        <ShortFormModal
          darkMode={darkMode}
          onClose={() => setShowShortForm(false)}
          borderClass={borderClass}
          hoverFill={hoverFill}
          startStep={shortFormStartStep}
          startMode={shortFormStartMode}
          onBackToCreate={() => {
            setShowShortForm(false)
            setShowCreate(true)
          }}
          onSave={(kind, name) => onSaveShortFormProject(kind, name)}
        />
      )}

      {showNewsletter && (
        <NewsletterCreateModal
          darkMode={darkMode}
          onClose={() => {
            setShowNewsletter(false)
            setQueuedSourceToAdd(null)
          }}
          borderClass={borderClass}
          defaultName={newsletterDefaultName}
          onBackToCreate={() => {
            setShowNewsletter(false)
            setShowCreate(true)
          }}
          onSave={(name) => onSaveNewsletterProject(name, queuedSourceToAdd)}
        />
      )}

      {showBlogs && (
        <BlogsModal
          darkMode={darkMode}
          onClose={() => setShowBlogs(false)}
          borderClass={borderClass}
          hoverFill={hoverFill}
          startStep={blogsStartStep}
          startMode={blogsStartMode}
          onBackToCreate={() => {
            setShowBlogs(false)
            setShowCreate(true)
          }}
          onSave={(kind, name, site) => onSaveBlogsProject(kind, name, site)}
        />
      )}
    </div>
  )
}
