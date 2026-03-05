import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createClientMock,
  getCachedValueMock,
  cacheValueMock,
  withRedisLockMock,
  invokeMock,
  getUserMock,
  walletUpdateEqAddressMock,
  walletUpdateEqUserMock,
  walletUpdateMock,
  logsInsertMock,
  fromMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCachedValueMock: vi.fn(),
  cacheValueMock: vi.fn(),
  withRedisLockMock: vi.fn(),
  invokeMock: vi.fn(),
  getUserMock: vi.fn(),
  walletUpdateEqAddressMock: vi.fn(),
  walletUpdateEqUserMock: vi.fn(),
  walletUpdateMock: vi.fn(),
  logsInsertMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/redis/client', () => ({
  getCachedValue: getCachedValueMock,
  cacheValue: cacheValueMock,
  withRedisLock: withRedisLockMock,
}));

import { POST } from '@/app/api/guardian/scan/route';

function buildSupabaseMock() {
  walletUpdateEqAddressMock.mockResolvedValue({ data: null, error: null });
  walletUpdateEqUserMock.mockReturnValue({
    eq: walletUpdateEqAddressMock,
  });
  walletUpdateMock.mockReturnValue({
    eq: walletUpdateEqUserMock,
  });
  logsInsertMock.mockResolvedValue({ data: null, error: null });

  fromMock.mockImplementation((table: string) => {
    if (table === 'guardian_wallets') {
      return {
        update: walletUpdateMock,
      };
    }

    if (table === 'guardian_logs') {
      return {
        insert: logsInsertMock,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    auth: {
      getUser: getUserMock,
    },
    functions: {
      invoke: invokeMock,
    },
    from: fromMock,
  };
}

describe('POST /api/guardian/scan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedValueMock.mockResolvedValue(null);
    cacheValueMock.mockResolvedValue(undefined);
    withRedisLockMock.mockImplementation(async (_key, _ttl, callback) => callback());
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
        },
      },
    });
    createClientMock.mockResolvedValue(buildSupabaseMock());
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null,
      },
    });

    const response = await POST(
      new Request('http://localhost/api/guardian/scan', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
        }),
      })
    );

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('normalizes and caches the edge scan response', async () => {
    invokeMock.mockResolvedValue({
      data: {
        trust_score_percent: 92,
        risk_score: 1,
        confidence: 0.94,
        scanned_at: '2026-03-05T12:00:00.000Z',
        risks: [
          {
            type: 'UNLIMITED_APPROVAL',
            severity: 'high',
            description: 'Unlimited approval detected',
          },
        ],
        approvals: [],
        scan_id: 'scan-789',
      },
      error: null,
    });

    const response = await POST(
      new Request('http://localhost/api/guardian/scan', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
        }),
      })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.result).toMatchObject({
      walletAddress: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
      trustScorePercent: 92,
      riskLevel: 'Low',
      dataSource: 'live',
      scanId: 'scan-789',
      confidence: 0.94,
    });
    expect(data.result.trustScore).toEqual({
      score: 92,
      normalized: 0.92,
      confidence: 0.94,
    });
    expect(cacheValueMock).toHaveBeenCalledWith(
      'guardian:scan:0x1234567890123456789012345678901234567890',
      {
        result: expect.objectContaining({
          walletAddress: '0x1234567890123456789012345678901234567890',
          trustScorePercent: 92,
        }),
      },
      600
    );
    expect(walletUpdateMock).toHaveBeenCalledWith({
      trust_score: 92,
      last_scan: '2026-03-05T12:00:00.000Z',
    });
  });
});
