import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { trackClick } from '@/modules/ads/adController'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

const clickSchema = z.object({
  adCampaignId: z.string(),
  placement: z.string()
})

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') || ''
  return forwardedFor.split(',')[0].trim() || 'unknown'
}

function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i += 1) {
    hash = (hash << 5) - hash + ip.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}

export const POST = requireAuth()(async (request: Request) => {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { adCampaignId, placement } = clickSchema.parse(body)
    const ipHash = hashIp(getClientIp(request))

    const result = await trackClick({
      adCampaignId,
      userId: session.user.id,
      placement,
      ipHash
    })

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Click throttled', code: 'CLICK_THROTTLED' },
        { status: 429 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    console.error('Ad click error:', error)
    return NextResponse.json(
      { error: 'Ad click failed', code: 'AD_CLICK_ERROR' },
      { status: 500 }
    )
  }
})
