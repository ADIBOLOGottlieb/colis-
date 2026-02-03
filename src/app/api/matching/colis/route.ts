import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { Permission } from '@/types/auth'
import { findMatchesForColis } from '@/modules/matching/matchingService'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  colisId: z.string(),
  options: z.object({
    minScore: z.number().min(0).max(100).optional(),
    limit: z.number().int().positive().optional(),
    dateSearchRadius: z.number().int().positive().optional(),
    includeBreakdown: z.boolean().optional()
  }).optional()
})

// Calculate matching trips for a colis (backend source of truth)
export const POST = requirePermission(Permission.VIEW_MATCHES)(async (request: Request) => {
  try {
    const body = await request.json()
    const { colisId, options } = requestSchema.parse(body)

    const results = await findMatchesForColis(colisId, options)

    const trajetIds = results.matches.map(match => match.trajetId)
    const trajets = await prisma.trajet.findMany({
      where: { id: { in: trajetIds } },
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

    const trajetsById = new Map(trajets.map(trajet => [trajet.id, trajet]))
    const enrichedMatches = results.matches
      .map(match => {
        const trajet = trajetsById.get(match.trajetId)
        if (!trajet) return null
        return {
          score: match.score,
          trajet
        }
      })
      .filter((match): match is { score: number; trajet: typeof trajets[number] } => Boolean(match))

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

    console.error('Erreur matching colis:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du matching' } },
      { status: 500 }
    )
  }
})
