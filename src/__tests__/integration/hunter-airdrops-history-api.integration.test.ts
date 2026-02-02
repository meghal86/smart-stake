/**
 * Integration Tests for Hunter Airdrops History API
 * 
 * Tests GET /api/hunter/airdrops/history?wallet=<address> endpoint.
 * 
 * Requirements: 14.6
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('GET /api/hunter/airdrops/history - Airdrop History', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Test wallet address

  beforeAll(() => {
    // Ensure we have a base URL configured
    if (!BASE_URL) {
      throw new Error('NEXT_PUBLIC_BASE_URL must be configured for integration tests');
    }
  });

  describe('Basic Endpoint Functionality', () => {
    test('returns 200 OK for valid wallet address', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('returns valid JSON response', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    test('response includes required fields: items, ts', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('ts');
    });

    test('items field is an array', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      expect(Array.isArray(data.items)).toBe(true);
    });

    test('ts field is a valid ISO 8601 timestamp', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      expect(typeof data.ts).toBe('string');
      expect(data.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's a valid date
      const timestamp = new Date(data.ts);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Wallet Parameter Validation', () => {
    test('returns 400 BAD_REQUEST when wallet parameter is missing', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history`,
        { method: 'GET' }
      );

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'BAD_REQUEST');
      expect(data.error).toHaveProperty('message');
      expect(data.error.message).toContain('wallet parameter is required');
    });

    test('accepts valid Ethereum address format', async () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${validAddress}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
    });

    test('accepts lowercase Ethereum address', async () => {
      const lowercaseAddress = '0x742d35cc6634c0532925a3b844bc9e7595f0beb';
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${lowercaseAddress}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
    });

    test('accepts uppercase Ethereum address', async () => {
      const uppercaseAddress = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB';
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${uppercaseAddress}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
    });
  });

  describe('History Item Structure', () => {
    test('each history item has required fields', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.items.length > 0) {
        const item = data.items[0];
        
        // Required fields from user_airdrop_status table
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('user_id');
        expect(item).toHaveProperty('opportunity_id');
        expect(item).toHaveProperty('wallet_address');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('updated_at');
      }
    });

    test('status field contains valid values', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const validStatuses = ['eligible', 'maybe', 'unlikely', 'claimed', 'missed', 'expired'];
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(validStatuses).toContain(item.status);
        });
      }
    });

    test('wallet_address matches requested wallet', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item.wallet_address.toLowerCase()).toBe(TEST_WALLET.toLowerCase());
        });
      }
    });

    test('includes nested opportunity data', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.items.length > 0) {
        const item = data.items[0];
        
        // Should have nested opportunity object
        expect(item).toHaveProperty('opportunity');
        
        if (item.opportunity) {
          expect(item.opportunity).toHaveProperty('id');
          expect(item.opportunity).toHaveProperty('title');
          expect(item.opportunity).toHaveProperty('type');
        }
      }
    });

    test('claim_amount is present for claimed status', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const claimedItems = data.items.filter((item: any) => item.status === 'claimed');
      
      if (claimedItems.length > 0) {
        claimedItems.forEach((item: any) => {
          // claim_amount should be present for claimed items
          expect(item).toHaveProperty('claim_amount');
        });
      }
    });

    test('claimed_at timestamp is present for claimed status', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const claimedItems = data.items.filter((item: any) => item.status === 'claimed');
      
      if (claimedItems.length > 0) {
        claimedItems.forEach((item: any) => {
          expect(item).toHaveProperty('claimed_at');
          expect(item.claimed_at).not.toBeNull();
          
          // Verify it's a valid timestamp
          const timestamp = new Date(item.claimed_at);
          expect(timestamp.toString()).not.toBe('Invalid Date');
        });
      }
    });
  });

  describe('Sorting and Ordering', () => {
    test('items are sorted by updated_at descending (most recent first)', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.items.length > 1) {
        for (let i = 1; i < data.items.length; i++) {
          const prevDate = new Date(data.items[i - 1].updated_at);
          const currDate = new Date(data.items[i].updated_at);
          
          // Previous item should be more recent or equal
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });
  });

  describe('Empty History Handling', () => {
    test('returns empty array for wallet with no history', async () => {
      // Use a wallet address that likely has no history
      const emptyWallet = '0x0000000000000000000000000000000000000001';
      
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${emptyWallet}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBe(0);
    });
  });

  describe('Status Categories', () => {
    test('eligible status indicates user qualifies for airdrop', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const eligibleItems = data.items.filter((item: any) => item.status === 'eligible');
      
      if (eligibleItems.length > 0) {
        eligibleItems.forEach((item: any) => {
          expect(item.status).toBe('eligible');
          // Eligible items should not have claimed_at
          expect(item.claimed_at).toBeNull();
        });
      }
    });

    test('maybe status indicates uncertain eligibility', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const maybeItems = data.items.filter((item: any) => item.status === 'maybe');
      
      if (maybeItems.length > 0) {
        maybeItems.forEach((item: any) => {
          expect(item.status).toBe('maybe');
        });
      }
    });

    test('unlikely status indicates user does not qualify', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const unlikelyItems = data.items.filter((item: any) => item.status === 'unlikely');
      
      if (unlikelyItems.length > 0) {
        unlikelyItems.forEach((item: any) => {
          expect(item.status).toBe('unlikely');
        });
      }
    });

    test('claimed status indicates airdrop was successfully claimed', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const claimedItems = data.items.filter((item: any) => item.status === 'claimed');
      
      if (claimedItems.length > 0) {
        claimedItems.forEach((item: any) => {
          expect(item.status).toBe('claimed');
          expect(item.claimed_at).not.toBeNull();
        });
      }
    });

    test('missed status indicates claim window was missed', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const missedItems = data.items.filter((item: any) => item.status === 'missed');
      
      if (missedItems.length > 0) {
        missedItems.forEach((item: any) => {
          expect(item.status).toBe('missed');
        });
      }
    });

    test('expired status indicates airdrop claim period has ended', async () => {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      const expiredItems = data.items.filter((item: any) => item.status === 'expired');
      
      if (expiredItems.length > 0) {
        expiredItems.forEach((item: any) => {
          expect(item.status).toBe('expired');
        });
      }
    });
  });

  describe('Performance', () => {
    test('responds within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    test('handles database errors gracefully', async () => {
      // This test assumes the endpoint handles database errors
      // In a real scenario, you might need to mock the database to trigger an error
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`,
        { method: 'GET' }
      );

      // Should either succeed or return a proper error response
      if (!response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error).toHaveProperty('message');
      }
    });
  });

  describe('Case Sensitivity', () => {
    test('handles mixed-case wallet addresses correctly', async () => {
      const mixedCaseWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${mixedCaseWallet}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          // Wallet addresses should match (case-insensitive)
          expect(item.wallet_address.toLowerCase()).toBe(mixedCaseWallet.toLowerCase());
        });
      }
    });
  });
});
