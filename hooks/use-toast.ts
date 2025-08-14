"use client"

export function useToast() {
  return {
    toast: (opts: { title?: string; description?: string }) => {
      if (typeof window !== "undefined") {
        const parts = [opts.title, opts.description].filter(Boolean)
        if (parts.length) console.log("[toast]", parts.join(" - "))
      }
    },
  }
}

