export type AdCategory =
  | 'airline'
  | 'gaming'
  | 'travel'
  | 'fintech'
  | 'transport'
  | 'insurance'
  | 'other'

export type AdPlacement =
  | 'trajets_results'
  | 'colis_results'
  | 'dashboard'
  | 'trajet_create'
  | 'colis_create'
  | 'native_list'
  | 'mini_sponsor'

export type AdVariant = 'banner' | 'square' | 'native' | 'mini'

export type UserContext = {
  userId: string
  role?: 'EXPEDITEUR' | 'VOYAGEUR' | 'LES_DEUX'
  activeMode?: 'EXPEDITEUR' | 'VOYAGEUR'
  pageType: AdPlacement
  intent?: 'create_trajet' | 'create_colis' | 'browse_trajets' | 'browse_colis'
  countryCode?: string
}

export type AdCreative = {
  id: string
  advertiserName: string
  category: AdCategory
  imageUrl: string
  targetUrl: string
  title?: string
  description?: string
  priority: number
}

export type AdCandidate = AdCreative & {
  remainingBudget: number
  score: number
}

export type AdProvider = {
  name: string
  getBestAd: (context: UserContext) => Promise<AdCreative | null>
}
