import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '../../../../lib/auth/guards'
import { trackImpression } from '../../../../modules/ads/adController'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export const runtime = 'nodejs'

const impressionSchema = z.object({
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
    const { adCampaignId, placement } = impressionSchema.parse(body)
    const ipHash = hashIp(getClientIp(request))

    await trackImpression({
      adCampaignId,
      userId: session.user.id,
      placement,
      ipHash
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    console.error('Ad impression error:', error)
    return NextResponse.json(
      { error: 'Ad impression failed', code: 'AD_IMPRESSION_ERROR' },
      { status: 500 }
    )
  }
})
