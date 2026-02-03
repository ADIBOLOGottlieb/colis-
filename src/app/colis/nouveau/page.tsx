'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowLeft, MapPin, Weight, Calendar, FileText, Loader2 } from 'lucide-react'
import { canCreateColis } from '@/types/auth'
import dynamic from 'next/dynamic'

const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false })

export default function NouveauColisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    villeEnvoi: '',
    villeReception: '',
    poids: '',
    description: '',
    dateEnvoi: '',
  })

  // Check if user can create colis
  const userCanCreateColis = session?.user ? canCreateColis({
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
      const res = await fetch('/api/colis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villeEnvoi: formData.villeEnvoi,
          villeReception: formData.villeReception,
          poids: parseFloat(formData.poids),
          description: formData.description,
          dateEnvoi: formData.dateEnvoi || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du colis')
      }

      // Redirect to colis list on success
      router.push('/colis')
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

  // Show access denied if user cannot create colis
  if (!userCanCreateColis) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 mb-6">
              Votre rôle ne vous permet pas de créer des colis. Seuls les expéditeurs peuvent créer des colis.
            </p>
            <Link
              href="/colis"
              className="inline-flex items-center gap-2 btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux colis
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
            href="/colis"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux colis
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau colis</h1>
          <p className="text-gray-600 mt-1">
            Créez une annonce pour envoyer votre colis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          <AdBanner placement="colis_create" variant="mini" intent="create_colis" />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Ville d'envoi */}
          <div>
            <label htmlFor="villeEnvoi" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Ville d'envoi *
              </span>
            </label>
            <input
              type="text"
              id="villeEnvoi"
              name="villeEnvoi"
              required
              minLength={2}
              placeholder="Ex: Paris"
              className="input-field"
              value={formData.villeEnvoi}
              onChange={handleChange}
            />
          </div>

          {/* Ville de réception */}
          <div>
            <label htmlFor="villeReception" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Ville de réception *
              </span>
            </label>
            <input
              type="text"
              id="villeReception"
              name="villeReception"
              required
              minLength={2}
              placeholder="Ex: Lomé"
              className="input-field"
              value={formData.villeReception}
              onChange={handleChange}
            />
          </div>

          {/* Poids */}
          <div>
            <label htmlFor="poids" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                Poids (kg) *
              </span>
            </label>
            <input
              type="number"
              id="poids"
              name="poids"
              required
              min="0.1"
              step="0.1"
              placeholder="Ex: 5.5"
              className="input-field"
              value={formData.poids}
              onChange={handleChange}
            />
          </div>

          {/* Date d'envoi (optional) */}
          <div>
            <label htmlFor="dateEnvoi" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date d'envoi souhaitée (optionnel)
              </span>
            </label>
            <input
              type="date"
              id="dateEnvoi"
              name="dateEnvoi"
              className="input-field"
              value={formData.dateEnvoi}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Description *
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="Décrivez votre colis (contenu, dimensions, fragilité, etc.)"
              className="input-field resize-none"
              value={formData.description}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 caractères
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Créer le colis
                </>
              )}
            </button>
            <Link
              href="/colis"
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
