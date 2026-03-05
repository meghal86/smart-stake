import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke: invokeMock,
    },
  })),
}));

describe('guardianService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('maps a live Guardian scan response without falling back to fake data', async () => {
    invokeMock.mockResolvedValue({
      data: {
        trust_score_percent: 91,
        risk_score: 1,
        risks: [
          {
            type: 'UNLIMITED_APPROVAL',
            severity: 'high',
            description: 'Unlimited approval detected',
            recommendation: 'Revoke it',
          },
        ],
        approvals: [
          {
            token_symbol: 'USDC',
            token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            spender_address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
            spender_name: '1inch Router',
            amount: 'unlimited',
            is_unlimited: true,
            approved_at: '2026-03-01T12:00:00.000Z',
          },
        ],
        scanned_at: '2026-03-05T12:00:00.000Z',
        confidence: 0.92,
        scan_id: 'scan-live-123',
      },
      error: null,
    });

    const { requestGuardianScan } = await import('../guardianService');

    const result = await requestGuardianScan({
      walletAddress: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
    });

    expect(result).toMatchObject({
      walletAddress: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
      trustScorePercent: 91,
      riskScore: 1,
      riskLevel: 'Low',
      statusTone: 'trusted',
      dataSource: 'live',
      scannedAt: '2026-03-05T12:00:00.000Z',
      confidence: 0.92,
      scanId: 'scan-live-123',
    });
    expect(result.trustScore).toMatchObject({
      score: 91,
      normalized: 0.91,
      confidence: 0.92,
    });
    expect(result.posture).toMatchObject({
      riskScore: 1,
      riskLevel: 'Low',
      statusTone: 'trusted',
    });
    expect(result.freshness.scannedAt).toBe('2026-03-05T12:00:00.000Z');
    expect(result.recommendedActions[0]?.kind).toBe('review_risks');
    expect(result.flags).toHaveLength(1);
    expect(result.approvals).toEqual([
      expect.objectContaining({
        token: 'USDC',
        spenderName: '1inch Router',
        isUnlimited: true,
        riskLevel: 'critical',
      }),
    ]);
  });

  it('throws when the scan backend fails instead of inventing a random score', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'edge unavailable' },
    });

    const { requestGuardianScan } = await import('../guardianService');

    await expect(
      requestGuardianScan({
        walletAddress: '0x1234567890123456789012345678901234567890',
        network: 'ethereum',
      })
    ).rejects.toThrow('edge unavailable');
  });
});
