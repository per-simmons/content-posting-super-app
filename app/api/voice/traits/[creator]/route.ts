import { NextResponse } from 'next/server'
import { voiceTraitsManager } from '@/lib/voice-emulator/steps/voice-traits'

export async function GET(
  request: Request,
  { params }: { params: { creator: string } }
) {
  try {
    const creatorName = decodeURIComponent(params.creator)
    
    if (!creatorName) {
      return NextResponse.json(
        { error: 'Creator name is required' },
        { status: 400 }
      )
    }

    const profile = await voiceTraitsManager.getVoiceProfile(creatorName)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Voice profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile,
      traits: profile.traits
    })
  } catch (error) {
    console.error('Voice traits error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve voice traits' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { creator: string } }
) {
  try {
    const creatorName = decodeURIComponent(params.creator)
    const { category, limit = 10 } = await request.json()
    
    if (!creatorName) {
      return NextResponse.json(
        { error: 'Creator name is required' },
        { status: 400 }
      )
    }

    let traits
    if (category) {
      traits = await voiceTraitsManager.getTraitsByCategory(creatorName, category)
    } else {
      traits = await voiceTraitsManager.getTopTraits(creatorName, limit)
    }

    return NextResponse.json({
      success: true,
      traits,
      count: traits.length
    })
  } catch (error) {
    console.error('Voice traits error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve voice traits' },
      { status: 500 }
    )
  }
}