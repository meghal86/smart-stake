/**
 * Unit Tests for Wash Sale Detection
 * Enhanced Req 28 AC1-5: Wash Sale Warning System
 * 
 * Requirements: Enhanced Req 28 AC1-5
 * Design: Regulatory Guardrails → Wash Sale Protection
 */

import { describe, test, expect } from 'vitest';
import {
  detectWashSaleFlags,
  generateWashSaleWarningText,
  areTokensSubstantiallyIdentical,
  DEFAULT_WASH_SALE_CONFIG,
  WASH_SALE_EDUCATION,
} from '../wash-sale-detection';
import type { HarvestSession, HarvestOpportunity } from '@/types/harvestpro';

describe('Wash Sale Detection', () => {
  const mockOpportunity: HarvestOpportunity = {
    id: '1',
    lotId: 'lot-1',
    userId: 'user-1',
    token: 'ETH',
    tokenLogoUrl: null,
    riskLevel: 'LOW',
    unrealizedLoss: -1000,
    remainingQty: 1.5,
    gasEstimate: 50,
    slippageEstimate: 25,
    tradingFees: 10,
    netTaxBenefit: 240,
    guardianScore: 8.5,
    executionTimeEstimate: '5-8 min',
    confidence: 92,
    recommendationBadge: 'recommended',
    metadata: {
      walletName: 'Main Wallet',
      venue: 'Uniswap',
      reasons: ['High liquidity'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSession: HarvestSession = {
    sessionId: 'session-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'completed',
    opportunitiesSelected: [mockOpportunity],
    realizedLossesTotal: 1000,
    netBenefitTotal: 240,
    executionSteps: [],
    exportUrl: null,
    proofHash: null,
  };

  test('detectWashSaleFlags returns flags for all opportunities', () => {
    const flags = detectWashSaleFlags(mockSession);
    
    expect(flags).toHaveLength(1);
    expect(flags[0].token).toBe('ETH');
    expect(flags[0].isWashSale).toBe(false);
    expect(flags[0].riskLevel).toBe('MEDIUM');
    expect(flags[0].notes).toContain('Monitor for repurchases within 30 days');
  });

  test('detectWashSaleFlags detects high risk when washSaleRisk is true', () => {
    const opportunityWithRisk = {
      ...mockOpportunity,
      washSaleRisk: true,
    };
    
    const sessionWithRisk = {
      ...mockSession,
      opportunitiesSelected: [opportunityWithRisk],
    };
    
    const flags = detectWashSaleFlags(sessionWithRisk);
    
    expect(flags[0].isWashSale).toBe(true);
    expect(flags[0].riskLevel).toBe('HIGH');
    expect(flags[0].notes).toContain('Potential wash sale risk detected');
  });

  test('generateWashSaleWarningText returns appropriate warnings', () => {
    const lowRiskFlags = [{
      token: 'ETH',
      soldDate: new Date(),
      repurchaseDate: null,
      daysBetween: null,
      isWashSale: false,
      riskLevel: 'MEDIUM' as const,
      notes: 'Monitor for repurchases',
    }];
    
    const highRiskFlags = [{
      token: 'ETH',
      soldDate: new Date(),
      repurchaseDate: null,
      daysBetween: null,
      isWashSale: true,
      riskLevel: 'HIGH' as const,
      notes: 'Potential wash sale risk detected',
    }];
    
    expect(generateWashSaleWarningText(lowRiskFlags)).toContain('REMINDER');
    expect(generateWashSaleWarningText(highRiskFlags)).toContain('WARNING');
  });

  test('areTokensSubstantiallyIdentical identifies common pairs', () => {
    expect(areTokensSubstantiallyIdentical('ETH', 'WETH')).toBe(true);
    expect(areTokensSubstantiallyIdentical('BTC', 'WBTC')).toBe(true);
    expect(areTokensSubstantiallyIdentical('ETH', 'BTC')).toBe(false);
    expect(areTokensSubstantiallyIdentical('ETH', 'ETH')).toBe(true);
  });

  test('DEFAULT_WASH_SALE_CONFIG has correct defaults', () => {
    expect(DEFAULT_WASH_SALE_CONFIG.windowDays).toBe(30);
    expect(DEFAULT_WASH_SALE_CONFIG.includeSubstantiallyIdentical).toBe(true);
  });

  test('WASH_SALE_EDUCATION contains required information', () => {
    expect(WASH_SALE_EDUCATION.title).toContain('Wash Sale Rules');
    expect(WASH_SALE_EDUCATION.keyPoints).toHaveLength(4);
    expect(WASH_SALE_EDUCATION.disclaimer).toContain('educational purposes only');
  });
});