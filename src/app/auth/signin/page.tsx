'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [activeMode, setActiveMode] = useState<'EXPEDITEUR' | 'VOYAGEUR' | ''>('')
  const [modeRequired, setModeRequired] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (modeRequired && !activeMode) {
        setError('Veuillez sélectionner un mode actif')
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        activeMode: activeMode || undefined,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'MODE_SELECTION_REQUIRED') {
          setModeRequired(true)
          setError('Sélectionnez votre mode actif pour vous connecter')
        } else {
          setError('Email ou mot de passe incorrect')
        }
      } else {
        router.push('/trajets')
        router.refresh()
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Connexion</h2>
          <p className="text-gray-600 mt-2">Accédez à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {modeRequired && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
              <p className="text-yellow-800 font-medium mb-2">Choisissez votre mode actif</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="activeMode"
                    value="EXPEDITEUR"
                    checked={activeMode === 'EXPEDITEUR'}
                    onChange={(e) => setActiveMode(e.target.value as any)}
                  />
                  Expéditeur
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="activeMode"
                    value="VOYAGEUR"
                    checked={activeMode === 'VOYAGEUR'}
                    onChange={(e) => setActiveMode(e.target.value as any)}
                  />
                  Voyageur
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
              S'inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
