'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, Send, Package, Plane } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
  }
}

interface Conversation {
  id: string
  colis: {
    id: string
    villeEnvoi: string
    villeReception: string
    poids: number
    user: {
      id: string
      name: string
    }
  }
  trajet: {
    id: string
    villeDepart: string
    villeArrivee: string
    dateVoyage: string
    user: {
      id: string
      name: string
    }
  }
  messages: Message[]
  updatedAt: string
}

export default function MessagesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    const conversationId = searchParams.get('conversationId')
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) {
        loadConversation(conv)
      }
    }
  }, [searchParams, conversations])

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversation: Conversation) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colisId: conversation.colis.id,
          trajetId: conversation.trajet.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedConversation(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage,
        }),
      })

      if (res.ok) {
        const message = await res.json()
        setSelectedConversation({
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        })
        setNewMessage('')
        // Rafraîchir la liste des conversations
        fetchConversations()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getOtherUser = (conversation: Conversation) => {
    if (session?.user.id === conversation.colis.user.id) {
      return conversation.trajet.user
    }
    return conversation.colis.user
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8">
        <MessageSquare className="w-8 h-8 text-primary-600" />
        Messagerie
      </h1>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Liste des conversations */}
        <div className="card overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold mb-4">Conversations</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune conversation
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-sm">
                      {conv.colis.villeEnvoi} → {conv.colis.villeReception}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Plane className="w-3 h-3" />
                    <span>
                      {conv.trajet.villeDepart} → {conv.trajet.villeArrivee}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Avec {getOtherUser(conv).name}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone de messages */}
        <div className="md:col-span-2 card flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* En-tête */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">
                      Conversation avec {getOtherUser(selectedConversation).name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {selectedConversation.colis.villeEnvoi} → {selectedConversation.colis.villeReception}
                      </span>
                      <span className="flex items-center gap-1">
                        <Plane className="w-4 h-4" />
                        {selectedConversation.trajet.villeDepart} → {selectedConversation.trajet.villeArrivee}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(selectedConversation.trajet.dateVoyage), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {selectedConversation.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucun message. Commencez la conversation !
                  </p>
                ) : (
                  selectedConversation.messages.map((message) => {
                    const isOwn = message.sender.id === session?.user.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-100' : 'text-gray-500'
                            }`}
                          >
                            {format(new Date(message.createdAt), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 input-field"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Sélectionnez une conversation pour voir les messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
