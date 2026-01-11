/**
 * Today Card State Machine
 * 
 * Implements the deterministic Today Card priority system.
 * 
 * Priority order (Locked):
 * 1. onboarding
 * 2. scan_required
 * 3. critical_risk
 * 4. pending_actions
 * 5. daily_pulse
 * 6. portfolio_anchor (fallback)
 * 
 * Requirements: 3.3, 3.4
 */

import { TodayCardKind, TodayCard, CockpitCounters } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Input conditions for Today Card state determination.
 * These are computed server-side from various data sources.
 */
export interface TodayCardInputs {
  /** User needs to complete onboarding (0 wallets, no scans, etc.) */
  onboarding_needed: boolean;
  /** Scan state: fresh, stale, or missing */
  scan_state: 'fresh' | 'stale' | 'missing';
  /** Count of critical severity Guardian findings */
  critical_risk_count: number;
  /** Count of pending Action Center items */
  pending_actions_count: number;
  /** Whether daily pulse has content */
  daily_pulse_available: boolean;
  /** Whether system is in degraded mode */
  degraded_mode: boolean;
}

// ============================================================================
// State Machine
// ============================================================================

/**
 * Determines the Today Card state based on inputs.
 * Evaluates conditions in exact order and selects first true.
 * 
 * This is a PURE FUNCTION - same inputs always produce same output.
 * 
 * Priority order (Locked):
 * 1. onboarding - User needs setup
 * 2. scan_required - Scan data missing or stale
 * 3. critical_risk - Active critical security findings
 * 4. pending_actions - Items awaiting user action
 * 5. daily_pulse - Fresh pulse content available
 * 6. portfolio_anchor - Fallback showing portfolio summary
 * 
 * @param inputs - The computed input conditions
 * @returns The Today Card kind to display
 */
export function determineTodayCardKind(inputs: TodayCardInputs): TodayCardKind {
  // Priority 1: Onboarding
  if (inputs.onboarding_needed) {
    return 'onboarding';
  }
  
  // Priority 2: Scan required (missing or stale)
  if (inputs.scan_state === 'missing' || inputs.scan_state === 'stale') {
    return 'scan_required';
  }
  
  // Priority 3: Critical risk
  if (inputs.critical_risk_count > 0) {
    return 'critical_risk';
  }
  
  // Priority 4: Pending actions
  if (inputs.pending_actions_count > 0) {
    return 'pending_actions';
  }
  
  // Priority 5: Daily pulse
  if (inputs.daily_pulse_available) {
    return 'daily_pulse';
  }
  
  // Priority 6: Portfolio anchor (fallback)
  return 'portfolio_anchor';
}

/**
 * Validates that the Today Card kind follows the priority rules.
 * Used for testing to verify determinism.
 * 
 * @param inputs - The input conditions
 * @param kind - The determined kind
 * @returns true if the kind is correct for the inputs
 */
export function validateTodayCardKind(inputs: TodayCardInputs, kind: TodayCardKind): boolean {
  const expectedKind = determineTodayCardKind(inputs);
  return kind === expectedKind;
}

/**
 * Gets the priority index for a Today Card kind.
 * Lower index = higher priority.
 * 
 * @param kind - The Today Card kind
 * @returns Priority index (0-5)
 */
export function getTodayCardPriority(kind: TodayCardKind): number {
  const priorities: Record<TodayCardKind, number> = {
    onboarding: 0,
    scan_required: 1,
    critical_risk: 2,
    pending_actions: 3,
    daily_pulse: 4,
    portfolio_anchor: 5,
  };
  return priorities[kind];
}

/**
 * Checks if a higher priority condition is true for the given inputs.
 * Used to verify that the correct kind was selected.
 * 
 * @param inputs - The input conditions
 * @param kind - The kind to check against
 * @returns true if no higher priority condition is true
 */
export function noHigherPriorityCondition(inputs: TodayCardInputs, kind: TodayCardKind): boolean {
  const priority = getTodayCardPriority(kind);
  
  // Check all conditions with higher priority
  if (priority > 0 && inputs.onboarding_needed) {
    return false; // onboarding has higher priority
  }
  
  if (priority > 1 && (inputs.scan_state === 'missing' || inputs.scan_state === 'stale')) {
    return false; // scan_required has higher priority
  }
  
  if (priority > 2 && inputs.critical_risk_count > 0) {
    return false; // critical_risk has higher priority
  }
  
  if (priority > 3 && inputs.pending_actions_count > 0) {
    return false; // pending_actions has higher priority
  }
  
  if (priority > 4 && inputs.daily_pulse_available) {
    return false; // daily_pulse has higher priority
  }
  
  return true;
}

// ============================================================================
// Content Builders
// ============================================================================

/**
 * Builds the Today Card content based on the determined kind.
 * 
 * @param kind - The Today Card kind
 * @param inputs - The input conditions (for context)
 * @param counters - The cockpit counters
 * @returns Complete Today Card object
 */
export function buildTodayCard(
  kind: TodayCardKind,
  inputs: TodayCardInputs,
  counters: CockpitCounters
): TodayCard {
  switch (kind) {
    case 'onboarding':
      return {
        kind: 'onboarding',
        anchor_metric: 'Get Started',
        context_line: 'Complete setup to unlock your dashboard',
        primary_cta: { label: 'Start Setup', href: '/onboarding' },
        secondary_cta: { label: 'Explore Demo', href: '/cockpit?demo=1' },
      };
    
    case 'scan_required':
      return {
        kind: 'scan_required',
        anchor_metric: 'Scan Needed',
        context_line: inputs.scan_state === 'missing' 
          ? 'Run your first security scan'
          : 'Your scan data is outdated',
        primary_cta: { label: 'Run Scan', href: '/guardian?action=scan' },
        secondary_cta: { label: 'View Last Results', href: '/guardian' },
      };
    
    case 'critical_risk':
      return {
        kind: 'critical_risk',
        anchor_metric: `${inputs.critical_risk_count} Critical`,
        context_line: inputs.critical_risk_count === 1 
          ? 'Critical security issue requires attention'
          : 'Critical security issues require attention',
        primary_cta: { label: 'Review Now', href: '/guardian?severity=critical' },
      };
    
    case 'pending_actions':
      return {
        kind: 'pending_actions',
        anchor_metric: `${inputs.pending_actions_count} Pending`,
        context_line: inputs.pending_actions_count === 1
          ? 'Action awaiting your review'
          : 'Actions awaiting your review',
        primary_cta: { label: 'View Actions', href: '/action-center' },
      };
    
    case 'daily_pulse':
      const newCount = counters.new_since_last;
      const expiringCount = counters.expiring_soon;
      let anchorMetric = '';
      
      if (newCount > 0 && expiringCount > 0) {
        anchorMetric = `${newCount} new · ${expiringCount} expiring`;
      } else if (newCount > 0) {
        anchorMetric = `${newCount} new`;
      } else if (expiringCount > 0) {
        anchorMetric = `${expiringCount} expiring`;
      } else {
        anchorMetric = 'Quiet day';
      }
      
      return {
        kind: 'daily_pulse',
        anchor_metric: anchorMetric,
        context_line: 'Since your last open',
        primary_cta: { label: "Open today's pulse", href: '/cockpit#pulse' },
        secondary_cta: { label: 'Explore Hunter', href: '/hunter' },
      };
    
    case 'portfolio_anchor':
    default:
      return {
        kind: 'portfolio_anchor',
        anchor_metric: 'All Clear',
        context_line: 'Your portfolio is healthy',
        primary_cta: { label: 'View Portfolio', href: '/portfolio' },
        secondary_cta: { label: 'Explore Opportunities', href: '/hunter' },
      };
  }
}
