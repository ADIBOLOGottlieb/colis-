'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Package } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'LES_DEUX' as 'EXPEDITEUR' | 'VOYAGEUR' | 'LES_DEUX',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Connexion automatique après inscription
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push('/trajets')
      } else {
        router.push('/auth/signin')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Créer un compte</h2>
          <p className="text-gray-600 mt-2">Rejoignez la communauté Colis Voyageurs</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
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
              Mot de passe * (min. 6 caractères)
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Je suis *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="EXPEDITEUR"
                  checked={formData.role === 'EXPEDITEUR'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Expéditeur uniquement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="VOYAGEUR"
                  checked={formData.role === 'VOYAGEUR'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Voyageur uniquement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="LES_DEUX"
                  checked={formData.role === 'LES_DEUX'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Les deux</span>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-gray-700">
            <p className="font-semibold mb-1">En créant un compte, vous acceptez :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Les <Link href="/cgu" className="text-primary-600 hover:underline">conditions générales d'utilisation</Link></li>
              <li>La <Link href="/confidentialite" className="text-primary-600 hover:underline">politique de confidentialité</Link></li>
              <li>L'interdiction de transporter des objets dangereux</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Déjà inscrit ?{' '}
            <Link href="/auth/signin" className="text-primary-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
