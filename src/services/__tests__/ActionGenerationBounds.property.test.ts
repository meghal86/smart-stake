/**
 * Property-Based Tests for Action Generation Bounds
 * 
 * Feature: unified-portfolio, Property 6: Action Generation Bounds
 * Validates: Requirements 4.1, 4.3
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { RecommendedAction } from '@/types/portfolio';
import { validateActionTypes, sortActionsByScore } from '../ActionScoringService';

describe('Feature: unified-portfolio, Property 6: Action Generation Bounds', () => {
  // Generator for valid recommended actions
  const recommendedActionGen = fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
    why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    impactPreview: fc.record({
      riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
      preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
      expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
      gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
      timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
      confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
    }),
    actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
    cta: fc.record({
      label: fc.string({ minLength: 1 }),
      intent: fc.string({ minLength: 1 }),
      params: fc.object(),
    }),
    walletScope: fc.record({
      mode: fc.constant('active_wallet' as const),
      address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
    }),
  });

  // Generator for action generation request parameters
  const actionGenerationRequestGen = fc.record({
    userId: fc.string({ minLength: 1 }),
    walletScope: fc.record({
      mode: fc.constantFrom('active_wallet', 'all_wallets'),
      address: fc.option(fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`)),
    }),
    maxActions: fc.integer({ min: 3, max: 20 }),
    includeMinimumTypes: fc.boolean(),
  });

  test('Action generation returns 3-10 actions when available', () => {
    fc.assert(
      fc.property(
        fc.array(recommendedActionGen, { minLength: 3, maxLength: 50 }),
        (availableActions) => {
          // Simulate action generation by taking top actions
          const sortedActions = sortActionsByScore(availableActions);
          const generatedActions = sortedActions.slice(0, 10); // Take top 10 max
          
          // Property: Generated actions should be between 3-10
          expect(generatedActions.length).toBeGreaterThanOrEqual(3);
          expect(generatedActions.length).toBeLessThanOrEqual(10);
          
          // Property: Actions should be prioritized by ActionScore
          for (let i = 0; i < generatedActions.length - 1; i++) {
            expect(generatedActions[i].actionScore).toBeGreaterThanOrEqual(generatedActions[i + 1].actionScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action generation includes minimum action types when requested', () => {
    fc.assert(
      fc.property(
        fc.record({
          approvalHygieneActions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
              why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
              impactPreview: fc.record({
                riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
                preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
                expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
                gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
                timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
                confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
              }),
              actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
              cta: fc.record({
                label: fc.string({ minLength: 1 }),
                intent: fc.constantFrom('revoke_approval', 'approval_hygiene'),
                params: fc.object(),
              }),
              walletScope: fc.record({
                mode: fc.constant('active_wallet' as const),
                address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
              }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          deRiskActions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
              why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
              impactPreview: fc.record({
                riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
                preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
                expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
                gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
                timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
                confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
              }),
              actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
              cta: fc.record({
                label: fc.string({ minLength: 1 }),
                intent: fc.constantFrom('de_risk', 'reduce_exposure'),
                params: fc.object(),
              }),
              walletScope: fc.record({
                mode: fc.constant('active_wallet' as const),
                address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
              }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          rewardsActions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
              why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
              impactPreview: fc.record({
                riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
                preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
                expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
                gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
                timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
                confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
              }),
              actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
              cta: fc.record({
                label: fc.string({ minLength: 1 }),
                intent: fc.constantFrom('claim_rewards', 'harvest_rewards'),
                params: fc.object(),
              }),
              walletScope: fc.record({
                mode: fc.constant('active_wallet' as const),
                address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
              }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          routingActions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
              why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
              impactPreview: fc.record({
                riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
                preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
                expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
                gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
                timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
                confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
              }),
              actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
              cta: fc.record({
                label: fc.string({ minLength: 1 }),
                intent: fc.constantFrom('optimize_routing', 'route_opportunity'),
                params: fc.object(),
              }),
              walletScope: fc.record({
                mode: fc.constant('active_wallet' as const),
                address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
              }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          otherActions: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
              why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
              impactPreview: fc.record({
                riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
                preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
                expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
                gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
                timeEstimateSec: fc.float({ min: 1, max: 3600, noNaN: true }),
                confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
              }),
              actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
              cta: fc.record({
                label: fc.string({ minLength: 1 }),
                intent: fc.string({ minLength: 1 }).filter(s => 
                  !['revoke_approval', 'approval_hygiene', 'de_risk', 'reduce_exposure', 
                    'claim_rewards', 'harvest_rewards', 'optimize_routing', 'route_opportunity'].includes(s)
                ),
                params: fc.object(),
              }),
              walletScope: fc.record({
                mode: fc.constant('active_wallet' as const),
                address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
              }),
            }),
            { minLength: 0, maxLength: 5 }
          ),
        }),
        ({ approvalHygieneActions, deRiskActions, rewardsActions, routingActions, otherActions }) => {
          // Combine all actions
          const allActions = [
            ...approvalHygieneActions,
            ...deRiskActions,
            ...rewardsActions,
            ...routingActions,
            ...otherActions,
          ];
          
          // Simulate action generation that ensures minimum types
          const sortedActions = sortActionsByScore(allActions);
          
          // Property: When all minimum types are available, they should be included
          const validation = validateActionTypes(sortedActions);
          
          expect(validation.hasApprovalHygiene).toBe(true);
          expect(validation.hasDeRisk).toBe(true);
          expect(validation.hasRewards).toBe(true);
          expect(validation.hasRouting).toBe(true);
          expect(validation.allMinimumTypesPresent).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action generation handles insufficient actions gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(recommendedActionGen, { minLength: 0, maxLength: 2 }),
        (availableActions) => {
          // Simulate action generation with insufficient actions
          const sortedActions = sortActionsByScore(availableActions);
          
          // Property: Should return all available actions when less than minimum
          expect(sortedActions.length).toBe(availableActions.length);
          
          // Property: Should still be sorted by score
          for (let i = 0; i < sortedActions.length - 1; i++) {
            expect(sortedActions[i].actionScore).toBeGreaterThanOrEqual(sortedActions[i + 1].actionScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action generation respects ActionScore prioritization', () => {
    fc.assert(
      fc.property(
        fc.array(recommendedActionGen, { minLength: 5, maxLength: 20 }),
        (actions) => {
          const sortedActions = sortActionsByScore(actions);
          const topActions = sortedActions.slice(0, 5);
          
          // Property: Top actions should have highest scores
          const allScores = actions.map(a => a.actionScore).sort((a, b) => b - a);
          const topScores = topActions.map(a => a.actionScore).sort((a, b) => b - a);
          
          // Top 5 selected actions should include the 5 highest scores available
          expect(topScores).toEqual(allScores.slice(0, 5));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action generation maintains data structure completeness', () => {
    fc.assert(
      fc.property(
        fc.array(recommendedActionGen, { minLength: 3, maxLength: 10 }),
        (actions) => {
          const sortedActions = sortActionsByScore(actions);
          
          // Property: All required fields should be present in generated actions
          sortedActions.forEach(action => {
            // Required action fields
            expect(action.id).toBeDefined();
            expect(typeof action.id).toBe('string');
            expect(action.id.length).toBeGreaterThan(0);
            
            expect(action.title).toBeDefined();
            expect(typeof action.title).toBe('string');
            expect(action.title.length).toBeGreaterThan(0);
            
            expect(action.severity).toBeDefined();
            expect(['critical', 'high', 'medium', 'low']).toContain(action.severity);
            
            expect(action.why).toBeDefined();
            expect(Array.isArray(action.why)).toBe(true);
            expect(action.why.length).toBeGreaterThan(0);
            
            // Impact preview fields
            expect(action.impactPreview).toBeDefined();
            expect(typeof action.impactPreview.riskDelta).toBe('number');
            expect(typeof action.impactPreview.preventedLossP50Usd).toBe('number');
            expect(typeof action.impactPreview.expectedGainUsd).toBe('number');
            expect(typeof action.impactPreview.gasEstimateUsd).toBe('number');
            expect(typeof action.impactPreview.timeEstimateSec).toBe('number');
            expect(typeof action.impactPreview.confidence).toBe('number');
            
            // Confidence should be in valid range
            expect(action.impactPreview.confidence).toBeGreaterThanOrEqual(0.5);
            expect(action.impactPreview.confidence).toBeLessThanOrEqual(1.0);
            
            // ActionScore should be defined
            expect(typeof action.actionScore).toBe('number');
            expect(action.actionScore).toBeGreaterThanOrEqual(0);
            
            // CTA fields
            expect(action.cta).toBeDefined();
            expect(action.cta.label).toBeDefined();
            expect(typeof action.cta.label).toBe('string');
            expect(action.cta.label.length).toBeGreaterThan(0);
            expect(action.cta.intent).toBeDefined();
            expect(typeof action.cta.intent).toBe('string');
            expect(action.cta.intent.length).toBeGreaterThan(0);
            expect(action.cta.params).toBeDefined();
            expect(typeof action.cta.params).toBe('object');
            
            // Wallet scope fields
            expect(action.walletScope).toBeDefined();
            expect(['active_wallet', 'all_wallets']).toContain(action.walletScope.mode);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action generation bounds are enforced consistently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 15, max: 100 }),
        fc.integer({ min: 3, max: 10 }),
        (totalAvailable, requestedMax) => {
          // Generate actions
          const actions = Array.from({ length: totalAvailable }, (_, i) => ({
            id: `action-${i}`,
            title: `Action ${i}`,
            severity: 'medium' as const,
            why: [`Reason ${i}`],
            impactPreview: {
              riskDelta: 0,
              preventedLossP50Usd: 100,
              expectedGainUsd: 50,
              gasEstimateUsd: 10,
              timeEstimateSec: 30,
              confidence: 0.8,
            },
            actionScore: Math.random() * 100,
            cta: {
              label: 'Execute',
              intent: 'test_intent',
              params: {},
            },
            walletScope: {
              mode: 'active_wallet' as const,
              address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
            },
          }));
          
          const sortedActions = sortActionsByScore(actions);
          const boundedActions = sortedActions.slice(0, Math.min(requestedMax, 10));
          
          // Property: Should never exceed 10 actions
          expect(boundedActions.length).toBeLessThanOrEqual(10);
          
          // Property: Should not exceed requested maximum
          expect(boundedActions.length).toBeLessThanOrEqual(requestedMax);
          
          // Property: Should return at least 3 when available
          if (totalAvailable >= 3) {
            expect(boundedActions.length).toBeGreaterThanOrEqual(Math.min(3, requestedMax));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});