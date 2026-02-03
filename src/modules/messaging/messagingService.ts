import { prisma } from '../../lib/prisma'

export async function getConversationOrCreate(colisId: string, trajetId: string) {
  let conversation = await prisma.conversation.findUnique({
    where: {
      colisId_trajetId: {
        colisId,
        trajetId
      }
    },
    include: {
      colis: {
        include: { user: true }
      },
      trajet: {
        include: { user: true }
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        colisId,
        trajetId,
      },
      include: {
        colis: {
          include: { user: true }
        },
        trajet: {
          include: { user: true }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })
  }

  return conversation
}

export async function listConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: {
      OR: [
        { colis: { userId } },
        { trajet: { userId } }
      ]
    },
    include: {
      colis: {
        include: { user: true }
      },
      trajet: {
        include: { user: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

export async function createMessage(params: {
  conversationId: string
  senderId: string
  receiverId: string
  content: string
}) {
  const message = await prisma.message.create({
    data: {
      content: params.content,
      conversationId: params.conversationId,
      senderId: params.senderId,
      receiverId: params.receiverId,
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

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() }
  })

  return message
}
