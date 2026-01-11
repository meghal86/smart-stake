/**
 * Action Center Items Adapter
 * 
 * Converts Action Center items into the unified Action model.
 * 
 * Adapter Rules (F2.4):
 * - lane preserved from intent; default Protect
 * - pending_actions_count derived only from Action Center states (Appendix A4)
 * 
 * Requirements: F2.4, Appendix A4
 */

import {
  ActionDraft,
  ActionCenterItemInput,
  AdapterContext,
  ActionLane,
  ActionSeverity,
  ActionProvenance,
  CTAKind,
  ImpactChip,
} from '../types';

/**
 * Determines the lane from the intent, defaulting to Protect
 */
function determineLane(item: ActionCenterItemInput): ActionLane {
  if (item.lane) {
    return item.lane;
  }
  return 'Protect';
}

/**
 * Determines severity from the item, defaulting to med
 */
function determineSeverity(item: ActionCenterItemInput): ActionSeverity {
  if (item.severity) {
    return item.severity;
  }
  return 'med';
}

/**
 * Determines provenance based on item state
 * 
 * - ready_to_execute: confirmed (all checks passed)
 * - pending_user: simulated (awaiting user input)
 * - needs_review: heuristic (requires manual review)
 */
function determineProvenance(item: ActionCenterItemInput): ActionProvenance {
  switch (item.state) {
    case 'ready_to_execute':
      return 'confirmed';
    case 'pending_user':
      return 'simulated';
    case 'needs_review':
      return 'heuristic';
    default:
      return 'simulated';
  }
}

/**
 * Determines CTA kind based on item state and provenance
 */
function determineCTAKind(item: ActionCenterItemInput, provenance: ActionProvenance): CTAKind {
  // Heuristic provenance always gets Review
  if (provenance === 'heuristic') {
    return 'Review';
  }
  
  switch (item.state) {
    case 'ready_to_execute':
      return 'Execute';
    case 'pending_user':
      return 'Fix';
    case 'needs_review':
      return 'Review';
    default:
      return 'Review';
  }
}

/**
 * Builds impact chips for an Action Center item
 */
function buildImpactChips(item: ActionCenterItemInput): ImpactChip[] {
  const chips: ImpactChip[] = [];
  
  // Gas estimate chip
  if (item.gas_estimate_usd !== undefined && item.gas_estimate_usd > 0) {
    chips.push({
      kind: 'gas_est_usd',
      value: item.gas_estimate_usd,
    });
  }
  
  // Risk delta chip
  if (item.risk_delta !== undefined && item.risk_delta !== 0) {
    chips.push({
      kind: 'risk_delta',
      value: item.risk_delta,
    });
  }
  
  // Limit to max 2 chips
  return chips.slice(0, 2);
}

/**
 * Checks if an Action Center item is in a pending state
 * 
 * Per Appendix A4: pending_actions_count = count of Action Center items where:
 * - state IN ("pending_user", "ready_to_execute", "needs_review")
 */
export function isActionCenterItemPending(item: ActionCenterItemInput): boolean {
  return ['pending_user', 'ready_to_execute', 'needs_review'].includes(item.state);
}

/**
 * Adapts an Action Center item to an ActionDraft
 * 
 * @param item - The Action Center item input
 * @param _context - Adapter context (unused for Action Center, but kept for interface consistency)
 * @returns ActionDraft ready for ranking pipeline, or null if item is not pending
 */
export function adaptActionCenterItem(
  item: ActionCenterItemInput,
  _context: AdapterContext
): ActionDraft | null {
  // Only adapt pending items
  if (!isActionCenterItemPending(item)) {
    return null;
  }
  
  const lane = determineLane(item);
  const severity = determineSeverity(item);
  const provenance = determineProvenance(item);
  const ctaKind = determineCTAKind(item, provenance);
  const impactChips = buildImpactChips(item);
  
  // Determine is_executable based on provenance and CTA kind
  const is_executable = provenance !== 'heuristic' && ctaKind !== 'Review';
  
  return {
    id: `action_center_${item.id}`,
    lane,
    title: item.title,
    severity,
    provenance,
    is_executable,
    cta: {
      kind: ctaKind,
      href: item.href,
    },
    impact_chips: impactChips,
    event_time: item.updated_at || item.created_at,
    expires_at: null, // Action Center items don't expire
    source: {
      kind: 'action_center',
      ref_id: item.id,
    },
    // Internal timestamps for freshness computation
    _created_at: item.created_at,
    _updated_at: item.updated_at || null,
  };
}

/**
 * Batch adapts multiple Action Center items
 * 
 * @param items - Array of Action Center item inputs
 * @param context - Adapter context
 * @returns Array of ActionDrafts (null values filtered out)
 */
export function adaptActionCenterItems(
  items: ActionCenterItemInput[],
  context: AdapterContext
): ActionDraft[] {
  return items
    .map(item => adaptActionCenterItem(item, context))
    .filter((draft): draft is ActionDraft => draft !== null);
}

/**
 * Counts pending actions from Action Center items
 * 
 * Per Appendix A4: pending_actions_count = count of Action Center items where:
 * - state IN ("pending_user", "ready_to_execute", "needs_review")
 */
export function countPendingActions(items: ActionCenterItemInput[]): number {
  return items.filter(isActionCenterItemPending).length;
}
