import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'
import {
  UserRole,
  ActiveMode,
  Permission
} from '@/types/auth'
import { requirePermission } from '../../../lib/auth/guards'

const trajetSchema = z.object({
  villeDepart: z.string().min(2, 'Ville de départ requise'),
  villeArrivee: z.string().min(2, 'Ville d\'arrivée requise'),
  dateVoyage: z.string().transform(str => new Date(str)),
  kilosDisponibles: z.number().positive('Le poids doit être positif'),
  prixParKilo: z.number().nonnegative('Le prix doit être positif ou nul'),
  description: z.string().optional(),
})

/**
 * Validate that user can create trajet
 * - VOYAGEUR: Allowed
 * - EXPEDITEUR: NOT allowed - must not create trips
 * - LES_DEUX: Allowed only when in VOYAGEUR mode
 */
async function validateCanCreateTrajet(user: {
  id: string
  email: string
  name: string
  role: UserRole
  activeMode?: ActiveMode
}): Promise<{ allowed: boolean; error?: string; code?: string }> {
  // EXPEDITEUR role cannot create trajets - this is a strict security rule
  if (user.role === UserRole.EXPEDITEUR) {
    return {
      allowed: false,
      error: 'Forbidden: EXPEDITEUR role cannot create trips. Only VOYAGEUR or LES_DEUX (in VOYAGEUR mode) can create trajets.',
      code: 'ROLE_FORBIDDEN'
    }
  }

  // VOYAGEUR can always create trajets
  if (user.role === UserRole.VOYAGEUR) {
    return { allowed: true }
  }

  // LES_DEUX requires active mode to be VOYAGEUR
  if (user.role === UserRole.LES_DEUX) {
    if (!user.activeMode) {
      return {
        allowed: false,
        error: 'Active mode selection required. LES_DEUX users must select VOYAGEUR mode to create trajets.',
        code: 'ACTIVE_MODE_REQUIRED'
      }
    }

    if (user.activeMode !== ActiveMode.VOYAGEUR) {
      return {
        allowed: false,
        error: `Forbidden: Cannot create trajet in ${user.activeMode} mode. Switch to VOYAGEUR mode.`,
        code: 'WRONG_ACTIVE_MODE'
      }
    }

    return { allowed: true }
  }

  return {
    allowed: false,
    error: 'Invalid user role',
    code: 'INVALID_ROLE'
  }
}

// Créer un trajet - PROTECTED: Only VOYAGEUR or LES_DEUX in VOYAGEUR mode
export const POST = requirePermission(Permission.CREATE_TRAJET)(async (request: Request) => {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // STRICT ROLE VALIDATION
    const validation = await validateCanCreateTrajet({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      activeMode: session.user.activeMode
    })

    if (!validation.allowed) {
      // Log security event
      console.log('[SECURITY] Trajet creation denied:', {
        userId: session.user.id,
        role: session.user.role,
        activeMode: session.user.activeMode,
        reason: validation.error,
        code: validation.code,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        {
          error: validation.error,
          code: validation.code,
          userRole: session.user.role,
          activeMode: session.user.activeMode
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = trajetSchema.parse(body)

    const trajet = await prisma.trajet.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Log successful creation
    console.log('[SECURITY] Trajet created:', {
      trajetId: trajet.id,
      userId: session.user.id,
      role: session.user.role,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(trajet, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.error('Erreur création trajet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du trajet', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
})

// Rechercher des trajets - Available to all authenticated users
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const villeDepart = searchParams.get('villeDepart')
    const villeArrivee = searchParams.get('villeArrivee')
    const dateDebut = searchParams.get('dateDebut')
    const dateFin = searchParams.get('dateFin')

    const where: any = {}

    if (villeDepart) {
      where.villeDepart = {
        contains: villeDepart,
        mode: 'insensitive'
      }
    }

    if (villeArrivee) {
      where.villeArrivee = {
        contains: villeArrivee,
        mode: 'insensitive'
      }
    }

    if (dateDebut || dateFin) {
      where.dateVoyage = {}
      if (dateDebut) where.dateVoyage.gte = new Date(dateDebut)
      if (dateFin) where.dateVoyage.lte = new Date(dateFin)
    }

    const trajets = await prisma.trajet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      },
      orderBy: {
        dateVoyage: 'asc'
      }
    })

    return NextResponse.json(trajets)
  } catch (error) {
    console.error('Erreur recherche trajets:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
