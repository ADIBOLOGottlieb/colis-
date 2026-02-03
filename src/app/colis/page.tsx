'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Search, MapPin, Weight, MessageSquare } from 'lucide-react'
import { canCreateColis, canContactVoyageur } from '../../types/auth'
import dynamic from 'next/dynamic'

const AdBanner = dynamic(() => import('../../components/AdBanner'), { ssr: false })

interface Colis {
  id: string
  villeEnvoi: string
  villeReception: string
  poids: number
  description: string
  dateEnvoi?: string
  user: {
    id: string
    name: string
    phone?: string
  }
}

interface Trajet {
  id: string
  villeDepart: string
  villeArrivee: string
  dateVoyage: string
  kilosDisponibles: number
  prixParKilo: number
  user: {
    id: string
    name: string
  }
}

interface MatchedTrajet {
  trajet: Trajet
  score: number
}

export default function ColisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [colis, setColis] = useState<Colis[]>([])
  const [trajetsCompatibles, setTrajetsCompatibles] = useState<{ [key: string]: MatchedTrajet[] }>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedColis, setSelectedColis] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    villeEnvoi: '',
    villeReception: '',
    poids: '',
    description: '',
    dateEnvoi: '',
  })

  const userCanCreateColis = session?.user ? canCreateColis({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const userCanContactVoyageur = session?.user ? canContactVoyageur({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const fetchTrajetsCompatiblesBatch = useCallback(async (colisIds: string[]) => {
    try {
      const res = await fetch('/api/matching/colis/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colisIds,
          options: {
            minScore: 70,
            limit: 10,
            includeBreakdown: false
          }
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.data?.matchesByColisId) {
          setTrajetsCompatibles(data.data.matchesByColisId)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }, [])

  const fetchColis = useCallback(async () => {
    try {
      const res = await fetch('/api/colis')
      if (res.ok) {
        const data = await res.json()
        setColis(data)
        if (data?.length) {
          fetchTrajetsCompatiblesBatch(data.map((c: Colis) => c.id))
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchTrajetsCompatiblesBatch])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchColis()
  }, [fetchColis])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userCanCreateColis) {
      alert('Accès refusé: seuls les expéditeurs peuvent créer un colis.')
      return
    }

    try {
      const res = await fetch('/api/colis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          poids: parseFloat(formData.poids),
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          villeEnvoi: '',
          villeReception: '',
          poids: '',
          description: '',
          dateEnvoi: '',
        })
        fetchColis()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      alert('Erreur lors de la création du colis')
    }
  }

  const handleContact = async (colisId: string, trajetId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colisId, trajetId }),
      })

      if (res.ok) {
        const conversation = await res.json()
        router.push(`/messages?conversationId=${conversation.id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      alert('Erreur lors de la création de la conversation')
    }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            Colis à transporter
          </h1>
          <p className="text-gray-600 mt-2">
            Publiez votre colis et trouvez un voyageur
          </p>
        </div>
        {userCanCreateColis && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Publier mon colis
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showForm && userCanCreateColis && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Publier un nouveau colis</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville d'envoi *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.villeEnvoi}
                  onChange={(e) => setFormData({ ...formData, villeEnvoi: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville de réception *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.villeReception}
                  onChange={(e) => setFormData({ ...formData, villeReception: e.target.value })}
                  placeholder="Lyon"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="input-field"
                  value={formData.poids}
                  onChange={(e) => setFormData({ ...formData, poids: e.target.value })}
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'envoi souhaitée (optionnel)
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dateEnvoi}
                  onChange={(e) => setFormData({ ...formData, dateEnvoi: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description du colis * (min. 10 caractères)
              </label>
              <textarea
                required
                minLength={10}
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre colis (livres, vêtements, etc.). ⚠️ Objets dangereux interdits."
              />
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-gray-700">
              <p className="font-semibold text-red-700 mb-1">⚠️ Objets interdits :</p>
              <p>Armes, explosifs, drogues, substances dangereuses, articles contrefaits, 
              et tout objet interdit par la réglementation IATA.</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Publier le colis
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des colis */}
      <div className="space-y-6">
        <AdBanner placement="colis_results" variant="banner" intent="browse_colis" />
        {colis.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun colis publié</p>
          </div>
        ) : (
          colis.map((c) => (
            <div key={c.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="font-bold text-lg">
                      {c.villeEnvoi} → {c.villeReception}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      {c.poids} kg
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{c.description}</p>

                  <div className="text-sm text-gray-500">
                    Publié par <span className="font-medium">{c.user.name}</span>
                  </div>
                </div>

                {session?.user.id === c.user.id && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Votre colis
                  </span>
                )}
              </div>

              {/* Trajets compatibles */}
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => setSelectedColis(selectedColis === c.id ? null : c.id)}
                  className="flex items-center gap-2 text-primary-600 font-medium mb-3"
                >
                  <Search className="w-4 h-4" />
                  {trajetsCompatibles[c.id]?.length || 0} trajet(s) compatible(s)
                </button>

                {selectedColis === c.id && trajetsCompatibles[c.id] && (
                  <div className="space-y-3">
                    {trajetsCompatibles[c.id].length === 0 ? (
                      <p className="text-gray-500 text-sm">Aucun trajet compatible pour le moment</p>
                    ) : (
                      trajetsCompatibles[c.id].map((match) => (
                        <div key={match.trajet.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{match.trajet.user.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(match.trajet.dateVoyage).toLocaleDateString('fr-FR')} • 
                              {match.trajet.kilosDisponibles} kg disponibles • 
                              {match.trajet.prixParKilo}€/kg
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Compatibilité: {Math.round(match.score)}%
                            </p>
                          </div>
                          {userCanContactVoyageur && session?.user.id !== match.trajet.user.id && session?.user.id === c.user.id && (
                            <button
                              onClick={() => handleContact(c.id, match.trajet.id)}
                              className="btn-primary flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Contacter
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
