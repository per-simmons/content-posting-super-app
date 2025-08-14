import type { ReactNode } from "react"
import "./globals.css"
export const metadata = {
  title: "Content Posting Super App",
  description: "Local preview",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

