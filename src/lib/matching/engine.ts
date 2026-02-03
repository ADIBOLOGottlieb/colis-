/**
 * Matching Algorithm Engine
 *
 * Implements a scoring-based matching system between packages (colis)
 * and trips (trajets) with explicit formulas and guarantees.
 *
 * SCORING FORMULA:
 *   FINAL_SCORE = PRIMARY_SCORE (max 70) + SECONDARY_SCORE (max 30)
 *
 * PRIMARY CRITERIA (70 points):
 *   - Same departure city: 25 points
 *   - Same arrival city: 25 points
 *   - Same date: 20 points
 *
 * SECONDARY CRITERIA (30 points):
 *   - Weight compatibility: 0-15 points
 *   - Time flexibility: 0-10 points
 *   - Acceptable delay: 0-5 points
 *
 * GUARANTEE: If date + departure + arrival are identical, score >= 70
 */

import {
  differenceInDays,
  addDays,
  subDays,
  isSameDay,
  isValid
} from 'date-fns';
import { prisma } from '@/lib/prisma';
import {
  MatchInput,
  MatchResult,
  MatchScoreBreakdown,
  MatchOptions,
  ColisMatchResults,
  TrajetMatchResults,
  DepartureScore,
  ArrivalScore,
  DateScore,
  FlexibilityLevel,
  UrgencyLevel,
  CityMatchLevel,
  DateMatchLevel,
  DEFAULT_MATCHING_CONFIG,
  PRIMARY_MATCH_GUARANTEE
} from '@/types/matching';

// ============================================================================
// CORE MATCHING FUNCTION
// ============================================================================

/**
 * Calculate match score between a package and a trip
 *
 * GUARANTEE: If date + departure + arrival are identical,
 * the score will be at least 70 (primary criteria max).
 *
 * @param input - MatchInput containing colis and trajet
 * @returns MatchResult with full score breakdown
 */
export function calculateMatch(input: MatchInput): MatchResult {
  const { colis, trajet } = input;

  // Validate inputs
  validateMatchInput(input);

  // ============================================================
  // PRIMARY CRITERIA (70 points max)
  // ============================================================

  const departureScore = calculateDepartureScore(
    colis.villeEnvoi,
    trajet.villeDepart
  );

  const arrivalScore = calculateArrivalScore(
    colis.villeReception,
    trajet.villeArrivee
  );

  const dateScore = calculateDateScore(
    colis.dateEnvoi,
    trajet.dateVoyage,
    colis.flexibilite ?? FlexibilityLevel.FLEXIBLE_1
  );

  const primaryTotal = departureScore.score + arrivalScore.score + dateScore.score;

  // ============================================================
  // SECONDARY CRITERIA (30 points max)
  // ============================================================

  const weightScore = calculateWeightScore(
    colis.poids,
    trajet.kilosDisponibles
  );

  const flexibilityScore = calculateFlexibilityScore(
    dateScore.daysDifference,
    colis.flexibilite ?? FlexibilityLevel.FLEXIBLE_1
  );

  const urgencyScore = calculateUrgencyScore(
    dateScore.daysDifference,
    colis.urgence ?? UrgencyLevel.MEDIUM
  );

  const secondaryTotal = weightScore.score + flexibilityScore + urgencyScore;

  // ============================================================
  // FINAL SCORE CALCULATION
  // ============================================================

  const rawScore = primaryTotal + secondaryTotal;

  // GUARANTEE CHECK: If all primary criteria match exactly, score >= 70
  const isExactPrimaryMatch =
    departureScore.score === 25 &&
    arrivalScore.score === 25 &&
    dateScore.score === 20;

  const guaranteedScore = isExactPrimaryMatch
    ? Math.max(rawScore, PRIMARY_MATCH_GUARANTEE)
    : rawScore;

  // Build breakdown
  const breakdown: MatchScoreBreakdown = {
    primary: {
      departure: departureScore,
      arrival: arrivalScore,
      date: dateScore,
      total: primaryTotal
    },
    secondary: {
      weightCompatibility: {
        score: weightScore.score,
        ratio: weightScore.ratio,
        packageWeight: colis.poids,
        availableWeight: trajet.kilosDisponibles,
        canAccommodate: weightScore.canAccommodate
      },
      timeFlexibility: {
        score: flexibilityScore,
        flexibilityLevel: colis.flexibilite ?? FlexibilityLevel.FLEXIBLE_1,
        daysWithinFlexibility: Math.max(0,
          (colis.flexibilite ?? 1) - dateScore.daysDifference
        )
      },
      acceptableDelay: {
        score: urgencyScore,
        urgencyLevel: colis.urgence ?? UrgencyLevel.MEDIUM,
        daysDifference: dateScore.daysDifference,
        acceptable: urgencyScore > 0
      },
      total: secondaryTotal
    },
    final: guaranteedScore,
    isExactPrimaryMatch,
    guaranteedMinimum: isExactPrimaryMatch ? PRIMARY_MATCH_GUARANTEE : 0
  };

  return {
    colisId: colis.id,
    trajetId: trajet.id,
    score: guaranteedScore,
    breakdown,
    isRecommended: guaranteedScore >= 70,
    isExactMatch: guaranteedScore === 100,
    isViable: guaranteedScore >= 50,
    calculatedAt: new Date(),
    expiresAt: addDays(new Date(), 1) // Cache for 24 hours
  };
}

// ============================================================================
// PRIMARY CRITERIA CALCULATIONS
// ============================================================================

/**
 * Calculate departure city match score
 *
 * Scoring:
 *   - Exact match: 25 points
 *   - Same region: 10 points
 *   - No match: 0 points
 */
function calculateDepartureScore(
  colisCity: string,
  trajetCity: string
): DepartureScore {
  const normalizedColis = normalizeCityName(colisCity);
  const normalizedTrajet = normalizeCityName(trajetCity);

  // Exact match check
  if (normalizedColis === normalizedTrajet) {
    return {
      matched: true,
      score: CityMatchLevel.EXACT,
      level: CityMatchLevel.EXACT,
      cities: { colis: colisCity, trajet: trajetCity }
    };
  }

  // Same region check (using city alias database)
  if (areCitiesInSameRegion(normalizedColis, normalizedTrajet)) {
    return {
      matched: false,
      score: CityMatchLevel.SAME_REGION,
      level: CityMatchLevel.SAME_REGION,
      cities: { colis: colisCity, trajet: trajetCity }
    };
  }

  // No match
  return {
    matched: false,
    score: CityMatchLevel.NONE,
    level: CityMatchLevel.NONE,
    cities: { colis: colisCity, trajet: trajetCity }
  };
}

/**
 * Calculate arrival city match score
 * Same scoring as departure
 */
function calculateArrivalScore(
  colisCity: string,
  trajetCity: string
): ArrivalScore {
  // Reuse departure logic (same scoring)
  const departureResult = calculateDepartureScore(colisCity, trajetCity);

  return {
    matched: departureResult.matched,
    score: departureResult.score,
    level: departureResult.level,
    cities: departureResult.cities
  };
}

/**
 * Calculate date match score
 *
 * Scoring:
 *   - Same day: 20 points
 *   - ±1 day: 15 points
 *   - ±2 days: 10 points
 *   - ±3 days: 5 points
 *   - >3 days: 0 points
 *
 * If no date specified by sender, uses flexibility preference
 */
function calculateDateScore(
  colisDate: Date | null,
  trajetDate: Date,
  flexibility: FlexibilityLevel
): DateScore {
  // Validate trajet date
  if (!isValid(trajetDate)) {
    throw new Error('Invalid trajet date');
  }

  // If no date specified, give neutral score
  if (!colisDate || !isValid(colisDate)) {
    return {
      matched: false,
      score: 5,  // Neutral for no date
      level: DateMatchLevel.NONE,
      daysDifference: Infinity,
      colisDate: null,
      trajetDate
    };
  }

  // Calculate absolute difference in days
  const daysDiff = Math.abs(differenceInDays(colisDate, trajetDate));

  // Same day = exact match
  if (isSameDay(colisDate, trajetDate)) {
    return {
      matched: true,
      score: DateMatchLevel.EXACT,
      level: DateMatchLevel.EXACT,
      daysDifference: 0,
      colisDate,
      trajetDate
    };
  }

  // Within ±1 day
  if (daysDiff <= 1) {
    return {
      matched: true,
      score: DateMatchLevel.PLUS_MINUS_1,
      level: DateMatchLevel.PLUS_MINUS_1,
      daysDifference: daysDiff,
      colisDate,
      trajetDate
    };
  }

  // Within ±2 days
  if (daysDiff <= 2) {
    return {
      matched: true,
      score: DateMatchLevel.PLUS_MINUS_2,
      level: DateMatchLevel.PLUS_MINUS_2,
      daysDifference: daysDiff,
      colisDate,
      trajetDate
    };
  }

  // Within ±3 days
  if (daysDiff <= 3) {
    return {
      matched: true,
      score: DateMatchLevel.PLUS_MINUS_3,
      level: DateMatchLevel.PLUS_MINUS_3,
      daysDifference: daysDiff,
      colisDate,
      trajetDate
    };
  }

  // Check if within user's flexibility window
  if (daysDiff <= flexibility) {
    // Partial credit based on flexibility
    const partialScore = Math.max(1, 5 - (daysDiff - 3));
    return {
      matched: true,
      score: partialScore,
      level: DateMatchLevel.NONE,
      daysDifference: daysDiff,
      colisDate,
      trajetDate
    };
  }

  // Outside acceptable range
  return {
    matched: false,
    score: DateMatchLevel.NONE,
    level: DateMatchLevel.NONE,
    daysDifference: daysDiff,
    colisDate,
    trajetDate
  };
}

// ============================================================================
// SECONDARY CRITERIA CALCULATIONS
// ============================================================================

/**
 * Calculate weight compatibility score (0-15 points)
 *
 * Formula: score = 15 * min(1, ratio_factor)
 *
 * Where ratio_factor depends on available/required ratio:
 *   - ratio >= 1 and <= 1.5: 1.0 (perfect fit)
 *   - ratio <= 2.0: 0.8 (good fit)
 *   - ratio <= 3.0: 0.67 (adequate)
 *   - ratio <= 5.0: 0.53 (plenty of space)
 *   - ratio > 5.0: 0.33 (excessive, possible data quality issue)
 *
 * If available < required: 0 points (cannot accommodate)
 */
function calculateWeightScore(
  packageWeight: number,
  availableWeight: number
): { score: number; ratio: number; canAccommodate: boolean } {
  // Cannot accommodate
  if (availableWeight < packageWeight) {
    return {
      score: 0,
      ratio: availableWeight / packageWeight,
      canAccommodate: false
    };
  }

  const ratio = availableWeight / packageWeight;
  let score: number;

  // Perfect fit or slight excess
  if (ratio >= 1 && ratio <= 1.5) {
    score = 15;
  }
  // Good fit
  else if (ratio <= 2.0) {
    score = 12;
  }
  // Adequate
  else if (ratio <= 3.0) {
    score = 10;
  }
  // Plenty of space
  else if (ratio <= 5.0) {
    score = 8;
  }
  // Excessive space (might indicate data quality issue)
  else {
    score = 5;
  }

  return {
    score,
    ratio,
    canAccommodate: true
  };
}

/**
 * Calculate time flexibility score (0-10 points)
 *
 * Rewards matches that are well within the user's flexibility window.
 *
 * Formula: score = 10 * (1 - daysDiff / (flexibility + 1))
 *
 * Examples:
 *   - flexibility=1, daysDiff=0: 10 * (1 - 0/2) = 10
 *   - flexibility=1, daysDiff=1: 10 * (1 - 1/2) = 5
 *   - flexibility=3, daysDiff=1: 10 * (1 - 1/4) = 7.5
 */
function calculateFlexibilityScore(
  daysDifference: number,
  flexibility: FlexibilityLevel
): number {
  if (daysDifference === 0) {
    return 10; // Perfect date match
  }

  // If outside flexibility window, no flexibility bonus
  if (daysDifference > flexibility) {
    return 0;
  }

  // Calculate score based on how well it fits within flexibility
  const score = 10 * (1 - (daysDifference / (flexibility + 1)));

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate urgency/delay tolerance score (0-5 points)
 *
 * Higher urgency = less tolerance for delay
 *
 * Scoring based on urgency level and days difference:
 *   - URGENCY.LOW: Tolerates up to 5 days
 *   - URGENCY.MEDIUM: Tolerates up to 3 days
 *   - URGENCY.HIGH: Tolerates up to 1 day
 *   - URGENCY.CRITICAL: No tolerance, exact date only
 */
function calculateUrgencyScore(
  daysDifference: number,
  urgency: UrgencyLevel
): number {
  // Define tolerance windows by urgency
  const toleranceWindows: Record<UrgencyLevel, number> = {
    [UrgencyLevel.LOW]: 5,
    [UrgencyLevel.MEDIUM]: 3,
    [UrgencyLevel.HIGH]: 1,
    [UrgencyLevel.CRITICAL]: 0
  };

  const tolerance = toleranceWindows[urgency];

  // If outside tolerance, score is 0
  if (daysDifference > tolerance) {
    return 0;
  }

  // Score inversely proportional to delay within tolerance
  if (tolerance === 0) {
    return daysDifference === 0 ? 5 : 0;
  }

  const score = 5 * (1 - (daysDifference / (tolerance + 1)));
  return Math.round(score * 10) / 10;
}

// ============================================================================
// BATCH MATCHING FUNCTIONS
// ============================================================================

/**
 * Find all matching trips for a package
 *
 * @param colisId - Package ID
 * @param options - Matching options
 * @returns ColisMatchResults with scored matches
 */
export async function findMatchesForColis(
  colisId: string,
  options: MatchOptions = {}
): Promise<ColisMatchResults> {
  // Fetch package details
  const colis = await prisma.colis.findUnique({
    where: { id: colisId }
  });

  if (!colis) {
    throw new Error(`Colis not found: ${colisId}`);
  }

  // Determine search window
  const searchRadius = options.dateSearchRadius ??
    DEFAULT_MATCHING_CONFIG.maxSearchRadiusDays;

  const targetDate = colis.dateEnvoi ?? new Date();
  const searchStart = subDays(targetDate, searchRadius);
  const searchEnd = addDays(targetDate, searchRadius);

  // Find candidate trips
  // Optimization: Pre-filter by weight and date
  const candidates = await prisma.trajet.findMany({
    where: {
      AND: [
        // Date within search window
        {
          dateVoyage: {
            gte: searchStart,
            lte: searchEnd
          }
        },
        // Can accommodate weight
        {
          kilosDisponibles: {
            gte: colis.poids
          }
        },
        // Exclude user's own trips
        {
          userId: {
            not: colis.userId
          }
        }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  // Calculate scores for all candidates
  const matches = candidates.map(trajet =>
    calculateMatch({
      colis: {
        ...colis,
        flexibilite: FlexibilityLevel.FLEXIBLE_1, // Default if not set
        urgence: UrgencyLevel.MEDIUM
      },
      trajet
    })
  );

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Apply minimum score filter
  const minScore = options.minScore ?? 0;
  const filteredMatches = matches.filter(m => m.score >= minScore);

  // Apply limit
  const limit = options.limit ?? filteredMatches.length;
  const limitedMatches = filteredMatches.slice(0, limit);

  return {
    colisId,
    totalMatches: filteredMatches.length,
    recommendedMatches: filteredMatches.filter(m => m.isRecommended).length,
    exactMatches: filteredMatches.filter(m => m.isExactMatch).length,
    matches: options.includeBreakdown !== false ? limitedMatches :
      limitedMatches.map(m => ({
        ...m,
        breakdown: null as any // Remove breakdown if not requested
      })),
    searchParams: {
      dateRange: { start: searchStart, end: searchEnd },
      minWeight: colis.poids
    },
    generatedAt: new Date()
  };
}

/**
 * Find all matching packages for a trip
 *
 * @param trajetId - Trip ID
 * @param options - Matching options
 * @returns TrajetMatchResults with scored matches
 */
export async function findMatchesForTrajet(
  trajetId: string,
  options: MatchOptions = {}
): Promise<TrajetMatchResults> {
  // Fetch trip details
  const trajet = await prisma.trajet.findUnique({
    where: { id: trajetId }
  });

  if (!trajet) {
    throw new Error(`Trajet not found: ${trajetId}`);
  }

  // Determine search window
  const searchRadius = options.dateSearchRadius ??
    DEFAULT_MATCHING_CONFIG.maxSearchRadiusDays;

  const searchStart = subDays(trajet.dateVoyage, searchRadius);
  const searchEnd = addDays(trajet.dateVoyage, searchRadius);

  // Find candidate packages
  const candidates = await prisma.colis.findMany({
    where: {
      AND: [
        // Date within search window (or no date specified)
        {
          OR: [
            { dateEnvoi: null },
            {
              dateEnvoi: {
                gte: searchStart,
                lte: searchEnd
              }
            }
          ]
        },
        // Weight can be accommodated
        {
          poids: {
            lte: trajet.kilosDisponibles
          }
        },
        // Exclude user's own packages
        {
          userId: {
            not: trajet.userId
          }
        }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  // Calculate scores
  const matches = candidates.map(colis =>
    calculateMatch({
      colis: {
        ...colis,
        flexibilite: FlexibilityLevel.FLEXIBLE_1,
        urgence: UrgencyLevel.MEDIUM
      },
      trajet
    })
  );

  // Sort and filter
  matches.sort((a, b) => b.score - a.score);

  const minScore = options.minScore ?? 0;
  const filteredMatches = matches.filter(m => m.score >= minScore);

  const limit = options.limit ?? filteredMatches.length;
  const limitedMatches = filteredMatches.slice(0, limit);

  return {
    trajetId,
    totalMatches: filteredMatches.length,
    recommendedMatches: filteredMatches.filter(m => m.isRecommended).length,
    exactMatches: filteredMatches.filter(m => m.isExactMatch).length,
    matches: limitedMatches,
    generatedAt: new Date()
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize city name for comparison
 * - Lowercase
 * - Remove accents
 * - Trim whitespace
 * - Remove common suffixes
 */
function normalizeCityName(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim()
    .replace(/\s*(cedex|\d+|,.*)$/i, ''); // Remove cedex, postal codes
}

/**
 * Check if two cities are in the same region
 * Uses city alias database for region matching
 */
function areCitiesInSameRegion(city1: string, city2: string): boolean {
  // This would query a city alias/region database
  // For now, simple implementation

  const regionMap: Record<string, string[]> = {
    'paris': ['paris', 'boulogne-billancourt', 'montreuil', 'nanterre'],
    'lyon': ['lyon', 'villeurbanne', 'venissieux'],
    'marseille': ['marseille', 'aix-en-provence', 'toulon']
  };

  for (const [region, cities] of Object.entries(regionMap)) {
    if (cities.includes(city1) && cities.includes(city2)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate match input data
 */
function validateMatchInput(input: MatchInput): void {
  const { colis, trajet } = input;

  if (!colis?.id) throw new Error('Invalid colis: missing ID');
  if (!trajet?.id) throw new Error('Invalid trajet: missing ID');
  if (!colis.villeEnvoi) throw new Error('Invalid colis: missing villeEnvoi');
  if (!colis.villeReception) throw new Error('Invalid colis: missing villeReception');
  if (!trajet.villeDepart) throw new Error('Invalid trajet: missing villeDepart');
  if (!trajet.villeArrivee) throw new Error('Invalid trajet: missing villeArrivee');
  if (typeof colis.poids !== 'number' || colis.poids <= 0) {
    throw new Error('Invalid colis: poids must be positive');
  }
  if (typeof trajet.kilosDisponibles !== 'number' || trajet.kilosDisponibles <= 0) {
    throw new Error('Invalid trajet: kilosDisponibles must be positive');
  }
  if (!isValid(trajet.dateVoyage)) {
    throw new Error('Invalid trajet: dateVoyage is required');
  }
}
