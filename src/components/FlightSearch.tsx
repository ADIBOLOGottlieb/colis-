'use client'

import { useEffect, useState } from 'react'
import { FlightOffer, LocationSuggestion } from '@/types/flights'
import { Plane, Search, Loader2 } from 'lucide-react'

export default function FlightSearch() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<FlightOffer[]>([])
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([])
  const [originQuery, setOriginQuery] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (originQuery.trim().length < 2) {
        setOriginSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/flights/locations?q=${encodeURIComponent(originQuery.trim())}`)
        const data = await res.json()
        if (res.ok) {
          setOriginSuggestions(data?.data || [])
        }
      } catch {
        setOriginSuggestions([])
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [originQuery])

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (destinationQuery.trim().length < 2) {
        setDestinationSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/flights/locations?q=${encodeURIComponent(destinationQuery.trim())}`)
        const data = await res.json()
        if (res.ok) {
          setDestinationSuggestions(data?.data || [])
        }
      } catch {
        setDestinationSuggestions([])
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [destinationQuery])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResults([])

    try {
      const originCode = (origin || originQuery).trim().toUpperCase()
      const destinationCode = (destination || destinationQuery).trim().toUpperCase()

      const res = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originCode,
          destination: destinationCode,
          date
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Erreur lors de la recherche')
      }

      setResults(data?.data || [])
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-6">
      <div className="flex items-center gap-3">
        <Plane className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-bold">Recherche de vols</h2>
      </div>

      <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville départ</label>
          <div className="relative">
            <input
              className="input-field"
              placeholder="Paris ou PAR"
              value={originQuery || origin}
              onChange={(e) => {
                setOriginQuery(e.target.value)
                setOrigin('')
              }}
              required
            />
            {originSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-56 overflow-auto">
                {originSuggestions.map((s) => (
                  <button
                    key={`${s.iataCode}-${s.type}`}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setOrigin(s.iataCode)
                      setOriginQuery('')
                      setOriginSuggestions([])
                    }}
                  >
                    {s.cityName} ({s.iataCode}) - {s.type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville arrivée</label>
          <div className="relative">
            <input
              className="input-field"
              placeholder="Londres ou LON"
              value={destinationQuery || destination}
              onChange={(e) => {
                setDestinationQuery(e.target.value)
                setDestination('')
              }}
              required
            />
            {destinationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-56 overflow-auto">
                {destinationSuggestions.map((s) => (
                  <button
                    key={`${s.iataCode}-${s.type}`}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setDestination(s.iataCode)
                      setDestinationQuery('')
                      setDestinationSuggestions([])
                    }}
                  >
                    {s.cityName} ({s.iataCode}) - {s.type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-gray-500 text-sm">Aucun vol trouvé</div>
      )}

      {results.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((offer, idx) => (
            <div key={`${offer.airline.code}-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500">{offer.airline.code}</div>
                <div className="text-lg font-semibold text-primary-600">
                  {offer.price.total} {offer.price.currency}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                Durée: {offer.duration || 'N/A'}
              </div>
              <div className="text-sm text-gray-700">
                Escales: {offer.stops}
              </div>
              {offer.segments[0] && (
                <div className="text-sm text-gray-600 mt-2">
                  {offer.segments[0].from} → {offer.segments[offer.segments.length - 1].to}
                </div>
              )}
              <div className="mt-4">
                <button className="btn-secondary w-full">Voir le vol</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
