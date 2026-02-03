import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { serveAd } from '@/modules/ads/adController'
import { UserContext } from '@/modules/ads/adTypes'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

const contextSchema = z.object({
  pageType: z.string(),
  intent: z.string().optional(),
  role: z.string().optional(),
  activeMode: z.string().optional()
})

export const POST = requireAuth()(async (request: Request) => {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = contextSchema.parse(body)

    const ctx: UserContext = {
      userId: session.user.id,
      role: session.user.role,
      activeMode: session.user.activeMode,
      pageType: parsed.pageType as any,
      intent: parsed.intent as any
    }

    const ad = await serveAd(ctx)
    if (!ad) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({
      success: true,
      data: ad
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    console.error('Ad serve error:', error)
    return NextResponse.json(
      { error: 'Ad serve failed', code: 'AD_SERVE_ERROR' },
      { status: 500 }
    )
  }
})
