import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
            createdAt: true,
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
            createdAt: true,
          }
        },
        _count: {
          select: {
            colis: true,
            trajets: true,
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
