'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plane, Plus, Search, Calendar, MapPin, Weight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { canCreateTrajet, canContactVoyageur } from '../../types/auth'
import dynamic from 'next/dynamic'

const AdBanner = dynamic(() => import('../../components/AdBanner'), { ssr: false })

interface Trajet {
  id: string
  villeDepart: string
  villeArrivee: string
  dateVoyage: string
  kilosDisponibles: number
  prixParKilo: number
  description?: string
  user: {
    id: string
    name: string
    phone?: string
  }
}

interface Colis {
  id: string
  villeEnvoi: string
  villeArrivee: string
  user: {
    id: string
  }
}

export default function TrajetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [myColis, setMyColis] = useState<Colis[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [contactTrajetId, setContactTrajetId] = useState<string | null>(null)
  const [selectedColisId, setSelectedColisId] = useState<string>('')
  const [filters, setFilters] = useState({
    villeDepart: '',
    villeArrivee: '',
  })
  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    dateVoyage: '',
    kilosDisponibles: '',
    prixParKilo: '',
    description: '',
  })

  const userCanCreateTrajet = session?.user ? canCreateTrajet({
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchTrajets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.villeDepart) params.append('villeDepart', filters.villeDepart)
      if (filters.villeArrivee) params.append('villeArrivee', filters.villeArrivee)

      const res = await fetch(`/api/trajets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTrajets(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.villeArrivee, filters.villeDepart])

  useEffect(() => {
    fetchTrajets()
  }, [fetchTrajets])

  const fetchMyColis = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/colis')
      if (res.ok) {
        const data = await res.json()
        const mine = Array.isArray(data) ? data.filter((c: Colis) => c.user?.id === session.user.id) : []
        setMyColis(mine)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }, [session?.user])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyColis()
    }
  }, [status, fetchMyColis])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userCanCreateTrajet) {
      alert('AccÃ¨s refusÃ©: seuls les voyageurs peuvent crÃ©er un trajet.')
      return
    }

    try {
      const res = await fetch('/api/trajets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kilosDisponibles: parseFloat(formData.kilosDisponibles),
          prixParKilo: parseFloat(formData.prixParKilo),
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          villeDepart: '',
          villeArrivee: '',
          dateVoyage: '',
          kilosDisponibles: '',
          prixParKilo: '',
          description: '',
        })
        fetchTrajets()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la crÃ©ation')
      }
    } catch (error) {
      alert('Erreur lors de la crÃ©ation du trajet')
    }
  }
  const handleContact = async (trajetId: string, colisId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colisId, trajetId })
      })

      if (res.ok) {
        const conversation = await res.json()
        router.push(`/messages?conversationId=${conversation.id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      alert('Erreur lors de la creation de la conversation')
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
            <Plane className="w-8 h-8 text-primary-600" />
            Trajets disponibles
          </h1>
          <p className="text-gray-600 mt-2">
            Trouvez un voyageur pour transporter votre colis
          </p>
        </div>
        {userCanCreateTrajet && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Publier mon trajet
          </button>
        )}
      </div>

      {/* Formulaire de crÃ©ation */}
      {showForm && userCanCreateTrajet && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Publier un nouveau trajet</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville de dÃ©part *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.villeDepart}
                  onChange={(e) => setFormData({ ...formData, villeDepart: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville d'arrivÃ©e *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.villeArrivee}
                  onChange={(e) => setFormData({ ...formData, villeArrivee: e.target.value })}
                  placeholder="Lyon"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date du voyage *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.dateVoyage}
                  onChange={(e) => setFormData({ ...formData, dateVoyage: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilos disponibles *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="input-field"
                  value={formData.kilosDisponibles}
                  onChange={(e) => setFormData({ ...formData, kilosDisponibles: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix par kilo (â‚¬) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input-field"
                  value={formData.prixParKilo}
                  onChange={(e) => setFormData({ ...formData, prixParKilo: e.target.value })}
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Informations complÃ©mentaires..."
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Publier le trajet
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

      {/* Filtres de recherche */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Filtrer les trajets</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            className="input-field"
            placeholder="Ville de dÃ©part"
            value={filters.villeDepart}
            onChange={(e) => setFilters({ ...filters, villeDepart: e.target.value })}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Ville d'arrivÃ©e"
            value={filters.villeArrivee}
            onChange={(e) => setFilters({ ...filters, villeArrivee: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-6">
        <AdBanner placement="trajets_results" variant="banner" intent="browse_trajets" />
      </div>

      {/* Liste des trajets */}
      <div className="space-y-4">
        {trajets.length === 0 ? (
          <div className="card text-center py-12">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun trajet trouvÃ©</p>
          </div>
        ) : (
          trajets.map((trajet) => (
            <div key={trajet.id} className="card hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="font-bold text-lg">
                      {trajet.villeDepart} â†’ {trajet.villeArrivee}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(trajet.dateVoyage), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      {trajet.kilosDisponibles} kg disponibles
                    </div>
                    <div className="font-semibold text-primary-600">
                      {trajet.prixParKilo}â‚¬ / kg
                    </div>
                  </div>

                  {trajet.description && (
                    <p className="text-gray-600 text-sm mb-3">{trajet.description}</p>
                  )}

                  <div className="text-sm text-gray-500">
                    ProposÃ© par <span className="font-medium">{trajet.user.name}</span>
                  </div>
                </div>

                <div className="ml-4">
                  {session?.user.id === trajet.user.id ? (
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                      Votre trajet
                    </span>
                  ) : (
                    userCanContactVoyageur && (
                      <button
                        onClick={() => {
                          if (myColis.length === 0) {
                            alert('Vous devez d\'abord creer un colis pour contacter ce voyageur.')
                            return
                          }
                          setContactTrajetId(trajet.id)
                          if (!selectedColisId && myColis[0]) {
                            setSelectedColisId(myColis[0].id)
                          }
                        }}
                        className="btn-primary"
                      >
                        Contacter
                      </button>
                    )
                  )}
                </div>
              </div>

              {contactTrajetId === trajet.id && userCanContactVoyageur && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">Choisissez le colis a proposer :</p>
                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      className="input-field"
                      value={selectedColisId}
                      onChange={(e) => setSelectedColisId(e.target.value)}
                    >
                      {myColis.map((c) => (
                        <option key={c.id} value={c.id}>
                          {`${c.villeEnvoi} -> ${c.villeReception}`}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          if (!selectedColisId) {
                            alert('Veuillez selectionner un colis.')
                            return
                          }
                          handleContact(trajet.id, selectedColisId)
                        }}
                      >
                        Contacter
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setContactTrajetId(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

