// Temporarily disabled - trigger.dev v3 setup needs additional configuration
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Trigger.dev endpoint - setup pending" })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Trigger.dev endpoint - setup pending" })
}