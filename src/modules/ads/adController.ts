import { prisma } from '../../lib/prisma'
import { getBestAd } from './adService'
import { AdCreative, UserContext } from './adTypes'

const CLICK_WINDOW_MS = 60 * 1000
const clickCache = new Map<string, number>()

function clickKey(userId: string, adId: string): string {
  return `${userId}:${adId}`
}

export async function serveAd(context: UserContext): Promise<AdCreative | null> {
  return getBestAd(context)
}

export async function trackImpression(params: {
  adCampaignId: string
  userId: string
  placement: string
  ipHash: string
}): Promise<void> {
  await prisma.$transaction([
    prisma.adImpression.create({
      data: {
        adCampaignId: params.adCampaignId,
        userId: params.userId,
        placement: params.placement,
        ipHash: params.ipHash
      }
    }),
    prisma.adCampaign.update({
      where: { id: params.adCampaignId },
      data: { impressions: { increment: 1 } }
    })
  ])
}

export async function trackClick(params: {
  adCampaignId: string
  userId: string
  placement: string
  ipHash: string
}): Promise<{ allowed: boolean }> {
  const key = clickKey(params.userId, params.adCampaignId)
  const last = clickCache.get(key) || 0
  const now = Date.now()
  if (now - last < CLICK_WINDOW_MS) {
    return { allowed: false }
  }
  clickCache.set(key, now)

  await prisma.$transaction([
    prisma.adClick.create({
      data: {
        adCampaignId: params.adCampaignId,
        userId: params.userId,
        placement: params.placement,
        ipHash: params.ipHash
      }
    }),
    prisma.adCampaign.update({
      where: { id: params.adCampaignId },
      data: {
        clicks: { increment: 1 }
      }
    })
  ])

  return { allowed: true }
}
