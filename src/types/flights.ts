export interface FlightSegment {
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  carrierCode: string
  flightNumber: string
  stops: number
}

export interface Airline {
  code: string
  name?: string
}

export interface FlightOffer {
  price: {
    total: number
    currency: string
  }
  airline: Airline
  duration: string
  stops: number
  segments: FlightSegment[]
}

export interface FlightSearchParams {
  origin: string
  destination: string
  date: string
  adults: number
}

export interface LocationSuggestion {
  iataCode: string
  name: string
  cityName: string
  countryCode: string
  type: 'AIRPORT' | 'CITY'
}
