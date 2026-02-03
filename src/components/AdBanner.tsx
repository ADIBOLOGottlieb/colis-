'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AdCreative, AdVariant, AdPlacement } from '@/modules/ads/adTypes'
import Image from 'next/image'

type AdBannerProps = {
  placement: AdPlacement
  variant: AdVariant
  intent?: 'create_trajet' | 'create_colis' | 'browse_trajets' | 'browse_colis'
  className?: string
}

export default function AdBanner({ placement, variant, intent, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<AdCreative | null>(null)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const sizes = useMemo(() => {
    if (variant === 'square') return 'aspect-square'
    if (variant === 'mini') return 'h-16'
    if (variant === 'native') return 'min-h-[96px]'
    return 'h-28'
  }, [variant])

  useEffect(() => {
    let isMounted = true
    const fetchAd = async () => {
      try {
        const res = await fetch('/api/ads/serve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageType: placement,
            intent
          })
        })
        const data = await res.json()
        if (isMounted && data?.success) {
          setAd(data.data || null)
        }
      } catch {
        if (isMounted) setAd(null)
      } finally {
        if (isMounted) setLoaded(true)
      }
    }
    fetchAd()
    return () => {
      isMounted = false
    }
  }, [placement, intent])

  useEffect(() => {
    if (!ad || !ref.current) return
    let seen = false
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!seen && entry.isIntersecting) {
            seen = true
            fetch('/api/ads/impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adCampaignId: ad.id,
                placement
              })
            }).catch(() => undefined)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ad, placement])

  if (!loaded || !ad) {
    return null
  }

  return (
    <div ref={ref} className={`border border-gray-200 rounded-lg p-3 bg-white ${sizes} ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>Sponsored</span>
        <span>{ad.category}</span>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
          <Image
            src={ad.imageUrl}
            alt={ad.advertiserName}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{ad.title || ad.advertiserName}</div>
          {ad.description && (
            <div className="text-xs text-gray-600 line-clamp-2 mt-1">{ad.description}</div>
          )}
          <button
            className="text-xs text-primary-600 mt-2"
            onClick={() => {
              fetch('/api/ads/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  adCampaignId: ad.id,
                  placement
                })
              }).catch(() => undefined)
              window.open(ad.targetUrl, '_blank', 'noopener,noreferrer')
            }}
          >
            Voir
          </button>
        </div>
      </div>
    </div>
  )
}
