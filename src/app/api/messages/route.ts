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

const messageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, 'Le message ne peut pas etre vide'),
})

export async function POST(request: Request) {
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

    if (!hasPermission(effectiveMode, Permission.SEND_MESSAGE)) {
      return NextResponse.json(
        { error: 'Acces refuse', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { conversationId, content } = messageSchema.parse(body)

    // Recuperer la conversation pour determiner le destinataire
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        colis: true,
        trajet: true,
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation introuvable' },
        { status: 404 }
      )
    }

    // Verifier que l'utilisateur appartient a la conversation
    const isParticipant =
      conversation.colis.userId === session.user.id ||
      conversation.trajet.userId === session.user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Non autorise', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    // Determiner le destinataire
    const receiverId = conversation.colis.userId === session.user.id
      ? conversation.trajet.userId
      : conversation.colis.userId

    // Creer le message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: session.user.id,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Mettre a jour la date de derniere activite de la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Erreur envoi message:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    )
  }
}
