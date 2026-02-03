import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { searchFlights } from '@/services/flightService'

const searchSchema = z.object({
  origin: z.string().min(3).max(3),
  destination: z.string().min(3).max(3),
  date: z.string().min(10),
  adults: z.number().int().min(1).max(9).optional()
})

type RateLimitEntry = {
  count: number
  windowStart: number
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 20
const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0].trim()
  return ip || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return false
  }
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  rateLimitStore.set(key, entry)
  return entry.count > RATE_LIMIT_MAX
}

export const POST = requireAuth()(async (request: Request) => {
  try {
    const key = getClientKey(request)
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { origin, destination, date, adults } = searchSchema.parse(body)

    const results = await searchFlights({
      origin,
      destination,
      date,
      adults: adults || 1
    })

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.error('Flight search error:', error)
    return NextResponse.json(
      { error: 'Flight search failed', code: 'FLIGHT_API_ERROR' },
      { status: 500 }
    )
  }
})
