'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const categories = [
  'airline',
  'gaming',
  'travel',
  'fintech',
  'transport',
  'insurance',
  'other'
]

export default function NewAdCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    advertiserName: '',
    category: 'airline',
    imageUrl: '',
    targetUrl: '',
    title: '',
    description: '',
    budget: '',
    costPerClick: '',
    priority: '0',
    startDate: '',
    endDate: '',
    isActive: true
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserName: form.advertiserName,
          category: form.category,
          imageUrl: form.imageUrl,
          targetUrl: form.targetUrl,
          title: form.title || undefined,
          description: form.description || undefined,
          budget: Number(form.budget),
          costPerClick: Number(form.costPerClick),
          priority: Number(form.priority),
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: form.isActive
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Erreur')
      }
      router.push('/ads')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle campagne</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annonceur</label>
          <input name="advertiserName" className="input-field" value={form.advertiserName} onChange={handleChange} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select name="category" className="input-field" value={form.category} onChange={handleChange}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input name="imageUrl" className="input-field" value={form.imageUrl} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
            <input name="targetUrl" className="input-field" value={form.targetUrl} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input name="budget" type="number" className="input-field" value={form.budget} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPC</label>
            <input name="costPerClick" type="number" className="input-field" value={form.costPerClick} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
            <input name="startDate" type="date" className="input-field" value={form.startDate} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
            <input name="endDate" type="date" className="input-field" value={form.endDate} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité (0-10)</label>
          <input name="priority" type="number" className="input-field" value={form.priority} onChange={handleChange} />
        </div>

        <div className="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} />
          <span className="text-sm text-gray-700">Actif</span>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push('/ads')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
