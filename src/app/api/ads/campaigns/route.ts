import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '../../../../lib/auth/guards'
import { prisma } from '../../../../lib/prisma'

export const runtime = 'nodejs'

const createSchema = z.object({
  advertiserName: z.string().min(2),
  category: z.enum(['airline', 'gaming', 'travel', 'fintech', 'transport', 'insurance', 'other']),
  imageUrl: z.string().url(),
  targetUrl: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().positive(),
  costPerClick: z.number().positive(),
  priority: z.number().int().min(0).max(10).optional(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional()
})

export const GET = requireAuth()(async () => {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: campaigns })
  } catch (error) {
    console.error('Ad campaigns list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', code: 'AD_CAMPAIGNS_ERROR' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth()(async (request: Request) => {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'endDate must be after startDate', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const campaign = await prisma.adCampaign.create({
      data: {
        advertiserName: data.advertiserName,
        category: data.category,
        imageUrl: data.imageUrl,
        targetUrl: data.targetUrl,
        title: data.title,
        description: data.description,
        budget: data.budget,
        costPerClick: data.costPerClick,
        priority: data.priority ?? 0,
        startDate,
        endDate,
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json({ success: true, data: campaign }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    console.error('Ad campaign create error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign', code: 'AD_CAMPAIGN_CREATE_ERROR' },
      { status: 500 }
    )
  }
})
