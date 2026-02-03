# TypeScript Types: Matching Algorithm

## File: `src/types/matching.ts`

```typescript
/**
 * Matching Algorithm Types
 *
 * Defines all types for the scoring-based matching system
 * between packages (colis) and trips (trajets).
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

/**
 * User's flexibility level for date matching
 */
export enum FlexibilityLevel {
  STRICT = 0,      // No flexibility, exact date only
  FLEXIBLE_1 = 1,  // ±1 day acceptable
  FLEXIBLE_2 = 2,  // ±2 days acceptable
  FLEXIBLE_3 = 3   // ±3 days acceptable
}

/**
 * Package urgency level affects delay tolerance
 */
export enum UrgencyLevel {
  LOW = 0,         // Can wait, flexible
  MEDIUM = 1,      // Normal urgency
  HIGH = 2,        // Urgent delivery needed
  CRITICAL = 3     // Express delivery required
}

/**
 * City match quality levels
 */
export enum CityMatchLevel {
  NONE = 0,           // No match
  SAME_REGION = 10,   // Same region/area
  EXACT = 25          // Exact city match
}

/**
 * Date match quality levels
 */
export enum DateMatchLevel {
  NONE = 0,           // Outside acceptable range
  PLUS_MINUS_3 = 5,   // Within ±3 days
  PLUS_MINUS_2 = 10,  // Within ±2 days
  PLUS_MINUS_1 = 15,  // Within ±1 day
  EXACT = 20          // Same day
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Package data needed for matching
 */
export interface MatchableColis {
  id: string;
  villeEnvoi: string;
  villeReception: string;
  poids: number;
  dateEnvoi: Date | null;
  flexibilite?: FlexibilityLevel;
  urgence?: UrgencyLevel;
  userId: string;
}

/**
 * Trip data needed for matching
 */
export interface MatchableTrajet {
  id: string;
  villeDepart: string;
  villeArrivee: string;
  dateVoyage: Date;
  kilosDisponibles: number;
  prixParKilo: number;
  userId: string;
}

/**
 * Input for single match calculation
 */
export interface MatchInput {
  colis: MatchableColis;
  trajet: MatchableTrajet;
}

/**
 * Options for batch matching operations
 */
export interface MatchOptions {
  /** Minimum score to include in results (0-100) */
  minScore?: number;

  /** Maximum number of results to return */
  limit?: number;

  /** Search radius in days from target date */
  dateSearchRadius?: number;

  /** Include full score breakdown in results */
  includeBreakdown?: boolean;

  /** Sort order for results */
  sortBy?: 'score' | 'date' | 'price';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/**
 * Departure city match details
 */
export interface DepartureScore {
  matched: boolean;
  score: number;      // 0, 10, or 25
  level: CityMatchLevel;
  cities: {
    colis: string;
    trajet: string;
  };
}

/**
 * Arrival city match details
 */
export interface ArrivalScore {
  matched: boolean;
  score: number;      // 0, 10, or 25
  level: CityMatchLevel;
  cities: {
    colis: string;
    trajet: string;
  };
}

/**
 * Date match details
 */
export interface DateScore {
  matched: boolean;
  score: number;      // 0, 5, 10, 15, or 20
  level: DateMatchLevel;
  daysDifference: number;
  colisDate: Date | null;
  trajetDate: Date;
}

/**
 * Weight compatibility details
 */
export interface WeightScore {
  score: number;      // 0-15
  ratio: number;      // available / required
  packageWeight: number;
  availableWeight: number;
  canAccommodate: boolean;
}

/**
 * Time flexibility score details
 */
export interface FlexibilityScore {
  score: number;      // 0-10
  flexibilityLevel: FlexibilityLevel;
  daysWithinFlexibility: number;
}

/**
 * Urgency/delay tolerance score
 */
export interface UrgencyScore {
  score: number;      // 0-5
  urgencyLevel: UrgencyLevel;
  daysDifference: number;
  acceptable: boolean;
}

/**
 * Complete score breakdown
 */
export interface MatchScoreBreakdown {
  primary: {
    departure: DepartureScore;
    arrival: ArrivalScore;
    date: DateScore;
    total: number;        // Max 70
  };
  secondary: {
    weightCompatibility: WeightScore;
    timeFlexibility: FlexibilityScore;
    acceptableDelay: UrgencyScore;
    total: number;        // Max 30
  };
  final: number;          // 0-100

  // Guarantee check
  isExactPrimaryMatch: boolean;
  guaranteedMinimum: number;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Single match result with full details
 */
export interface MatchResult {
  colisId: string;
  trajetId: string;
  score: number;                    // 0-100
  breakdown: MatchScoreBreakdown;

  // Classification flags
  isRecommended: boolean;           // score >= 70
  isExactMatch: boolean;            // score === 100
  isViable: boolean;                // score >= 50

  // Metadata
  calculatedAt: Date;
  expiresAt: Date;                  // Cache expiration
}

/**
 * Batch match results for a package
 */
export interface ColisMatchResults {
  colisId: string;
  totalMatches: number;
  recommendedMatches: number;
  exactMatches: number;
  matches: MatchResult[];

  // Search metadata
  searchParams: {
    dateRange: { start: Date; end: Date };
    minWeight: number;
  };

  generatedAt: Date;
}

/**
 * Batch match results for a trip
 */
export interface TrajetMatchResults {
  trajetId: string;
  totalMatches: number;
  recommendedMatches: number;
  exactMatches: number;
  matches: MatchResult[];

  generatedAt: Date;
}

/**
 * Simplified match result for list views
 */
export interface MatchSummary {
  colisId: string;
  trajetId: string;
  score: number;
  isRecommended: boolean;
  departureMatch: boolean;
  arrivalMatch: boolean;
  dateMatch: boolean;
  weightCompatible: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request to calculate matches for a package
 */
export interface FindMatchesRequest {
  colisId: string;
  options?: MatchOptions;
}

/**
 * Request to calculate matches for a trip
 */
export interface FindTrajetMatchesRequest {
  trajetId: string;
  options?: MatchOptions;
}

/**
 * API response for match calculation
 */
export interface MatchApiResponse {
  success: boolean;
  data?: ColisMatchResults | TrajetMatchResults;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Match notification payload
 */
export interface MatchNotification {
  type: 'NEW_MATCH' | 'SCORE_UPDATED' | 'MATCH_EXPIRED';
  userId: string;
  colisId?: string;
  trajetId?: string;
  matchScore: number;
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Scoring weights configuration
 */
export interface ScoringWeights {
  primary: {
    departure: number;  // 25
    arrival: number;    // 25
    date: number;       // 20
  };
  secondary: {
    weightCompatibility: number;  // 15
    timeFlexibility: number;      // 10
    acceptableDelay: number;      // 5
  };
}

/**
 * Scoring thresholds
 */
export interface ScoringThresholds {
  recommended: number;  // 70 - minimum for "recommended" badge
  viable: number;       // 50 - minimum for "viable" classification
  exact: number;        // 100 - perfect match
}

/**
 * City alias mapping for region matching
 */
export interface CityAliasConfig {
  canonicalName: string;
  aliases: string[];
  region: string;
  country: string;
}

/**
 * Complete matching engine configuration
 */
export interface MatchingConfig {
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
  cityAliases: CityAliasConfig[];
  defaultFlexibility: FlexibilityLevel;
  defaultUrgency: UrgencyLevel;
  cacheTtlMinutes: number;
  maxSearchRadiusDays: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default scoring weights
 * PRIMARY: 70 points total
 * SECONDARY: 30 points total
 * TOTAL: 100 points
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  primary: {
    departure: 25,
    arrival: 25,
    date: 20
  },
  secondary: {
    weightCompatibility: 15,
    timeFlexibility: 10,
    acceptableDelay: 5
  }
};

/**
 * Default scoring thresholds
 */
export const DEFAULT_SCORING_THRESHOLDS: ScoringThresholds = {
  recommended: 70,
  viable: 50,
  exact: 100
};

/**
 * Default matching configuration
 */
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: DEFAULT_SCORING_WEIGHTS,
  thresholds: DEFAULT_SCORING_THRESHOLDS,
  cityAliases: [],
  defaultFlexibility: FlexibilityLevel.FLEXIBLE_1,
  defaultUrgency: UrgencyLevel.MEDIUM,
  cacheTtlMinutes: 30,
  maxSearchRadiusDays: 7
};

/**
 * Score guarantee: minimum score when all primary criteria match
 */
export const PRIMARY_MATCH_GUARANTEE = 70;
```
