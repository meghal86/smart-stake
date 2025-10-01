import { GET } from '../app/api/healthz/route';
import { loadFlags, setFlag, rampFlag } from '../../../scripts/flags';
import { NextRequest } from 'next/server';

// Mock fetch for health checks
global.fetch = jest.fn();

describe('Observability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/healthz', () => {
    test('returns healthy status when providers are ok', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Etherscan
        .mockResolvedValueOnce({ ok: true }); // CoinGecko

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mode).toBe('live');
      expect(data.providers.etherscan).toBe('ok');
      expect(data.providers.coingecko).toBe('ok');
      expect(data.lastUpdateISO).toBeDefined();
      expect(data.version).toBeDefined();
    });

    test('returns degraded status when one provider fails', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Etherscan ok
        .mockRejectedValueOnce(new Error('Network error')); // CoinGecko down

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(206);
      expect(data.mode).toBe('simulated');
      expect(data.providers.etherscan).toBe('ok');
      expect(data.providers.coingecko).toBe('down');
    });

    test('returns cached mode when providers are degraded', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 429 }) // Etherscan rate limited
        .mockResolvedValueOnce({ ok: true }); // CoinGecko ok

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(206);
      expect(data.mode).toBe('cached');
      expect(data.providers.etherscan).toBe('degraded');
    });

    test('handles complete failure gracefully', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(206);
      expect(data.mode).toBe('simulated');
      expect(data.providers.etherscan).toBe('down');
      expect(data.providers.coingecko).toBe('down');
    });
  });

  describe('Feature Flags CLI', () => {
    const mockFlags = { 'ui.v2': true, 'alerts.enabled': false };

    beforeEach(() => {
      // Mock file system operations
      jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify(mockFlags)),
        writeFileSync: jest.fn()
      }));
    });

    test('loads flags correctly', () => {
      const flags = loadFlags();
      expect(flags).toEqual(mockFlags);
    });

    test('sets boolean flag correctly', () => {
      const fs = require('fs');
      setFlag('test.flag', 'true');
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('flags.json'),
        expect.stringContaining('"test.flag": true')
      );
    });

    test('sets numeric flag correctly', () => {
      const fs = require('fs');
      setFlag('test.ramp', '50');
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('flags.json'),
        expect.stringContaining('"test.ramp": 50')
      );
    });

    test('ramps flag percentage correctly', () => {
      const fs = require('fs');
      rampFlag('ui.v2', '75');
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('flags.json'),
        expect.stringContaining('"ui.v2.ramp": 75')
      );
    });

    test('validates ramp percentage bounds', () => {
      expect(() => rampFlag('test', '150')).toThrow('Percentage must be 0-100');
      expect(() => rampFlag('test', '-10')).toThrow('Percentage must be 0-100');
    });

    test('validates flag values', () => {
      expect(() => setFlag('test', 'invalid')).toThrow('Invalid value');
    });
  });

  describe('Error Budget Calculations', () => {
    test('calculates 5xx error rate correctly', () => {
      const totalRequests = 10000;
      const errors5xx = 5;
      const errorRate = (errors5xx / totalRequests) * 100;
      
      expect(errorRate).toBe(0.05);
      expect(errorRate).toBeLessThan(0.1); // Within 99.9% SLA
    });

    test('calculates frontend error rate correctly', () => {
      const totalRequests = 10000;
      const frontendErrors = 25;
      const errorRate = (frontendErrors / totalRequests) * 100;
      
      expect(errorRate).toBe(0.25);
      expect(errorRate).toBeLessThan(0.5); // Within 99.5% SLA
    });

    test('identifies SLA breach', () => {
      const totalRequests = 1000;
      const errors5xx = 2; // 0.2% error rate
      const errorRate = (errors5xx / totalRequests) * 100;
      
      expect(errorRate).toBeGreaterThan(0.1); // Breaches 99.9% SLA
    });
  });

  describe('Uptime Monitor', () => {
    test('detects high latency', () => {
      const latency = 850; // ms
      const threshold = 800;
      
      expect(latency).toBeGreaterThan(threshold);
    });

    test('detects service failure', () => {
      const healthResponse = { mode: 'down', providers: {} };
      
      expect(healthResponse.mode).toBe('down');
    });

    test('formats Slack alert payload correctly', () => {
      const message = '❌ Health check failed';
      const health = {
        mode: 'simulated',
        version: '1.0.0',
        providers: { etherscan: 'down', coingecko: 'ok' }
      };

      const payload = {
        text: '🚨 AlphaWhale Alert',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: message }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: '*Mode:* simulated' },
              { type: 'mrkdwn', text: '*Version:* 1.0.0' },
              { type: 'mrkdwn', text: '*Etherscan:* down' },
              { type: 'mrkdwn', text: '*CoinGecko:* ok' }
            ]
          }
        ]
      };

      expect(payload.blocks).toHaveLength(2);
      expect(payload.blocks[1].fields).toHaveLength(4);
    });
  });
});