/**
 * Guardian Findings Adapter
 * 
 * Converts Guardian security findings into the unified Action model.
 * 
 * Adapter Rules (F2.1):
 * - lane = Protect
 * - severity maps 1:1 (critical/high/med/low)
 * - provenance = "confirmed" if from completed scan; "heuristic" if inferred
 * - cta.kind = "Review" unless system supports deterministic Fix flows
 * 
 * Requirements: F2.1
 */

import {
  ActionDraft,
  GuardianFindingInput,
  AdapterContext,
  ActionSeverity,
  ActionProvenance,
  CTAKind,
  ImpactChip,
} from '../types';

/**
 * Maps Guardian severity to Action severity
 */
function mapSeverity(severity: GuardianFindingInput['severity']): ActionSeverity {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'med';
    case 'low':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Determines provenance based on scan completion status
 */
function determineProvenance(finding: GuardianFindingInput): ActionProvenance {
  if (finding.from_completed_scan) {
    return 'confirmed';
  }
  return 'heuristic';
}

/**
 * Determines CTA kind based on provenance and fix flow availability
 * 
 * Per F2.1: cta.kind = "Review" unless system supports deterministic Fix flows
 */
function determineCTAKind(finding: GuardianFindingInput, provenance: ActionProvenance): CTAKind {
  // Heuristic provenance always gets Review (provenance gating will enforce this anyway)
  if (provenance === 'heuristic') {
    return 'Review';
  }
  
  // Only allow Fix if a deterministic fix flow exists
  if (finding.has_fix_flow) {
    return 'Fix';
  }
  
  return 'Review';
}

/**
 * Builds impact chips for a Guardian finding
 */
function buildImpactChips(finding: GuardianFindingInput): ImpactChip[] {
  const chips: ImpactChip[] = [];
  
  // Risk delta chip (negative value indicates risk reduction)
  if (finding.risk_delta !== undefined && finding.risk_delta !== 0) {
    chips.push({
      kind: 'risk_delta',
      value: finding.risk_delta,
    });
  }
  
  // Gas estimate chip
  if (finding.gas_estimate_usd !== undefined && finding.gas_estimate_usd > 0) {
    chips.push({
      kind: 'gas_est_usd',
      value: finding.gas_estimate_usd,
    });
  }
  
  // Limit to max 2 chips
  return chips.slice(0, 2);
}

/**
 * Generates the action href for a Guardian finding
 */
function generateHref(finding: GuardianFindingInput, ctaKind: CTAKind): string {
  if (ctaKind === 'Fix') {
    return `/action-center?intent=guardian_${finding.id}`;
  }
  return `/guardian?finding=${finding.id}`;
}

/**
 * Adapts a Guardian finding to an ActionDraft
 * 
 * @param finding - The Guardian finding input
 * @param _context - Adapter context (unused for Guardian, but kept for interface consistency)
 * @returns ActionDraft ready for ranking pipeline
 */
export function adaptGuardianFinding(
  finding: GuardianFindingInput,
  _context: AdapterContext
): ActionDraft | null {
  // Skip non-open findings
  if (finding.status !== 'open') {
    return null;
  }
  
  const severity = mapSeverity(finding.severity);
  const provenance = determineProvenance(finding);
  const ctaKind = determineCTAKind(finding, provenance);
  const impactChips = buildImpactChips(finding);
  const href = generateHref(finding, ctaKind);
  
  // Determine is_executable based on provenance and CTA kind
  // Per design: heuristic + Fix/Execute → downgrade to Review + is_executable=false
  const is_executable = provenance !== 'heuristic' && ctaKind !== 'Review';
  
  return {
    id: `guardian_${finding.id}`,
    lane: 'Protect',
    title: finding.title,
    severity,
    provenance,
    is_executable,
    cta: {
      kind: ctaKind,
      href,
    },
    impact_chips: impactChips,
    event_time: finding.updated_at || finding.created_at,
    expires_at: null, // Guardian findings don't expire
    source: {
      kind: 'guardian',
      ref_id: finding.id,
    },
    // Internal timestamps for freshness computation
    _created_at: finding.created_at,
    _updated_at: finding.updated_at || null,
  };
}

/**
 * Batch adapts multiple Guardian findings
 * 
 * @param findings - Array of Guardian finding inputs
 * @param context - Adapter context
 * @returns Array of ActionDrafts (null values filtered out)
 */
export function adaptGuardianFindings(
  findings: GuardianFindingInput[],
  context: AdapterContext
): ActionDraft[] {
  return findings
    .map(finding => adaptGuardianFinding(finding, context))
    .filter((draft): draft is ActionDraft => draft !== null);
}
