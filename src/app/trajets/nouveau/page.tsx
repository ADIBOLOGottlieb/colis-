'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plane, ArrowLeft, MapPin, Weight, Calendar, FileText, DollarSign, Loader2 } from 'lucide-react'
import { canCreateTrajet } from '@/types/auth'
import dynamic from 'next/dynamic'

const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false })

export default function NouveauTrajetPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    dateVoyage: '',
    kilosDisponibles: '',
    prixParKilo: '',
    description: '',
  })

  // Check if user can create trajet
  const userCanCreateTrajet = session?.user ? canCreateTrajet({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trajets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villeDepart: formData.villeDepart,
          villeArrivee: formData.villeArrivee,
          dateVoyage: formData.dateVoyage,
          kilosDisponibles: parseFloat(formData.kilosDisponibles),
          prixParKilo: parseFloat(formData.prixParKilo),
          description: formData.description || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du trajet')
      }

      // Redirect to trajets list on success
      router.push('/trajets')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Show access denied if user cannot create trajet
  if (!userCanCreateTrajet) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 mb-6">
              Votre rôle ne vous permet pas de créer des trajets. Seuls les voyageurs peuvent créer des trajets.
            </p>
            <Link
              href="/trajets"
              className="inline-flex items-center gap-2 btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux trajets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/trajets"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux trajets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau trajet</h1>
          <p className="text-gray-600 mt-1">
            Proposez votre trajet pour transporter des colis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          <AdBanner placement="trajet_create" variant="mini" intent="create_trajet" />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Ville de départ */}
          <div>
            <label htmlFor="villeDepart" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Ville de départ *
              </span>
            </label>
            <input
              type="text"
              id="villeDepart"
              name="villeDepart"
              required
              minLength={2}
              placeholder="Ex: Paris"
              className="input-field"
              value={formData.villeDepart}
              onChange={handleChange}
            />
          </div>

          {/* Ville d'arrivée */}
          <div>
            <label htmlFor="villeArrivee" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Ville d'arrivée *
              </span>
            </label>
            <input
              type="text"
              id="villeArrivee"
              name="villeArrivee"
              required
              minLength={2}
              placeholder="Ex: Lomé"
              className="input-field"
              value={formData.villeArrivee}
              onChange={handleChange}
            />
          </div>

          {/* Date de voyage */}
          <div>
            <label htmlFor="dateVoyage" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date de voyage *
              </span>
            </label>
            <input
              type="date"
              id="dateVoyage"
              name="dateVoyage"
              required
              className="input-field"
              value={formData.dateVoyage}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Kilos disponibles */}
          <div>
            <label htmlFor="kilosDisponibles" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                Kilos disponibles *
              </span>
            </label>
            <input
              type="number"
              id="kilosDisponibles"
              name="kilosDisponibles"
              required
              min="0.1"
              step="0.1"
              placeholder="Ex: 20"
              className="input-field"
              value={formData.kilosDisponibles}
              onChange={handleChange}
            />
          </div>

          {/* Prix par kilo */}
          <div>
            <label htmlFor="prixParKilo" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Prix par kilo (€) *
              </span>
            </label>
            <input
              type="number"
              id="prixParKilo"
              name="prixParKilo"
              required
              min="0"
              step="0.01"
              placeholder="Ex: 5.00"
              className="input-field"
              value={formData.prixParKilo}
              onChange={handleChange}
            />
          </div>

          {/* Description (optional) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Description (optionnel)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Décrivez votre trajet (compagnie aérienne, escales, contraintes, etc.)"
              className="input-field resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4" />
                  Créer le trajet
                </>
              )}
            </button>
            <Link
              href="/trajets"
              className="btn-secondary text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
