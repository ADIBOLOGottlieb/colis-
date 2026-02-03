'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Campaign = {
  id: string
  advertiserName: string
  category: string
  budget: number
  costPerClick: number
  impressions: number
  clicks: number
  isActive: boolean
  startDate: string
  endDate: string
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ads/campaigns')
        const data = await res.json()
        if (res.ok) {
          setCampaigns(data?.data || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campagnes publicitaires</h1>
        <Link href="/ads/new" className="btn-primary">
          Nouvelle campagne
        </Link>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-gray-500">Aucune campagne</div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{c.advertiserName}</div>
                  <div className="text-sm text-gray-500">{c.category}</div>
                </div>
                <div className={`text-sm ${c.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-3 mt-4 text-sm text-gray-600">
                <div>Budget: {c.budget}</div>
                <div>CPC: {c.costPerClick}</div>
                <div>Impressions: {c.impressions}</div>
                <div>Clics: {c.clicks}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
