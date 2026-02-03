'use client'

import { useState } from 'react'

export default function FlightsPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comparateur de vols
          </h1>
          <p className="text-gray-600">
            Fonctionnalité bientôt disponible
          </p>
          <p className="text-gray-500 mt-4">
            Nous préparons un comparateur fiable et transparent pour vous aider à trouver le meilleur vol.
          </p>

          <div className="mt-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  type="email"
                  className="input-field max-w-sm"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn-primary" type="submit">
                  Recevoir une notification
                </button>
              </form>
            ) : (
              <div className="text-green-700 bg-green-50 p-3 rounded-lg">
                Merci ! Nous vous préviendrons au lancement.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
