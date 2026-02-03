import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  Permission,
  UserWithRole,
  ActiveModeRequiredError,
  getEffectiveMode,
  hasPermission
} from '@/types/auth'
import { getConversationOrCreate, listConversationsForUser } from '@/modules/messaging/messagingService'

const conversationSchema = z.object({
  colisId: z.string(),
  trajetId: z.string(),
})

// Creer ou recuperer une conversation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { colisId, trajetId } = conversationSchema.parse(body)

    let effectiveMode
    try {
      effectiveMode = getEffectiveMode(session.user as UserWithRole)
    } catch (error) {
      if (error instanceof ActiveModeRequiredError) {
        return NextResponse.json(
          { error: 'Active mode selection required', code: 'ACTIVE_MODE_REQUIRED' },
          { status: 403 }
        )
      }
      throw error
    }

    // Verifier que le colis et le trajet existent
    const colis = await prisma.colis.findUnique({
      where: { id: colisId },
      include: { user: true }
    })

    const trajet = await prisma.trajet.findUnique({
      where: { id: trajetId },
      include: { user: true }
    })

    if (!colis || !trajet) {
      return NextResponse.json(
        { error: 'Colis ou trajet introuvable' },
        { status: 404 }
      )
    }

    const isColisOwner = colis.userId === session.user.id
    const isTrajetOwner = trajet.userId === session.user.id

    // Verifier que l'utilisateur est soit le proprietaire du colis soit du trajet
    if (!isColisOwner && !isTrajetOwner) {
      return NextResponse.json(
        { error: 'Non autorise' },
        { status: 403 }
      )
    }

    const canContactAsColisOwner = isColisOwner && hasPermission(effectiveMode, Permission.CONTACT_VOYAGEUR)
    const canContactAsTrajetOwner = isTrajetOwner && hasPermission(effectiveMode, Permission.CONTACT_EXPEDITEUR)

    if (!canContactAsColisOwner && !canContactAsTrajetOwner) {
      return NextResponse.json(
        { error: 'Acces refuse', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    const conversation = await getConversationOrCreate(colisId, trajetId)

    return NextResponse.json(conversation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Erreur conversation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la conversation' },
      { status: 500 }
    )
  }
}

// Recuperer toutes les conversations de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    let effectiveMode
    try {
      effectiveMode = getEffectiveMode(session.user as UserWithRole)
    } catch (error) {
      if (error instanceof ActiveModeRequiredError) {
        return NextResponse.json(
          { error: 'Active mode selection required', code: 'ACTIVE_MODE_REQUIRED' },
          { status: 403 }
        )
      }
      throw error
    }

    if (!hasPermission(effectiveMode, Permission.VIEW_CONVERSATIONS)) {
      return NextResponse.json(
        { error: 'Acces refuse', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    const conversations = await listConversationsForUser(session.user.id)

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Erreur recuperation conversations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des conversations' },
      { status: 500 }
    )
  }
}
