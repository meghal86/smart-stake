/**
 * Trust Score Calculation Tests
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTrustScore,
  gradeByScore,
  getScoreColor,
  getStatusTone,
  type TrustScoreInputs,
} from '@/lib/guardian/trust-score';
import type { ApprovalRisk } from '@/lib/guardian/approvals';
import type { HoneypotResult } from '@/lib/guardian/honeypot';
import type { MixerProximityResult } from '@/lib/guardian/mixer';
import type { ReputationResult } from '@/lib/guardian/reputation';

describe('Trust Score Calculation', () => {
  it('should return perfect score (100) for clean wallet', () => {
    const inputs: TrustScoreInputs = {
      approvals: [],
      honeypotResults: new Map(),
      mixerProximity: {
        hasMixerActivity: false,
        proximityScore: 0,
        directInteractions: 0,
        oneHopInteractions: 0,
        lastInteraction: null,
        mixerAddresses: [],
      },
      reputation: {
        level: 'good',
        score: 80,
        reasons: ['Positive indicators'],
        labels: [],
      },
    };

    const result = calculateTrustScore(inputs);

    // Good reputation gives +10 bonus
    expect(result.score).toBeGreaterThanOrEqual(100);
    expect(result.grade).toBe('A');
    expect(result.totals.critical).toBe(0);
  });

  it('should deduct points for unlimited approvals', () => {
    const approvals: ApprovalRisk[] = [
      {
        token: '0x1234567890123456789012345678901234567890',
        spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        symbol: 'USDT',
        decimals: 6,
        riskLevel: 'high',
        reason: 'Unlimited approval to USDT',
      },
      {
        token: '0x2345678901234567890123456789012345678901',
        spender: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde',
        allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        symbol: 'WETH',
        decimals: 18,
        riskLevel: 'medium',
        reason: 'Unlimited approval to WETH',
      },
    ];

    const inputs: TrustScoreInputs = {
      approvals,
      honeypotResults: new Map(),
      mixerProximity: {
        hasMixerActivity: false,
        proximityScore: 0,
        directInteractions: 0,
        oneHopInteractions: 0,
        lastInteraction: null,
        mixerAddresses: [],
      },
      reputation: {
        level: 'neutral',
        score: 50,
        reasons: [],
        labels: [],
      },
    };

    const result = calculateTrustScore(inputs);

    // Should deduct 30 points (2 approvals * 15)
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.factors.some(f => f.category === 'Approvals')).toBe(true);
  });

  it('should deduct heavy points for honeypot token', () => {
    const honeypotResult: HoneypotResult = {
      isHoneypot: true,
      buyTax: 20,
      sellTax: 99,
      warnings: ['Honeypot detected'],
      confidence: 'high',
    };

    const inputs: TrustScoreInputs = {
      approvals: [],
      honeypotResults: new Map([
        ['0x1234567890123456789012345678901234567890', honeypotResult],
      ]),
      mixerProximity: {
        hasMixerActivity: false,
        proximityScore: 0,
        directInteractions: 0,
        oneHopInteractions: 0,
        lastInteraction: null,
        mixerAddresses: [],
      },
      reputation: {
        level: 'neutral',
        score: 50,
        reasons: [],
        labels: [],
      },
    };

    const result = calculateTrustScore(inputs);

    // Should deduct 60 points for honeypot + 20 for high taxes
    expect(result.score).toBeLessThan(50);
    expect(result.totals.critical).toBeGreaterThan(0);
    expect(result.factors.some(f => f.category === 'Honeypot')).toBe(true);
  });

  it('should handle mixer interactions properly', () => {
    const inputs: TrustScoreInputs = {
      approvals: [],
      honeypotResults: new Map(),
      mixerProximity: {
        hasMixerActivity: true,
        proximityScore: 100,
        directInteractions: 2,
        oneHopInteractions: 0,
        lastInteraction: Date.now() / 1000,
        mixerAddresses: ['0xmixer1'],
      },
      reputation: {
        level: 'neutral',
        score: 50,
        reasons: [],
        labels: [],
      },
    };

    const result = calculateTrustScore(inputs);

    // Should deduct 40 points for direct mixer interaction
    expect(result.score).toBeLessThan(65);
    expect(result.factors.some(f => f.category === 'Mixer')).toBe(true);
  });

  it('should clamp score between 0 and 100', () => {
    // Extreme case with multiple high-severity issues
    const inputs: TrustScoreInputs = {
      approvals: Array(10).fill(null).map((_, i) => ({
        token: `0x${i.toString().padStart(40, '0')}`,
        spender: `0x${(i + 100).toString().padStart(40, '0')}`,
        allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        symbol: `TOKEN${i}`,
        decimals: 18,
        riskLevel: 'high' as const,
        reason: 'Unlimited approval',
      })),
      honeypotResults: new Map([
        ['0x1', { isHoneypot: true, buyTax: 99, sellTax: 99, warnings: [], confidence: 'high' as const }],
      ]),
      mixerProximity: {
        hasMixerActivity: true,
        proximityScore: 100,
        directInteractions: 5,
        oneHopInteractions: 0,
        lastInteraction: Date.now() / 1000,
        mixerAddresses: [],
      },
      reputation: {
        level: 'bad',
        score: 0,
        reasons: ['Scam address'],
        labels: ['phishing'],
      },
    };

    const result = calculateTrustScore(inputs);

    // Score should be clamped to 0
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBe('F');
  });
});

describe('Grade Calculation', () => {
  it('should assign correct grades', () => {
    expect(gradeByScore(95)).toBe('A');
    expect(gradeByScore(85)).toBe('B');
    expect(gradeByScore(75)).toBe('C');
    expect(gradeByScore(65)).toBe('D');
    expect(gradeByScore(50)).toBe('F');
    expect(gradeByScore(0)).toBe('F');
  });
});

describe('Color Helpers', () => {
  it('should return correct colors for scores', () => {
    expect(getScoreColor(90)).toBe('text-green-500');
    expect(getScoreColor(70)).toBe('text-yellow-500');
    expect(getScoreColor(50)).toBe('text-red-500');
  });

  it('should return correct status tones', () => {
    expect(getStatusTone(85)).toBe('trusted');
    expect(getStatusTone(65)).toBe('warning');
    expect(getStatusTone(45)).toBe('danger');
  });
});

