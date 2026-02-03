import 'server-only'
import { prisma } from '@/lib/prisma'
import { AdCandidate, AdCreative, AdProvider, AdCategory, UserContext } from './adTypes'

const RECENT_IMPRESSION_WINDOW_MS = 30 * 60 * 1000

function now(): Date {
  return new Date()
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function categoryForContext(context: UserContext): AdCategory[] {
  const base: AdCategory[] = ['other']

  if (context.intent === 'create_trajet') return ['airline', 'travel', 'transport', ...base]
  if (context.intent === 'create_colis') return ['insurance', 'transport', 'fintech', ...base]
  if (context.pageType === 'trajets_results') return ['airline', 'travel', 'fintech', ...base]
  if (context.pageType === 'colis_results') return ['insurance', 'transport', 'fintech', ...base]

  if (context.activeMode === 'VOYAGEUR') return ['airline', 'travel', 'transport', ...base]
  if (context.activeMode === 'EXPEDITEUR') return ['insurance', 'fintech', 'transport', ...base]

  return base
}

function scoreCandidate(
  candidate: Omit<AdCandidate, 'score'>,
  preferred: AdCategory[]
): number {
  const categoryScore = preferred.includes(candidate.category) ? 30 : 0
  const priorityScore = candidate.priority * 10
  const budgetScore = Math.min(candidate.remainingBudget, 100) / 2
  const rotationJitter = Math.random() * 10
  return categoryScore + priorityScore + budgetScore + rotationJitter
}

async function getRecentImpressions(userId: string, campaignIds: string[]): Promise<Set<string>> {
  if (!campaignIds.length) return new Set()
  const since = new Date(Date.now() - RECENT_IMPRESSION_WINDOW_MS)
  const impressions = await prisma.adImpression.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      adCampaignId: { in: campaignIds }
    },
    select: { adCampaignId: true }
  })
  return new Set(impressions.map(i => i.adCampaignId))
}

async function getActiveCampaigns(): Promise<AdCandidate[]> {
  if (!prisma || !(prisma as any).adCampaign) {
    console.error('[ADS] Prisma client missing AdCampaign model. Run prisma generate/migrate.')
    return []
  }

  const nowDate = now()
  const campaigns = await prisma.adCampaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: nowDate },
      endDate: { gte: nowDate }
    },
    orderBy: [
      { priority: 'desc' },
      { updatedAt: 'desc' }
    ]
  })

  return campaigns
    .map((c) => {
      const remainingBudget = c.budget - c.clicks * c.costPerClick
      return {
        id: c.id,
        advertiserName: c.advertiserName,
        category: c.category as AdCategory,
        imageUrl: c.imageUrl,
        targetUrl: c.targetUrl,
        title: c.title || undefined,
        description: c.description || undefined,
        priority: c.priority,
        remainingBudget,
        score: 0
      }
    })
    .filter(c => c.remainingBudget > 0 && isValidUrl(c.targetUrl) && isValidUrl(c.imageUrl))
}

async function selectBestAd(context: UserContext): Promise<AdCreative | null> {
  const preferred = categoryForContext(context)
  const candidates = await getActiveCampaigns()
  if (!candidates.length) return null

  const recent = await getRecentImpressions(context.userId, candidates.map(c => c.id))
  const filtered = candidates.filter(c => !recent.has(c.id))
  const pool = filtered.length ? filtered : candidates

  const scored = pool.map(c => ({ ...c, score: scoreCandidate(c, preferred) }))
  scored.sort((a, b) => b.score - a.score)

  const top = scored[0]
  if (!top) return null

  return {
    id: top.id,
    advertiserName: top.advertiserName,
    category: top.category,
    imageUrl: top.imageUrl,
    targetUrl: top.targetUrl,
    title: top.title,
    description: top.description,
    priority: top.priority
  }
}

export const internalAdProvider: AdProvider = {
  name: 'internal',
  getBestAd: selectBestAd
}

export async function getBestAd(context: UserContext): Promise<AdCreative | null> {
  return internalAdProvider.getBestAd(context)
}
