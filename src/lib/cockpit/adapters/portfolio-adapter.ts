/**
 * Portfolio Deltas Adapter
 * 
 * Converts Portfolio deltas into the unified Action model.
 * 
 * Adapter Rules (F2.3):
 * - lane = Watch (or Protect if risk-related)
 * - provenance = "confirmed" when based on confirmed balance/price snapshots; else "simulated"
 * 
 * Requirements: F2.3
 */

import {
  ActionDraft,
  PortfolioDeltaInput,
  AdapterContext,
  ActionLane,
  ActionSeverity,
  ActionProvenance,
  CTAKind,
  ImpactChip,
} from '../types';

/**
 * Determines the lane based on whether the delta is risk-related
 */
function determineLane(delta: PortfolioDeltaInput): ActionLane {
  if (delta.is_risk_related) {
    return 'Protect';
  }
  return 'Watch';
}

/**
 * Determines severity based on delta magnitude and type
 */
function determineSeverity(delta: PortfolioDeltaInput): ActionSeverity {
  const absValue = Math.abs(delta.delta_value);
  const absUsd = Math.abs(delta.delta_usd || 0);
  
  // Risk-related deltas are more severe
  if (delta.is_risk_related) {
    if (absValue >= 50 || absUsd >= 10000) {
      return 'critical';
    }
    if (absValue >= 20 || absUsd >= 1000) {
      return 'high';
    }
    return 'med';
  }
  
  // Non-risk deltas (balance/price changes)
  if (absUsd >= 10000) {
    return 'high';
  }
  if (absUsd >= 1000) {
    return 'med';
  }
  return 'low';
}

/**
 * Determines provenance based on snapshot confirmation
 */
function determineProvenance(delta: PortfolioDeltaInput): ActionProvenance {
  if (delta.from_confirmed_snapshot) {
    return 'confirmed';
  }
  return 'simulated';
}

/**
 * Builds impact chips for a Portfolio delta
 */
function buildImpactChips(delta: PortfolioDeltaInput): ImpactChip[] {
  const chips: ImpactChip[] = [];
  
  // For risk-related deltas, show risk_delta
  if (delta.is_risk_related && delta.delta_value !== 0) {
    chips.push({
      kind: 'risk_delta',
      value: delta.delta_value,
    });
  }
  
  // Show USD value if available
  if (delta.delta_usd !== undefined && delta.delta_usd !== 0) {
    // Use upside_est_usd for positive changes, risk_delta for negative
    if (delta.delta_usd > 0 && !delta.is_risk_related) {
      chips.push({
        kind: 'upside_est_usd',
        value: delta.delta_usd,
      });
    }
  }
  
  // Limit to max 2 chips
  return chips.slice(0, 2);
}

/**
 * Generates a human-readable title for the delta
 */
function generateTitle(delta: PortfolioDeltaInput): string {
  const direction = delta.delta_value >= 0 ? 'increased' : 'decreased';
  const absValue = Math.abs(delta.delta_value);
  
  switch (delta.delta_type) {
    case 'balance_change':
      return `${delta.token_symbol} balance ${direction} by ${absValue.toFixed(2)}`;
    case 'price_change':
      return `${delta.token_symbol} price ${direction} by ${absValue.toFixed(1)}%`;
    case 'risk_change':
      return `Risk score ${direction} for ${delta.token_symbol}`;
    default:
      return `${delta.token_symbol} ${direction}`;
  }
}

/**
 * Generates the action href for a Portfolio delta
 */
function generateHref(delta: PortfolioDeltaInput): string {
  return `/portfolio?wallet=${delta.wallet_address}&chain=${delta.chain}&token=${delta.token_symbol}`;
}

/**
 * Adapts a Portfolio delta to an ActionDraft
 * 
 * @param delta - The Portfolio delta input
 * @param _context - Adapter context (unused for Portfolio, but kept for interface consistency)
 * @returns ActionDraft ready for ranking pipeline
 */
export function adaptPortfolioDelta(
  delta: PortfolioDeltaInput,
  _context: AdapterContext
): ActionDraft {
  const lane = determineLane(delta);
  const severity = determineSeverity(delta);
  const provenance = determineProvenance(delta);
  const impactChips = buildImpactChips(delta);
  const title = generateTitle(delta);
  const href = generateHref(delta);
  
  // Portfolio deltas are always Review-only (informational)
  const ctaKind: CTAKind = 'Review';
  const is_executable = false;
  
  return {
    id: `portfolio_${delta.id}`,
    lane,
    title,
    severity,
    provenance,
    is_executable,
    cta: {
      kind: ctaKind,
      href,
    },
    impact_chips: impactChips,
    event_time: delta.updated_at || delta.created_at,
    expires_at: null, // Portfolio deltas don't expire
    source: {
      kind: 'portfolio',
      ref_id: delta.id,
    },
    // Internal timestamps for freshness computation
    _created_at: delta.created_at,
    _updated_at: delta.updated_at || null,
  };
}

/**
 * Batch adapts multiple Portfolio deltas
 * 
 * @param deltas - Array of Portfolio delta inputs
 * @param context - Adapter context
 * @returns Array of ActionDrafts
 */
export function adaptPortfolioDeltas(
  deltas: PortfolioDeltaInput[],
  context: AdapterContext
): ActionDraft[] {
  return deltas.map(delta => adaptPortfolioDelta(delta, context));
}
