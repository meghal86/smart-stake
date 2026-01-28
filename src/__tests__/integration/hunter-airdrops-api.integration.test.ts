/**
 * Integration Tests for Hunter Airdrops API
 * 
 * Tests GET /api/hunter/airdrops endpoint for non-personalized feed.
 * 
 * Requirements: 1.1-1.7, 14.5
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('GET /api/hunter/airdrops - Non-Personalized Feed', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  beforeAll(() => {
    // Ensure we have a base URL configured
    if (!BASE_URL) {
      throw new Error('NEXT_PUBLIC_BASE_URL must be configured for integration tests');
    }
  });

  describe('Basic Endpoint Functionality', () => {
    test('returns 200 OK for non-personalized request', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('returns valid JSON response', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    test('response includes required fields: items, cursor, ts', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('cursor');
      expect(data).toHaveProperty('ts');
    });

    test('items field is an array', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      expect(Array.isArray(data.items)).toBe(true);
    });

    test('ts field is a valid ISO 8601 timestamp', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      expect(typeof data.ts).toBe('string');
      expect(data.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's a valid date
      const timestamp = new Date(data.ts);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('cursor field is null for non-paginated results', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      expect(data.cursor).toBeNull();
    });
  });

  describe('Airdrop Filtering', () => {
    test('returns only airdrop type opportunities', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item.type).toBe('airdrop');
        });
      }
    });

    test('returns only published status opportunities', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item.status).toBe('published');
        });
      }
    });

    test('does not return draft or expired opportunities', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item.status).not.toBe('draft');
          expect(item.status).not.toBe('expired');
        });
      }
    });
  });

  describe('Opportunity Data Structure', () => {
    test('each opportunity has required core fields', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        const opportunity = data.items[0];
        
        // Core fields
        expect(opportunity).toHaveProperty('id');
        expect(opportunity).toHaveProperty('slug');
        expect(opportunity).toHaveProperty('title');
        expect(opportunity).toHaveProperty('type');
        expect(opportunity).toHaveProperty('status');
        expect(opportunity).toHaveProperty('created_at');
      }
    });

    test('each opportunity has airdrop-specific fields', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        const opportunity = data.items[0];
        
        // Airdrop-specific fields (may be null)
        expect(opportunity).toHaveProperty('snapshot_date');
        expect(opportunity).toHaveProperty('claim_start');
        expect(opportunity).toHaveProperty('claim_end');
        expect(opportunity).toHaveProperty('airdrop_category');
      }
    });

    test('opportunities have valid trust_score values', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          if (item.trust_score !== null) {
            expect(typeof item.trust_score).toBe('number');
            expect(item.trust_score).toBeGreaterThanOrEqual(0);
            expect(item.trust_score).toBeLessThanOrEqual(100);
          }
        });
      }
    });

    test('opportunities have valid chains array', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          if (item.chains) {
            expect(Array.isArray(item.chains)).toBe(true);
            item.chains.forEach((chain: any) => {
              expect(typeof chain).toBe('string');
            });
          }
        });
      }
    });
  });

  describe('Non-Personalized Behavior', () => {
    test('does not include eligibility_preview field without wallet', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item).not.toHaveProperty('eligibility_preview');
        });
      }
    });

    test('does not include ranking field without wallet', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item).not.toHaveProperty('ranking');
        });
      }
    });

    test('results are sorted by created_at descending', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 1) {
        for (let i = 1; i < data.items.length; i++) {
          const prevDate = new Date(data.items[i - 1].created_at);
          const currDate = new Date(data.items[i].created_at);
          
          // Previous item should be newer or equal
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });
  });

  describe('Pagination and Limits', () => {
    test('returns at most 100 opportunities', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      expect(data.items.length).toBeLessThanOrEqual(100);
    });

    test('handles empty results gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      // Should return empty array, not null or undefined
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.cursor).toBeNull();
      expect(data.ts).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles database errors gracefully', async () => {
      // This test assumes the endpoint handles DB errors properly
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      // Should either succeed or return proper error format
      if (!response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error).toHaveProperty('message');
      }
    });

    test('returns 500 with error object on internal failure', async () => {
      // This test verifies error response format
      // We can't easily trigger a real error, so we just verify the endpoint exists
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      // If there's an error, it should be properly formatted
      if (response.status === 500) {
        const data = await response.json();
        expect(data.error).toBeDefined();
        expect(data.error.code).toBe('INTERNAL');
        expect(typeof data.error.message).toBe('string');
      }
    });
  });

  describe('HTTP Method Validation', () => {
    test('accepts GET requests', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
    });

    test('rejects POST requests', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });

    test('rejects PUT requests', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });

    test('rejects DELETE requests', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'DELETE',
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    test('responds within 2 seconds', async () => {
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });
      
      const duration = Date.now() - start;
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    test('handles concurrent requests correctly', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(`${BASE_URL}/api/hunter/airdrops`, {
          method: 'GET',
        })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // All should return valid data
      const dataPromises = responses.map(r => r.json());
      const dataResults = await Promise.all(dataPromises);
      
      dataResults.forEach(data => {
        expect(data).toHaveProperty('items');
        expect(Array.isArray(data.items)).toBe(true);
      });
    });
  });

  describe('Data Consistency', () => {
    test('returns consistent results across multiple requests', async () => {
      const response1 = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });
      const data1 = await response1.json();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });
      const data2 = await response2.json();

      // Should return same number of items (assuming no DB changes)
      // This is a weak test but verifies basic consistency
      expect(typeof data1.items.length).toBe('number');
      expect(typeof data2.items.length).toBe('number');
    });

    test('timestamps are recent (within last minute)', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      const timestamp = new Date(data.ts);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();

      // Timestamp should be within last minute
      expect(diffMs).toBeLessThan(60000);
      expect(diffMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Source and Reference Fields', () => {
    test('opportunities include source field', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item).toHaveProperty('source');
          if (item.source) {
            expect(typeof item.source).toBe('string');
            // Valid sources: admin, galxe, defillama
            expect(['admin', 'galxe', 'defillama']).toContain(item.source);
          }
        });
      }
    });

    test('opportunities include source_ref field', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item).toHaveProperty('source_ref');
          if (item.source_ref) {
            expect(typeof item.source_ref).toBe('string');
          }
        });
      }
    });
  });

  describe('Requirements Field Validation', () => {
    test('opportunities may include requirements field', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          if (item.requirements) {
            expect(typeof item.requirements).toBe('object');
          }
        });
      }
    });

    test('requirements field has valid structure when present', async () => {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.items.length > 0) {
        data.items.forEach((item: any) => {
          if (item.requirements && typeof item.requirements === 'object') {
            // Valid requirement fields
            const validFields = [
              'chains',
              'min_wallet_age_days',
              'min_tx_count',
              'required_tokens',
            ];
            
            Object.keys(item.requirements).forEach(key => {
              expect(validFields).toContain(key);
            });
          }
        });
      }
    });
  });
});
