/**
 * Hunter Opportunities Adapter
 * 
 * Converts Hunter opportunities into the unified Action model.
 * 
 * Adapter Rules (F2.2):
 * - lane = Earn
 * - expires_at MUST be set when known
 * - provenance = "confirmed" only if eligibility + source checks pass; else "simulated" or "heuristic"
 * 
 * Requirements: F2.2
 */

import {
  ActionDraft,
  HunterOpportunityInput,
  AdapterContext,
  ActionSeverity,
  ActionProvenance,
  CTAKind,
  ImpactChip,
} from '../types';

/**
 * Maps Hunter trust level to Action severity
 * 
 * Higher trust = lower severity (less urgent to review)
 * Lower trust = higher severity (more urgent to review)
 */
function mapTrustToSeverity(trustLevel: HunterOpportunityInput['trust_level']): ActionSeverity {
  switch (trustLevel) {
    case 'red':
      return 'high'; // Low trust = high severity (needs attention)
    case 'amber':
      return 'med';
    case 'green':
      return 'low'; // High trust = low severity (safe to proceed)
    default:
      return 'med';
  }
}

/**
 * Determines provenance based on eligibility confirmation
 */
function determineProvenance(opportunity: HunterOpportunityInput): ActionProvenance {
  if (opportunity.eligibility_confirmed) {
    return 'confirmed';
  }
  
  // If trust score is high but eligibility not confirmed, use simulated
  if (opportunity.trust_score >= 70) {
    return 'simulated';
  }
  
  return 'heuristic';
}

/**
 * Determines CTA kind based on opportunity type and provenance
 */
function determineCTAKind(opportunity: HunterOpportunityInput, provenance: ActionProvenance): CTAKind {
  // Heuristic provenance always gets Review
  if (provenance === 'heuristic') {
    return 'Review';
  }
  
  // Executable opportunity types
  const executableTypes = ['airdrop', 'quest', 'staking', 'yield'];
  
  if (executableTypes.includes(opportunity.type) && provenance === 'confirmed') {
    return 'Execute';
  }
  
  return 'Review';
}

/**
 * Builds impact chips for a Hunter opportunity
 */
function buildImpactChips(opportunity: HunterOpportunityInput): ImpactChip[] {
  const chips: ImpactChip[] = [];
  
  // Upside estimate chip
  if (opportunity.upside_estimate_usd !== undefined && opportunity.upside_estimate_usd > 0) {
    chips.push({
      kind: 'upside_est_usd',
      value: opportunity.upside_estimate_usd,
    });
  }
  
  // Time estimate chip
  if (opportunity.time_estimate_sec !== undefined && opportunity.time_estimate_sec > 0) {
    chips.push({
      kind: 'time_est_sec',
      value: opportunity.time_estimate_sec,
    });
  }
  
  // Limit to max 2 chips
  return chips.slice(0, 2);
}

/**
 * Generates the action href for a Hunter opportunity
 */
function generateHref(opportunity: HunterOpportunityInput, ctaKind: CTAKind): string {
  if (ctaKind === 'Execute') {
    return `/action-center?intent=hunter_${opportunity.id}`;
  }
  return `/hunter?op=${opportunity.slug}`;
}

/**
 * Generates a human-readable title for the opportunity
 */
function generateTitle(opportunity: HunterOpportunityInput): string {
  // Use the opportunity title directly, or generate one
  if (opportunity.title) {
    return opportunity.title;
  }
  
  const typeLabels: Record<string, string> = {
    airdrop: 'Airdrop',
    quest: 'Quest',
    staking: 'Staking',
    yield: 'Yield',
    points: 'Points',
    loyalty: 'Loyalty',
    testnet: 'Testnet',
  };
  
  const typeLabel = typeLabels[opportunity.type] || 'Opportunity';
  return `${opportunity.protocol_name} ${typeLabel}`;
}

/**
 * Adapts a Hunter opportunity to an ActionDraft
 * 
 * @param opportunity - The Hunter opportunity input
 * @param _context - Adapter context (unused for Hunter, but kept for interface consistency)
 * @returns ActionDraft ready for ranking pipeline
 */
export function adaptHunterOpportunity(
  opportunity: HunterOpportunityInput,
  _context: AdapterContext
): ActionDraft {
  const severity = mapTrustToSeverity(opportunity.trust_level);
  const provenance = determineProvenance(opportunity);
  const ctaKind = determineCTAKind(opportunity, provenance);
  const impactChips = buildImpactChips(opportunity);
  const href = generateHref(opportunity, ctaKind);
  const title = generateTitle(opportunity);
  
  // Determine is_executable based on provenance and CTA kind
  const is_executable = provenance !== 'heuristic' && ctaKind !== 'Review';
  
  return {
    id: `hunter_${opportunity.id}`,
    lane: 'Earn',
    title,
    severity,
    provenance,
    is_executable,
    cta: {
      kind: ctaKind,
      href,
    },
    impact_chips: impactChips,
    event_time: opportunity.updated_at || opportunity.created_at,
    expires_at: opportunity.expires_at || null,
    source: {
      kind: 'hunter',
      ref_id: opportunity.id,
    },
    // Internal timestamps for freshness computation
    _created_at: opportunity.created_at,
    _updated_at: opportunity.updated_at || null,
  };
}

/**
 * Batch adapts multiple Hunter opportunities
 * 
 * @param opportunities - Array of Hunter opportunity inputs
 * @param context - Adapter context
 * @returns Array of ActionDrafts
 */
export function adaptHunterOpportunities(
  opportunities: HunterOpportunityInput[],
  context: AdapterContext
): ActionDraft[] {
  return opportunities.map(opportunity => adaptHunterOpportunity(opportunity, context));
}
