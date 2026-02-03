import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '../../../../../lib/auth/guards'
import { Permission } from '@/types/auth'
import { findMatchesForColis } from '../../../../../modules/matching/matchingService'
import { prisma } from '../../../../../lib/prisma'

const requestSchema = z.object({
  colisIds: z.array(z.string()).min(1),
  options: z.object({
    minScore: z.number().min(0).max(100).optional(),
    limit: z.number().int().positive().optional(),
    dateSearchRadius: z.number().int().positive().optional(),
    includeBreakdown: z.boolean().optional()
  }).optional()
})

// Batch matching for multiple colis
type TrajetView = {
  id: string
  villeDepart: string
  villeArrivee: string
  dateVoyage: Date
  kilosDisponibles: number
  prixParKilo: number
  user: {
    id: string
    name: string
    phone?: string | null
  }
}

export const POST = requirePermission(Permission.VIEW_MATCHES)(async (request: Request) => {
  try {
    const body = await request.json()
    const { colisIds, options } = requestSchema.parse(body)

    const minScore = options?.minScore ?? 70

    const results = await Promise.all(
      colisIds.map(async (colisId) => {
        const matches = await findMatchesForColis(colisId, {
          ...options,
          minScore
        })
        return { colisId, matches }
      })
    )

    const allTrajetIds = new Set<string>()
    results.forEach(r => r.matches.matches.forEach(m => allTrajetIds.add(m.trajetId)))

    const trajets = await prisma.trajet.findMany({
      where: { id: { in: Array.from(allTrajetIds) } },
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
    const trajetsById = new Map<string, TrajetView>(trajets.map(t => [t.id, t]))

    const matchesByColisId: Record<string, { score: number; trajet: TrajetView }[]> = {}
    results.forEach(({ colisId, matches }) => {
      matchesByColisId[colisId] = matches.matches
        .map(match => {
          const trajet = trajetsById.get(match.trajetId)
          if (!trajet) return null
          return { score: match.score, trajet }
        })
        .filter(Boolean) as { score: number; trajet: any }[]
    })

    return NextResponse.json({
      success: true,
      data: {
        matchesByColisId
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }

    console.error('Erreur matching batch colis:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du matching' } },
      { status: 500 }
    )
  }
})
