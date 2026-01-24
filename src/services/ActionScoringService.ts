/**
 * Portfolio Action Scoring Service
 * 
 * Implements the ActionScore formula for portfolio recommended actions:
 * ActionScore = (Severity × ExposureUSD × Confidence × TimeDecay) − Friction(gasUSD + timeSec)
 * 
 * Requirements: 4.2, 4.3, 4.4
 */

import { RecommendedAction } from '@/types/portfolio';

// Severity weights as defined in requirements
export const SEVERITY_WEIGHTS = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
} as const;

export interface ActionScoringParams {
  severity: 'critical' | 'high' | 'medium' | 'low';
  exposureUsd: number;
  confidence: number; // 0.50..1.00
  ageInHours: number; // for time decay calculation
  gasEstimateUsd: number;
  timeEstimateSec: number;
}

/**
 * Calculates time decay factor based on action age.
 * Newer actions get higher scores.
 * 
 * @param ageInHours - Age of the action in hours
 * @returns Time decay factor (0..1)
 */
export function calculateTimeDecay(ageInHours: number): number {
  // Exponential decay: newer actions are more valuable
  // Half-life of 24 hours (actions lose 50% value after 24h)
  const halfLifeHours = 24;
  return Math.exp(-Math.LN2 * ageInHours / halfLifeHours);
}

/**
 * Calculates friction cost from gas and time estimates.
 * 
 * @param gasEstimateUsd - Gas cost in USD
 * @param timeEstimateSec - Time estimate in seconds
 * @returns Friction cost
 */
export function calculateFriction(gasEstimateUsd: number, timeEstimateSec: number): number {
  // Convert time to minutes and apply cost factor
  const timeMinutes = timeEstimateSec / 60;
  const timeCostFactor = 0.5; // $0.50 per minute of user time
  return gasEstimateUsd + (timeMinutes * timeCostFactor);
}

/**
 * Calculates the ActionScore for a recommended action.
 * 
 * Formula: ActionScore = (Severity × ExposureUSD × Confidence × TimeDecay) − Friction(gasUSD + timeSec)
 * 
 * @param params - Scoring parameters
 * @returns ActionScore value
 */
export function calculateActionScore(params: ActionScoringParams): number {
  const {
    severity,
    exposureUsd,
    confidence,
    ageInHours,
    gasEstimateUsd,
    timeEstimateSec,
  } = params;

  // Get severity weight
  const severityWeight = SEVERITY_WEIGHTS[severity];
  
  // Calculate time decay
  const timeDecay = calculateTimeDecay(ageInHours);
  
  // Calculate friction
  const friction = calculateFriction(gasEstimateUsd, timeEstimateSec);
  
  // Apply formula
  const actionScore = (severityWeight * exposureUsd * confidence * timeDecay) - friction;
  
  return Math.max(0, actionScore); // Ensure non-negative score
}

/**
 * Sorts actions by ActionScore with tie-breaking rules.
 * 
 * Tie-break order:
 * 1. Higher ActionScore
 * 2. Higher confidence
 * 3. Lower friction (gas + time cost)
 * 
 * @param actions - Array of actions to sort
 * @returns Sorted array (highest score first)
 */
export function sortActionsByScore(actions: RecommendedAction[]): RecommendedAction[] {
  return [...actions].sort((a, b) => {
    // Primary: ActionScore descending
    if (a.actionScore !== b.actionScore) {
      return b.actionScore - a.actionScore;
    }
    
    // Tie-break 1: Higher confidence
    if (a.impactPreview.confidence !== b.impactPreview.confidence) {
      return b.impactPreview.confidence - a.impactPreview.confidence;
    }
    
    // Tie-break 2: Lower friction (gas + time cost)
    const frictionA = calculateFriction(a.impactPreview.gasEstimateUsd, a.impactPreview.timeEstimateSec);
    const frictionB = calculateFriction(b.impactPreview.gasEstimateUsd, b.impactPreview.timeEstimateSec);
    
    return frictionA - frictionB; // Lower friction wins
  });
}

/**
 * Validates that an action has the minimum required action types.
 * 
 * @param actions - Array of actions
 * @returns Object indicating which action types are present
 */
export function validateActionTypes(actions: RecommendedAction[]): {
  hasApprovalHygiene: boolean;
  hasDeRisk: boolean;
  hasRewards: boolean;
  hasRouting: boolean;
  allMinimumTypesPresent: boolean;
} {
  const intents = new Set(actions.map(action => action.cta.intent));
  
  const hasApprovalHygiene = intents.has('revoke_approval') || intents.has('approval_hygiene');
  const hasDeRisk = intents.has('de_risk') || intents.has('reduce_exposure');
  const hasRewards = intents.has('claim_rewards') || intents.has('harvest_rewards');
  const hasRouting = intents.has('optimize_routing') || intents.has('route_opportunity');
  
  return {
    hasApprovalHygiene,
    hasDeRisk,
    hasRewards,
    hasRouting,
    allMinimumTypesPresent: hasApprovalHygiene && hasDeRisk && hasRewards && hasRouting,
  };
}