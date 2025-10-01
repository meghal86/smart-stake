import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWhaleSpotlight } from '../../src/lib/adapters/whaleSpotlight';
import { getFearIndex } from '../../src/lib/adapters/fearIndex';
import { getDigest } from '../../src/lib/adapters/digest';

// Mock fetch
global.fetch = vi.fn();

describe('Adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('whaleSpotlight', () => {
    it('should return real data when API succeeds', async () => {
      const mockResponse = {
        topWhale: {
          address: '0x1234...5678',
          asset: 'BTC',
          amount: 50000000,
          narrative: 'Large BTC movement',
          risk: 'high'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getWhaleSpotlight();
      
      expect(result.provenance).toBe('Real');
      expect(result.whaleId).toBe('0x1234...5678');
      expect(result.asset).toBe('BTC');
    });

    it('should return simulated data when API fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const result = await getWhaleSpotlight();
      
      expect(result.provenance).toBe('Simulated');
      expect(result.whaleId).toBe('0xabcd...1234');
    });
  });

  describe('fearIndex', () => {
    it('should return real data when API succeeds', async () => {
      const mockResponse = {
        fearIndex: {
          score: 75,
          label: 'Extreme greed'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getFearIndex();
      
      expect(result.provenance).toBe('Real');
      expect(result.score).toBe(75);
      expect(result.label).toBe('Extreme greed');
    });

    it('should return simulated data when API fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const result = await getFearIndex();
      
      expect(result.provenance).toBe('Simulated');
      expect(result.score).toBe(62);
    });
  });

  describe('digest', () => {
    it('should return real data when API succeeds', async () => {
      const mockResponse = {
        digest: [
          { description: 'Real whale movement', value_usd: 1000000 },
          { description: 'Real market activity', value_usd: -500000 }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getDigest();
      
      expect(result.provenance).toBe('Real');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].direction).toBe('buy');
      expect(result.items[1].direction).toBe('sell');
    });

    it('should return simulated data when API fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const result = await getDigest();
      
      expect(result.provenance).toBe('Simulated');
      expect(result.items).toHaveLength(3);
    });
  });
});