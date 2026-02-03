import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  UserRole,
  ActiveMode,
  Permission
} from '@/types/auth'
import { requirePermission } from '@/lib/auth/guards'

const colisSchema = z.object({
  villeEnvoi: z.string().min(2, 'Ville d\'envoi requise'),
  villeReception: z.string().min(2, 'Ville de réception requise'),
  poids: z.number().positive('Le poids doit être positif'),
  description: z.string().min(10, 'Description requise (minimum 10 caractères)'),
  dateEnvoi: z.string().transform(str => new Date(str)).optional(),
})

/**
 * Validate that user can create colis
 * - EXPEDITEUR: Allowed
 * - VOYAGEUR: NOT allowed - must not create packages
 * - LES_DEUX: Allowed only when in EXPEDITEUR mode
 */
async function validateCanCreateColis(user: {
  id: string
  email: string
  name: string
  role: UserRole
  activeMode?: ActiveMode
}): Promise<{ allowed: boolean; error?: string; code?: string }> {
  // VOYAGEUR role cannot create colis - this is a strict security rule
  if (user.role === UserRole.VOYAGEUR) {
    return {
      allowed: false,
      error: 'Forbidden: VOYAGEUR role cannot create packages. Only EXPEDITEUR or LES_DEUX (in EXPEDITEUR mode) can create colis.',
      code: 'ROLE_FORBIDDEN'
    }
  }

  // EXPEDITEUR can always create colis
  if (user.role === UserRole.EXPEDITEUR) {
    return { allowed: true }
  }

  // LES_DEUX requires active mode to be EXPEDITEUR
  if (user.role === UserRole.LES_DEUX) {
    if (!user.activeMode) {
      return {
        allowed: false,
        error: 'Active mode selection required. LES_DEUX users must select EXPEDITEUR mode to create colis.',
        code: 'ACTIVE_MODE_REQUIRED'
      }
    }

    if (user.activeMode !== ActiveMode.EXPEDITEUR) {
      return {
        allowed: false,
        error: `Forbidden: Cannot create colis in ${user.activeMode} mode. Switch to EXPEDITEUR mode.`,
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

// Créer un colis - PROTECTED: Only EXPEDITEUR or LES_DEUX in EXPEDITEUR mode
export const POST = requirePermission(Permission.CREATE_COLIS)(async (request: Request) => {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // STRICT ROLE VALIDATION
    const validation = await validateCanCreateColis({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      activeMode: session.user.activeMode
    })

    if (!validation.allowed) {
      // Log security event
      console.log('[SECURITY] Colis creation denied:', {
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
    const validatedData = colisSchema.parse(body)

    const colis = await prisma.colis.create({
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
    console.log('[SECURITY] Colis created:', {
      colisId: colis.id,
      userId: session.user.id,
      role: session.user.role,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(colis, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.error('Erreur création colis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du colis', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
})

// Rechercher des colis - Available to all authenticated users
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
    const villeEnvoi = searchParams.get('villeEnvoi')
    const villeReception = searchParams.get('villeReception')

    const where: any = {}

    if (villeEnvoi) {
      where.villeEnvoi = {
        contains: villeEnvoi,
        mode: 'insensitive'
      }
    }

    if (villeReception) {
      where.villeReception = {
        contains: villeReception,
        mode: 'insensitive'
      }
    }

    const colis = await prisma.colis.findMany({
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json(colis)
  } catch (error) {
    console.error('Erreur recherche colis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
