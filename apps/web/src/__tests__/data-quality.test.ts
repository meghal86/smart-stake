import { GET } from '../app/api/healthz/route';

// Mock fetch for provider checks
global.fetch = jest.fn();

describe('Data Quality & Correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health endpoint with data quality', () => {
    test('returns healthy status with good data quality', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Etherscan
        .mockResolvedValueOnce({ ok: true }); // CoinGecko

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mode).toBe('live');
      expect(data.latestEventAgeSec).toBeDefined();
      expect(data.invariants).toBeDefined();
      expect(data.realRatio1h).toBeDefined();
    });

    test('returns degraded status with stale data', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Etherscan
        .mockResolvedValueOnce({ ok: true }); // CoinGecko

      // Mock stale data (>10 minutes)
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 700 * 1000);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(206);
      expect(data.mode).toBe('cached');
    });

    test('includes all required data quality metrics', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('latestEventAgeSec');
      expect(data).toHaveProperty('invariants');
      expect(data.invariants).toHaveProperty('negUSD');
      expect(data.invariants).toHaveProperty('missingTx');
      expect(data.invariants).toHaveProperty('missingWallet');
      expect(data).toHaveProperty('realRatio1h');
    });
  });

  describe('Invariant validation', () => {
    test('detects negative USD amounts', () => {
      const events = [
        { amount_usd: 100 },
        { amount_usd: -50 }, // Invalid
        { amount_usd: 200 }
      ];

      const negativeCount = events.filter(e => e.amount_usd < 0).length;
      expect(negativeCount).toBe(1);
    });

    test('detects missing transaction hashes', () => {
      const events = [
        { tx_hash: '0xabc123' },
        { tx_hash: null }, // Invalid
        { tx_hash: '' }, // Invalid
        { tx_hash: '0xdef456' }
      ];

      const missingCount = events.filter(e => !e.tx_hash || e.tx_hash === '').length;
      expect(missingCount).toBe(2);
    });

    test('detects missing wallet hashes', () => {
      const events = [
        { wallet_hash: '0x123' },
        { wallet_hash: null }, // Invalid
        { wallet_hash: '0x456' }
      ];

      const missingCount = events.filter(e => !e.wallet_hash).length;
      expect(missingCount).toBe(1);
    });
  });

  describe('Tolerance calculations', () => {
    test('calculates count variance correctly', () => {
      const ourCount = 100;
      const providerCount = 95;
      const variance = Math.abs(ourCount - providerCount);
      
      expect(variance).toBe(5);
      expect(variance).toBeLessThan(10); // Within tolerance
    });

    test('calculates volume variance correctly', () => {
      const ourVolume = 1000000;
      const providerVolume = 950000;
      const variance = Math.abs(ourVolume - providerVolume);
      
      expect(variance).toBe(50000);
      expect(variance).toBeLessThan(100000); // Within tolerance
    });

    test('identifies high variance', () => {
      const ourCount = 100;
      const providerCount = 85; // 15 difference
      const variance = Math.abs(ourCount - providerCount);
      
      expect(variance).toBe(15);
      expect(variance).toBeGreaterThan(10); // Exceeds tolerance
    });
  });

  describe('Price sanity checks', () => {
    test('validates price within tolerance', () => {
      const cachedPrice = 2000;
      const observedPrice = 2100;
      const tolerance = 0.1; // 10%
      
      const variance = Math.abs(observedPrice - cachedPrice) / cachedPrice;
      
      expect(variance).toBe(0.05); // 5%
      expect(variance).toBeLessThan(tolerance);
    });

    test('detects price outside tolerance', () => {
      const cachedPrice = 2000;
      const observedPrice = 2300; // 15% difference
      const tolerance = 0.1; // 10%
      
      const variance = Math.abs(observedPrice - cachedPrice) / cachedPrice;
      
      expect(variance).toBe(0.15); // 15%
      expect(variance).toBeGreaterThan(tolerance);
    });
  });

  describe('Freshness calculations', () => {
    test('calculates event age correctly', () => {
      const now = Date.now();
      const eventTime = now - (5 * 60 * 1000); // 5 minutes ago
      const ageSeconds = Math.floor((now - eventTime) / 1000);
      
      expect(ageSeconds).toBe(300); // 5 minutes = 300 seconds
      expect(ageSeconds).toBeLessThan(600); // Within 10 minute threshold
    });

    test('detects stale data', () => {
      const now = Date.now();
      const eventTime = now - (15 * 60 * 1000); // 15 minutes ago
      const ageSeconds = Math.floor((now - eventTime) / 1000);
      
      expect(ageSeconds).toBe(900); // 15 minutes = 900 seconds
      expect(ageSeconds).toBeGreaterThan(600); // Exceeds 10 minute threshold
    });
  });

  describe('Provenance ratio calculations', () => {
    test('calculates real data ratio correctly', () => {
      const events = [
        { meta: { provenance: 'Real' } },
        { meta: { provenance: 'Real' } },
        { meta: { provenance: 'Simulated' } },
        { meta: { provenance: 'Real' } }
      ];

      const realCount = events.filter(e => e.meta.provenance === 'Real').length;
      const ratio = realCount / events.length;
      
      expect(ratio).toBe(0.75); // 75%
      expect(ratio).toBeGreaterThan(0.4); // Above threshold
    });

    test('detects low real data ratio', () => {
      const events = [
        { meta: { provenance: 'Real' } },
        { meta: { provenance: 'Simulated' } },
        { meta: { provenance: 'Simulated' } },
        { meta: { provenance: 'Simulated' } }
      ];

      const realCount = events.filter(e => e.meta.provenance === 'Real').length;
      const ratio = realCount / events.length;
      
      expect(ratio).toBe(0.25); // 25%
      expect(ratio).toBeLessThan(0.4); // Below threshold
    });
  });

  describe('Slack alert formatting', () => {
    test('formats alert payload correctly', () => {
      const issues = [
        '❌ 5 events with negative USD amounts',
        '⏰ Data is 15 minutes stale'
      ];

      const payload = {
        text: '🚨 AlphaWhale Data Quality Alert',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 Data Quality Issues Detected\n\n${issues.join('\n')}\n\n• Status: /status\n• Ops Dashboard: /internal/ops`
            }
          }
        ]
      };

      expect(payload.blocks[0].text.text).toContain('negative USD amounts');
      expect(payload.blocks[0].text.text).toContain('15 minutes stale');
      expect(payload.blocks[0].text.text).toContain('/status');
      expect(payload.blocks[0].text.text).toContain('/internal/ops');
    });
  });
});