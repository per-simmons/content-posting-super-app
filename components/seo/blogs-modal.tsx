"use client"

import * as React from "react"
import { FileText } from "lucide-react"
import { Cross2Icon, MagnifyingGlassIcon, CheckIcon } from "@radix-ui/react-icons"

type BlogSiteKey = "clearhaven" | "ai-for-mortals" | "solar-lift"

const BLOG_SITES: Record<BlogSiteKey, { name: string; logo: string; short: string }> = {
  clearhaven: { name: "Clearhaven Blog", logo: "/images/Clearhaven%20logo.png", short: "Clearhaven" },
  "ai-for-mortals": { name: "AI For Mortals", logo: "/images/AI%20For%20Mortals%20Logo.png", short: "AI For Mortals" },
  "solar-lift": { name: "Solar Lift", logo: "/images/Solar%20Lift%20logo%20(500%20x%20500%20px).png", short: "Solar Lift" },
}

export function BlogsModal({
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

  const [step, setStep] = React.useState<"choose" | "setup">(startStep)
  const [mode, setMode] = React.useState<"keyword" | "seo">(startMode)
  React.useEffect(() => setStep(startStep), [startStep])
  React.useEffect(() => setMode(startMode), [startMode])

  // Blog site selection (required for Blogs projects)
  const [site, setSite] = React.useState<BlogSiteKey>("clearhaven")

  const nameRef = React.useRef<HTMLInputElement | null>(null)
  const defaultName = mode === "keyword" ? "Keyword Research Project 1" : "SEO Writing Agent Project 1"
  const [projectName, setProjectName] = React.useState<string>(defaultName)
  React.useEffect(() => {
    if (step === "setup") {
      requestAnimationFrame(() => {
        nameRef.current?.focus()
        nameRef.current?.select()
      })
    }
  }, [step])
  React.useEffect(() => {
    if (step === "setup") {
      setProjectName(mode === "keyword" ? "Keyword Research Project 1" : "SEO Writing Agent Project 1")
    }
  }, [mode]) // eslint-disable-line

  const heading = mode === "keyword" ? "Keyword Research" : "SEO Writing Agent"

  function handleModalContentClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayBg} grid place-items-center px-4`}
      onClick={onClose}
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
                  <MagnifyingGlassIcon className="h-4 w-4 opacity-80" />
                </div>
                <p className={`mt-2 text-xs ${textMuted}`}>Discover topics and terms to target for your content.</p>
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
                  <FileText className="h-4 w-4 opacity-80" />
                </div>
                <p className={`mt-2 text-xs ${textMuted}`}>Draft optimized posts guided by your target keywords.</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="mt-1 flex items-center gap-2">
              {mode === "keyword" ? (
                <MagnifyingGlassIcon className="h-4 w-4 opacity-80" />
              ) : (
                <FileText className="h-4 w-4 opacity-80" />
              )}
              <div>
                <div className="text-base font-medium leading-none">{heading}</div>
                <div className={`mt-1 text-xs ${textMuted}`}>Choose a site and name your project.</div>
              </div>
            </div>

            {/* Blog site selection */}
            <div>
              <div className="text-sm font-medium mb-3">Blog Site</div>
              <div className="flex flex-wrap gap-3 w-full">
                {(Object.keys(BLOG_SITES) as BlogSiteKey[]).map((key) => {
                  const meta = BLOG_SITES[key]
                  const active = site === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSite(key)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 transition-all flex-1 min-w-[120px] justify-center ${
                        active
                          ? "ring-2 ring-emerald-500 bg-emerald-500 text-white border-emerald-500"
                          : `${darkMode ? "hover:bg-neutral-800 border-neutral-700 text-neutral-200" : "hover:bg-neutral-100 border-neutral-300 text-neutral-700"}`
                      }`}
                    >
                      <img
                        src={meta.logo || "/placeholder.svg"}
                        alt={`${meta.name} logo`}
                        className="h-5 w-5 rounded flex-shrink-0"
                      />
                      <span className="text-sm font-medium truncate">{meta.short}</span>
                      {active && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Project name */}
            <div>
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

            <div className="mt-2 flex items-center gap-2">
              <button
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  darkMode ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
                }`}
                onClick={() => onSave(mode, projectName, site)}
              >
                Save {heading} Project
              </button>
              <button className="text-sm opacity-80 hover:opacity-100" onClick={() => setStep("choose")}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
