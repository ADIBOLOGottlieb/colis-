import 'server-only'
import { FlightOffer, FlightSearchParams, LocationSuggestion } from '@/types/flights'

const TOKEN_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
const FLIGHTS_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers'
const LOCATIONS_URL = 'https://test.api.amadeus.com/v1/reference-data/locations'

const REQUEST_TIMEOUT_MS = 8000
const MAX_RETRIES = 2
const CACHE_TTL_MS = 10 * 60 * 1000

type TokenCache = {
  token: string
  expiresAt: number
}

const tokenCache: TokenCache = {
  token: '',
  expiresAt: 0
}

const searchCache = new Map<string, { expiresAt: number; data: FlightOffer[] }>()
const locationCache = new Map<string, { expiresAt: number; data: LocationSuggestion[] }>()

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function buildCacheKey(params: FlightSearchParams): string {
  return `${params.origin}-${params.destination}-${params.date}-${params.adults}`
}

function nowMs(): number {
  return Date.now()
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
  retries: number
): Promise<Response> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      const res = await fetchWithTimeout(input, init, REQUEST_TIMEOUT_MS)
      if (res.ok) return res
      lastError = new Error(`HTTP ${res.status}`)
    } catch (error) {
      lastError = error
    }

    if (attempt === retries) break
    const backoff = 300 * Math.pow(2, attempt)
    await new Promise(resolve => setTimeout(resolve, backoff))
    attempt += 1
  }

  throw lastError
}

async function getAccessToken(): Promise<string> {
  const now = nowMs()
  if (tokenCache.token && tokenCache.expiresAt > now + 10_000) {
    return tokenCache.token
  }

  const apiKey = getEnv('FLIGHT_API_KEY')
  const apiSecret = getEnv('FLIGHT_API_SECRET')

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: apiSecret
  })

  const res = await fetchWithRetry(
    TOKEN_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    },
    MAX_RETRIES
  )

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`)
  }

  const data = await res.json()
  const token = data.access_token as string
  const expiresIn = Number(data.expires_in || 0)
  tokenCache.token = token
  tokenCache.expiresAt = now + expiresIn * 1000
  return token
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord
  }
  return null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseOffers(apiData: unknown): FlightOffer[] {
  const root = asRecord(apiData)
  const offers = root ? asArray(root.data) : []

  return offers.map((offerValue) => {
    const offer = asRecord(offerValue) || {}
    const itineraries = asArray(offer.itineraries)
    const firstItinerary = asRecord(itineraries[0]) || {}
    const segmentsRaw = asArray(firstItinerary.segments)

    const segments = segmentsRaw.map((segValue) => {
      const seg = asRecord(segValue) || {}
      const departure = asRecord(seg.departure) || {}
      const arrival = asRecord(seg.arrival) || {}
      return {
        from: asString(departure.iataCode),
        to: asString(arrival.iataCode),
        departureTime: asString(departure.at),
        arrivalTime: asString(arrival.at),
        duration: asString(seg.duration),
        carrierCode: asString(seg.carrierCode),
        flightNumber: asString(seg.number),
        stops: asNumber(seg.numberOfStops, 0)
      }
    })

    const validating = asArray(offer.validatingAirlineCodes)
    const carrierCode = segments[0]?.carrierCode || asString(validating[0])
    const price = asRecord(offer.price) || {}
    const priceTotal = asNumber(price.total, 0)
    const currency = asString(price.currency, 'EUR')

    return {
      price: {
        total: priceTotal,
        currency
      },
      airline: {
        code: carrierCode
      },
      duration: asString(firstItinerary.duration),
      stops: Math.max(segments.length - 1, 0),
      segments
    }
  })
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const cacheKey = buildCacheKey(params)
  const cached = searchCache.get(cacheKey)
  const now = nowMs()
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const token = await getAccessToken()

  const query = new URLSearchParams({
    originLocationCode: params.origin.toUpperCase(),
    destinationLocationCode: params.destination.toUpperCase(),
    departureDate: params.date,
    adults: String(params.adults || 1),
    currencyCode: 'EUR',
    max: '10'
  })

  const res = await fetchWithRetry(
    `${FLIGHTS_URL}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    MAX_RETRIES
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Flight search failed: ${res.status} ${body}`)
  }

  const data: unknown = await res.json()
  const offers = parseOffers(data)

  searchCache.set(cacheKey, { data: offers, expiresAt: now + CACHE_TTL_MS })
  return offers
}

export async function searchLocations(keyword: string): Promise<LocationSuggestion[]> {
  const normalized = keyword.trim().toUpperCase()
  if (normalized.length < 2) return []

  const cached = locationCache.get(normalized)
  const now = nowMs()
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const token = await getAccessToken()
  const query = new URLSearchParams({
    keyword: normalized,
    subType: 'CITY,AIRPORT',
    view: 'LIGHT'
  })
  query.append('page[limit]', '10')

  const res = await fetchWithRetry(
    `${LOCATIONS_URL}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    MAX_RETRIES
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Location search failed: ${res.status} ${body}`)
  }

  const data: unknown = await res.json()
  const root = asRecord(data)
  const items = root ? asArray(root.data) : []
  const suggestions = items.map((item) => {
    const obj = asRecord(item) || {}
    const name = asString(obj.name)
    const iataCode = asString(obj.iataCode)
    const type = asString(obj.subType) as 'AIRPORT' | 'CITY'
    const address = asRecord(obj.address) || {}
    const cityName = asString(address.cityName)
    const countryCode = asString(address.countryCode)

    return {
      iataCode,
      name,
      cityName,
      countryCode,
      type: type === 'AIRPORT' ? 'AIRPORT' : 'CITY'
    }
  })

  locationCache.set(normalized, { data: suggestions, expiresAt: now + CACHE_TTL_MS })
  return suggestions
}
