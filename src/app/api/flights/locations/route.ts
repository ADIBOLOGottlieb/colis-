import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { searchLocations } from '@/services/flightService'

const querySchema = z.object({
  q: z.string().min(2)
})

export const GET = requireAuth()(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const { q: keyword } = querySchema.parse({ q })

    const results = await searchLocations(keyword)
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.error('Flight locations error:', error)
    return NextResponse.json(
      { error: 'Location search failed', code: 'FLIGHT_API_ERROR' },
      { status: 500 }
    )
  }
})
