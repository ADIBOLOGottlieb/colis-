'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Package,
  Plane,
  Mail,
  Phone,
  Shield,
  Loader2,
  MapPin,
  Weight,
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { UserRole, ActiveMode, canCreateColis, canCreateTrajet } from '../../types/auth'
import dynamic from 'next/dynamic'

const AdBanner = dynamic(() => import('../../components/AdBanner'), { ssr: false })

interface Colis {
  id: string
  villeEnvoi: string
  villeReception: string
  poids: number
  description: string
  dateEnvoi?: string
  createdAt: string
}

interface Trajet {
  id: string
  villeDepart: string
  villeArrivee: string
  dateVoyage: string
  kilosDisponibles: number
  prixParKilo: number
  description?: string
  createdAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  photo?: string
  role: UserRole
  activeMode?: ActiveMode
  createdAt: string
  colis: Colis[]
  trajets: Trajet[]
  _count?: {
    colis: number
    trajets: number
  }
}

export default function ProfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'colis' | 'trajets'>('colis')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photo: '',
    newPassword: '',
    confirmPassword: ''
  })

  const userCanCreateColis = session?.user ? canCreateColis({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    activeMode: session.user.activeMode
  }) : false

  const userCanCreateTrajet = session?.user ? canCreateTrajet({
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        const parts = (data?.name || '').split(' ')
        const firstName = parts.shift() || ''
        const lastName = parts.join(' ')
        setForm({
          firstName,
          lastName,
          email: data?.email || '',
          phone: data?.phone || '',
          photo: data?.photo || '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError('Erreur lors du chargement du profil')
      }
    } catch (err) {
      setError('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.EXPEDITEUR:
        return 'Expediteur'
      case UserRole.VOYAGEUR:
        return 'Voyageur'
      case UserRole.LES_DEUX:
        return 'Expediteur & Voyageur'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.EXPEDITEUR:
        return 'bg-blue-100 text-blue-800'
      case UserRole.VOYAGEUR:
        return 'bg-green-100 text-green-800'
      case UserRole.LES_DEUX:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActiveModeLabel = (mode?: ActiveMode) => {
    if (!mode) return 'Non defini'
    return mode === ActiveMode.EXPEDITEUR ? 'Expediteur' : 'Voyageur'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Email invalide')
      return
    }

    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caracteres')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
    }

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          photo: form.photo.trim() || undefined,
          newPassword: form.newPassword || undefined,
          confirmPassword: form.confirmPassword || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Erreur lors de la mise a jour')
      }
      setSuccess('Profil mis a jour avec succes')
      await fetchProfile()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdBanner placement="dashboard" variant="banner" />

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {profile?.photo ? (
              <img
                src={profile.photo}
                alt={profile?.name}
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary-600" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.name || session?.user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`badge ${getRoleBadgeColor(session?.user?.role as UserRole)}`}>
                  {getRoleLabel(session?.user?.role as UserRole)}
                </span>
                {session?.user?.role === UserRole.LES_DEUX && session?.user?.activeMode && (
                  <span className="badge bg-gray-100 text-gray-700">
                    Mode actif: {getActiveModeLabel(session.user.activeMode)}
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {profile?.email || session?.user?.email}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {profile.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                <input name="firstName" className="input-field" value={form.firstName} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input name="lastName" className="input-field" value={form.lastName} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
              <input name="phone" className="input-field" value={form.phone} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil (URL)</label>
              <input name="photo" className="input-field" value={form.photo} onChange={handleChange} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input name="newPassword" type="password" className="input-field" value={form.newPassword} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input name="confirmPassword" type="password" className="input-field" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Colis crees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.colis?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trajets proposes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.trajets?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('colis')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'colis'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Mes colis
                </span>
              </button>
              <button
                onClick={() => setActiveTab('trajets')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'trajets'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Mes trajets
                </span>
              </button>
            </nav>
          </div>

          {activeTab === 'colis' && (
            <div className="space-y-4">
              {profile?.colis && profile.colis.length > 0 ? (
                profile.colis.map((colis) => (
                  <div
                    key={colis.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {colis.villeEnvoi}
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <MapPin className="w-4 h-4 text-green-500" />
                          {colis.villeReception}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Weight className="w-4 h-4" />
                            {colis.poids} kg
                          </span>
                          {colis.dateEnvoi && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(colis.dateEnvoi), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {colis.description}
                        </p>
                      </div>
                      <Link
                        href={`/colis`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        Voir details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun colis cree</p>
                  {userCanCreateColis && (
                    <Link
                      href="/colis/nouveau"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
                    >
                      Creer un colis
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trajets' && (
            <div className="space-y-4">
              {profile?.trajets && profile.trajets.length > 0 ? (
                profile.trajets.map((trajet) => (
                  <div
                    key={trajet.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {trajet.villeDepart}
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <MapPin className="w-4 h-4 text-green-500" />
                          {trajet.villeArrivee}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(trajet.dateVoyage), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="w-4 h-4" />
                            {trajet.kilosDisponibles} kg dispo
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {trajet.prixParKilo} EUR/kg
                          </span>
                        </div>
                        {trajet.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {trajet.description}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/trajets`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        Voir details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun trajet propose</p>
                  {userCanCreateTrajet && (
                    <Link
                      href="/trajets/nouveau"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
                    >
                      Proposer un trajet
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Securite
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Membre depuis</p>
                <p className="text-sm text-gray-600">
                  {profile?.createdAt
                    ? format(new Date(profile.createdAt), 'dd MMMM yyyy', { locale: fr })
                    : 'Date inconnue'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
