import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { Permission } from '@/types/auth'
import { findMatchesForTrajet } from '@/lib/matching/engine'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  trajetId: z.string(),
  options: z.object({
    minScore: z.number().min(0).max(100).optional(),
    limit: z.number().int().positive().optional(),
    dateSearchRadius: z.number().int().positive().optional(),
    includeBreakdown: z.boolean().optional()
  }).optional()
})

// Calculate matching packages for a trajet (backend source of truth)
export const POST = requirePermission(Permission.VIEW_MATCHES)(async (request: Request) => {
  try {
    const body = await request.json()
    const { trajetId, options } = requestSchema.parse(body)

    const results = await findMatchesForTrajet(trajetId, options)

    const colisIds = results.matches.map(match => match.colisId)
    const colis = await prisma.colis.findMany({
      where: { id: { in: colisIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    const colisById = new Map(colis.map(item => [item.id, item]))
    const enrichedMatches = results.matches
      .map(match => {
        const colisItem = colisById.get(match.colisId)
        if (!colisItem) return null
        return {
          score: match.score,
          colis: colisItem
        }
      })
      .filter((match): match is { score: number; colis: typeof colis[number] } => Boolean(match))

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        matches: enrichedMatches
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }

    console.error('Erreur matching trajet:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du matching' } },
      { status: 500 }
    )
  }
})
