import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// GET /api/user - Get current user's profile with their colis and trajets
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        colis: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            villeEnvoi: true,
            villeReception: true,
            poids: true,
            description: true,
            dateEnvoi: true,
            createdAt: true
          }
        },
        trajets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            villeDepart: true,
            villeArrivee: true,
            dateVoyage: true,
            kilosDisponibles: true,
            prixParKilo: true,
            description: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            colis: true,
            trajets: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur récupération profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20).optional(),
  photo: z.string().url().optional(),
  newPassword: z.string().min(8).optional(),
  confirmPassword: z.string().min(8).optional()
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateSchema.parse(body)

    if (parsed.newPassword || parsed.confirmPassword) {
      if (!parsed.newPassword || !parsed.confirmPassword) {
        return NextResponse.json(
          { error: 'Mot de passe incomplet', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      if (parsed.newPassword !== parsed.confirmPassword) {
        return NextResponse.json(
          { error: 'Les mots de passe ne correspondent pas', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
    }

    if (parsed.email) {
      const existing = await prisma.user.findUnique({
        where: { email: parsed.email }
      })
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email déjà utilisé', code: 'EMAIL_IN_USE' },
          { status: 400 }
        )
      }
    }

    const updates: Prisma.UserUpdateInput = {}

    const fullName = [parsed.firstName, parsed.lastName].filter(Boolean).join(' ').trim()
    if (fullName) updates.name = fullName
    if (parsed.email) updates.email = parsed.email
    if (parsed.phone) updates.phone = parsed.phone
    if (parsed.photo) updates.photo = parsed.photo
    if (parsed.newPassword) {
      updates.password = await bcrypt.hash(parsed.newPassword, 10)
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    console.error('Erreur update profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
