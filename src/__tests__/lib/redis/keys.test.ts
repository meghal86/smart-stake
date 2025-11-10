/**
 * Tests for Redis key namespace functions
 */

import { describe, it, expect } from 'vitest';
import { RedisKeys, RedisKeyPatterns, RedisTTL } from '@/lib/redis/keys';

describe('RedisKeys', () => {
  describe('guardianScan', () => {
    it('should generate correct guardian scan key', () => {
      const key = RedisKeys.guardianScan('opp-123');
      expect(key).toBe('guardian:scan:opp-123');
    });

    it('should handle UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const key = RedisKeys.guardianScan(uuid);
      expect(key).toBe(`guardian:scan:${uuid}`);
    });
  });

  describe('eligibility', () => {
    it('should generate correct eligibility key', () => {
      const key = RedisKeys.eligibility('opp-123', 'wallet-hash-456');
      expect(key).toBe('elig:op:opp-123:wa:wallet-hash-456');
    });

    it('should handle hashed wallet addresses', () => {
      const hash = 'a1b2c3d4e5f6';
      const key = RedisKeys.eligibility('opp-789', hash);
      expect(key).toBe(`elig:op:opp-789:wa:${hash}`);
    });
  });

  describe('walletSignals', () => {
    it('should generate correct wallet signals key', () => {
      const key = RedisKeys.walletSignals('0x123', '2025-01-05');
      expect(key).toBe('wallet:signals:0x123:2025-01-05');
    });

    it('should use day identifier for cache key', () => {
      const wallet = '0xabcdef';
      const day = '2025-11-05';
      const key = RedisKeys.walletSignals(wallet, day);
      expect(key).toContain(day);
    });
  });

  describe('trending', () => {
    it('should generate correct trending key', () => {
      const key = RedisKeys.trending();
      expect(key).toBe('feed:trending');
    });

    it('should be consistent across calls', () => {
      const key1 = RedisKeys.trending();
      const key2 = RedisKeys.trending();
      expect(key1).toBe(key2);
    });
  });

  describe('userPrefs', () => {
    it('should generate correct user preferences key', () => {
      const key = RedisKeys.userPrefs('user-123');
      expect(key).toBe('user:prefs:user-123');
    });

    it('should handle UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const key = RedisKeys.userPrefs(uuid);
      expect(key).toBe(`user:prefs:${uuid}`);
    });
  });

  describe('feedPage', () => {
    it('should generate correct feed page key with default cursor', () => {
      const key = RedisKeys.feedPage('hash123');
      expect(key).toBe('feed:page:hash123:first');
    });

    it('should generate correct feed page key with custom cursor', () => {
      const key = RedisKeys.feedPage('hash456', 'cursor789');
      expect(key).toBe('feed:page:hash456:cursor789');
    });
  });

  describe('opportunityDetail', () => {
    it('should generate correct opportunity detail key', () => {
      const key = RedisKeys.opportunityDetail('aave-staking');
      expect(key).toBe('opp:detail:aave-staking');
    });

    it('should handle slug format', () => {
      const slug = 'compound-yield-farming';
      const key = RedisKeys.opportunityDetail(slug);
      expect(key).toBe(`opp:detail:${slug}`);
    });
  });

  describe('rateLimit', () => {
    it('should generate correct rate limit key', () => {
      const key = RedisKeys.rateLimit('192.168.1.1', '/api/hunter/opportunities');
      expect(key).toBe('ratelimit:/api/hunter/opportunities:192.168.1.1');
    });

    it('should handle user ID identifier', () => {
      const key = RedisKeys.rateLimit('user-123', '/api/eligibility/preview');
      expect(key).toBe('ratelimit:/api/eligibility/preview:user-123');
    });
  });

  describe('lock', () => {
    it('should generate correct lock key', () => {
      const key = RedisKeys.lock('opportunity-sync');
      expect(key).toBe('lock:opportunity-sync');
    });

    it('should namespace locks properly', () => {
      const key = RedisKeys.lock('guardian-rescan');
      expect(key).toContain('lock:');
    });
  });

  describe('session', () => {
    it('should generate correct session key', () => {
      const key = RedisKeys.session('sess-123', 'filters');
      expect(key).toBe('session:sess-123:filters');
    });

    it('should support nested session keys', () => {
      const key = RedisKeys.session('sess-456', 'user:preferences');
      expect(key).toBe('session:sess-456:user:preferences');
    });
  });
});

describe('RedisKeyPatterns', () => {
  it('should define correct pattern for guardian scans', () => {
    expect(RedisKeyPatterns.allGuardianScans).toBe('guardian:scan:*');
  });

  it('should define correct pattern for eligibility', () => {
    expect(RedisKeyPatterns.allEligibility).toBe('elig:op:*');
  });

  it('should define correct pattern for wallet signals', () => {
    expect(RedisKeyPatterns.allWalletSignals).toBe('wallet:signals:*');
  });

  it('should define correct pattern for feed pages', () => {
    expect(RedisKeyPatterns.allFeedPages).toBe('feed:page:*');
  });

  it('should define correct pattern for opportunity details', () => {
    expect(RedisKeyPatterns.allOpportunityDetails).toBe('opp:detail:*');
  });

  it('should define correct pattern for user preferences', () => {
    expect(RedisKeyPatterns.allUserPrefs).toBe('user:prefs:*');
  });

  it('should define correct pattern for rate limits', () => {
    expect(RedisKeyPatterns.allRateLimits).toBe('ratelimit:*');
  });

  it('should define correct pattern for locks', () => {
    expect(RedisKeyPatterns.allLocks).toBe('lock:*');
  });

  it('should define correct pattern for sessions', () => {
    expect(RedisKeyPatterns.allSessions).toBe('session:*');
  });
});

describe('RedisTTL', () => {
  it('should define guardian scan TTL as 1 hour', () => {
    expect(RedisTTL.guardianScan).toBe(3600);
  });

  it('should define eligibility TTL as 1 hour', () => {
    expect(RedisTTL.eligibility).toBe(3600);
  });

  it('should define wallet signals TTL as 20 minutes', () => {
    expect(RedisTTL.walletSignals).toBe(1200);
  });

  it('should define trending TTL as 10 minutes', () => {
    expect(RedisTTL.trending).toBe(600);
  });

  it('should define user prefs TTL as 30 minutes', () => {
    expect(RedisTTL.userPrefs).toBe(1800);
  });

  it('should define feed page TTL as 5 minutes', () => {
    expect(RedisTTL.feedPage).toBe(300);
  });

  it('should define opportunity detail TTL as 10 minutes', () => {
    expect(RedisTTL.opportunityDetail).toBe(600);
  });

  it('should define session TTL as 24 hours', () => {
    expect(RedisTTL.session).toBe(86400);
  });

  it('should have all TTLs as positive integers', () => {
    Object.values(RedisTTL).forEach(ttl => {
      expect(ttl).toBeGreaterThan(0);
      expect(Number.isInteger(ttl)).toBe(true);
    });
  });
});

describe('Key collision prevention', () => {
  it('should not have collisions between different key types', () => {
    const keys = [
      RedisKeys.guardianScan('123'),
      RedisKeys.eligibility('123', 'wallet'),
      RedisKeys.walletSignals('123', '2025-01-05'),
      RedisKeys.userPrefs('123'),
      RedisKeys.feedPage('123'),
      RedisKeys.opportunityDetail('123'),
      RedisKeys.rateLimit('123', 'endpoint'),
      RedisKeys.lock('123'),
      RedisKeys.session('123', 'key'),
    ];

    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should generate unique keys for different inputs', () => {
    const key1 = RedisKeys.guardianScan('opp-1');
    const key2 = RedisKeys.guardianScan('opp-2');
    expect(key1).not.toBe(key2);
  });
});
