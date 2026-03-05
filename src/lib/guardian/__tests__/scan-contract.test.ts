import { describe, expect, it } from 'vitest';
import {
  buildDemoGuardianPayload,
  normalizeGuardianScanPayload,
} from '@/lib/guardian/scan-contract';

describe('guardian scan contract', () => {
  it('normalizes a live edge payload into the canonical scan shape', () => {
    const result = normalizeGuardianScanPayload(
      {
        trust_score_percent: 88,
        risk_score: 2,
        confidence: 0.81,
        scanned_at: '2026-03-05T12:30:00.000Z',
        risks: [
          {
            type: 'UNLIMITED_APPROVAL',
            severity: 'high',
            description: 'Unlimited approval detected',
            recommendation: 'Review the approval',
          },
        ],
        approvals: [
          {
            spender_address: '0xspender',
            token_symbol: 'USDC',
            token_address: '0xtoken',
            amount: 'unlimited',
            is_unlimited: true,
            approved_at: '2026-03-01T12:00:00.000Z',
          },
        ],
        scan_id: 'scan-123',
      },
      {
        walletAddress: '0xabc',
        network: 'ethereum',
        dataSource: 'live',
      }
    );

    expect(result).toMatchObject({
      walletAddress: '0xabc',
      network: 'ethereum',
      dataSource: 'live',
      scanId: 'scan-123',
      trustScorePercent: 88,
      trustScoreRaw: 0.88,
      riskScore: 2,
      riskLevel: 'Low',
      statusTone: 'trusted',
      scannedAt: '2026-03-05T12:30:00.000Z',
      confidence: 0.81,
    });
    expect(result.trustScore).toEqual({
      score: 88,
      normalized: 0.88,
      confidence: 0.81,
    });
    expect(result.posture).toMatchObject({
      riskScore: 2,
      riskLevel: 'Low',
      statusLabel: 'Trusted',
      statusTone: 'trusted',
    });
    expect(result.findings).toHaveLength(1);
    expect(result.flags).toEqual(result.findings);
    expect(result.approvals[0]).toEqual(
      expect.objectContaining({
        token: 'USDC',
        riskLevel: 'critical',
      })
    );
    expect(result.recommendedActions.map((action) => action.kind)).toEqual([
      'review_risks',
      'review_approvals',
    ]);
  });

  it('builds deterministic demo payloads through the same canonical normalizer', () => {
    const walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const result = normalizeGuardianScanPayload(buildDemoGuardianPayload(walletAddress), {
      walletAddress,
      network: 'ethereum',
      dataSource: 'demo',
    });

    expect(result.dataSource).toBe('demo');
    expect(result.trustScore.score).toBe(78);
    expect(result.posture.riskLevel).toBe('Medium');
    expect(result.recommendedActions.map((action) => action.kind)).toContain('review_approvals');
  });
});
