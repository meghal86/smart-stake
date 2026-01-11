/**
 * Cockpit Scoring Module
 * 
 * Barrel export for action scoring and ranking functionality.
 * 
 * Requirements: 6.1, 6.2, 6.9, Ranking Pipeline (Locked)
 */

// Urgency scoring
export {
  computeUrgencyScore,
  isExpiringSoon,
} from './urgency';

// Freshness derivation
export {
  deriveFreshness,
  isNewSinceLast,
} from './freshness';

// Relevance scoring
export {
  computeRelevanceScore,
  createEmptyContext,
} from './relevance';

// Duplicate detection
export {
  generateDedupeKey,
  getDedupeKeyFromAction,
  wasRecentlyShown,
  calculateDuplicatePenalty,
  markDuplicates,
  isWithinTTL,
  SHOWN_ACTIONS_TTL_MS,
} from './dedupe';

// Ranking service
export {
  applyProvenanceGating,
  isEligibleForPreview,
  computeTotalScore,
  compareTieBreakers,
  finalizeAction,
  rankActions,
  getDedupeKeysForActions,
  type RankingOptions,
} from './ranking-service';
