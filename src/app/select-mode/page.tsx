'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SelectModePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.activeMode) {
      router.push('/profil')
    }
  }, [session?.user?.activeMode, router])

  const handleSelect = async (mode: 'EXPEDITEUR' | 'VOYAGEUR') => {
    setLoading(true)
    await update({ activeMode: mode })
    router.push('/profil')
    router.refresh()
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Choisissez votre mode</h1>
        <p className="text-gray-600">Votre mode actif détermine vos permissions.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelect('EXPEDITEUR')}
            className="card text-left hover:shadow-md transition"
            disabled={loading}
          >
            <h2 className="text-xl font-semibold mb-2">Envoyer un colis</h2>
            <p className="text-gray-600">
              Publiez un colis et trouvez un voyageur avec des kilos disponibles.
            </p>
          </button>

          <button
            onClick={() => handleSelect('VOYAGEUR')}
            className="card text-left hover:shadow-md transition"
            disabled={loading}
          >
            <h2 className="text-xl font-semibold mb-2">Voyager avec des kilos disponibles</h2>
            <p className="text-gray-600">
              Publiez votre trajet et proposez vos kilos disponibles.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
