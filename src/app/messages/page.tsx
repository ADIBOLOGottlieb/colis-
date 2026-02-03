'use client'

import { Suspense } from 'react'
import MessagesContent from './MessagesContent'

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p>Chargement...</p>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
