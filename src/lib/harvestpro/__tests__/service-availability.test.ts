/**
 * Service Availability Manager Tests
 * 
 * Tests service monitoring and graceful degradation functionality.
 * 
 * Requirements: Enhanced Req 15 AC2 (graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ServiceAvailabilityManager, 
  HarvestProService, 
  withServiceFallback,
  isServiceHealthy,
  getServiceHealth
} from '../service-availability';

// Mock fetch
global.fetch = vi.fn();

// Mock window.ethereum for wallet connection tests
Object.defineProperty(window, 'ethereum', {
  value: {},
  writable: true
});

describe('ServiceAvailabilityManager', () => {
  let manager: ServiceAvailabilityManager;

  beforeEach(() => {
    manager = new ServiceAvailabilityManager({
      checkInterval: 100, // Short interval for testing
      timeout: 1000,
      retryAttempts: 2,
      enableFallback: true
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('Service Status Management', () => {
    test('initializes all services as available', () => {
      Object.values(HarvestProService).forEach(service => {
        expect(manager.isServiceAvailable(service)).toBe(true);
      });
    });

    test('returns service status correctly', () => {
      const status = manager.getServiceStatus(HarvestProService.PRICE_ORACLE);
      expect(status).toEqual({
        available: true,
        lastChecked: expect.any(Number)
      });
    });

    test('returns all service statuses', () => {
      const allStatuses = manager.getAllServiceStatuses();
      expect(Object.keys(allStatuses)).toHaveLength(Object.keys(HarvestProService).length);
    });
  });

  describe('Service Health Checking', () => {
    test('marks service as unavailable when check fails', async () => {
      // Mock fetch to fail
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const status = await manager.checkServiceAvailability(HarvestProService.PRICE_ORACLE);
      
      expect(status.available).toBe(false);
      expect(status.error).toBe('Network error');
      expect(manager.isServiceAvailable(HarvestProService.PRICE_ORACLE)).toBe(false);
    });

    test('marks service as available when check succeeds', async () => {
      // Mock fetch to succeed
      (fetch as any).mockResolvedValueOnce({ ok: true });

      const status = await manager.checkServiceAvailability(HarvestProService.PRICE_ORACLE);
      
      expect(status.available).toBe(true);
      expect(status.error).toBeUndefined();
      expect(manager.isServiceAvailable(HarvestProService.PRICE_ORACLE)).toBe(true);
    });

    test('wallet connection check works without fetch', async () => {
      const status = await manager.checkServiceAvailability(HarvestProService.WALLET_CONNECTION);
      
      // Should be true because we mocked window.ethereum
      expect(status.available).toBe(true);
    });
  });

  describe('Service Monitoring', () => {
    test('starts monitoring a service', () => {
      manager.startMonitoring(HarvestProService.PRICE_ORACLE);
      
      // Should have set up an interval
      expect(manager['checkIntervals'].has(HarvestProService.PRICE_ORACLE)).toBe(true);
    });

    test('stops monitoring a service', () => {
      manager.startMonitoring(HarvestProService.PRICE_ORACLE);
      manager.stopMonitoring(HarvestProService.PRICE_ORACLE);
      
      // Should have cleared the interval
      expect(manager['checkIntervals'].has(HarvestProService.PRICE_ORACLE)).toBe(false);
    });

    test('starts monitoring all services', () => {
      manager.startMonitoringAll();
      
      Object.values(HarvestProService).forEach(service => {
        expect(manager['checkIntervals'].has(service)).toBe(true);
      });
    });

    test('stops monitoring all services', () => {
      manager.startMonitoringAll();
      manager.stopMonitoringAll();
      
      Object.values(HarvestProService).forEach(service => {
        expect(manager['checkIntervals'].has(service)).toBe(false);
      });
    });
  });

  describe('Fallback Data Management', () => {
    test('returns default fallback data for price oracle', () => {
      const fallbackData = manager.getFallbackData(HarvestProService.PRICE_ORACLE);
      
      expect(fallbackData).toEqual({
        ETH: 2000,
        BTC: 40000,
        USDC: 1,
        timestamp: expect.any(Number),
        source: 'fallback'
      });
    });

    test('returns default fallback data for Guardian API', () => {
      const fallbackData = manager.getFallbackData(HarvestProService.GUARDIAN_API);
      
      expect(fallbackData).toEqual({
        score: 5.0,
        riskLevel: 'MEDIUM',
        timestamp: expect.any(Number),
        source: 'fallback'
      });
    });

    test('sets and retrieves custom fallback data', () => {
      const customData = { custom: 'data' };
      manager.setFallbackData(HarvestProService.PRICE_ORACLE, customData);
      
      const retrieved = manager.getFallbackData(HarvestProService.PRICE_ORACLE);
      expect(retrieved).toEqual(customData);
    });
  });

  describe('Health Summary', () => {
    test('reports healthy status when all services are available', () => {
      const summary = manager.getHealthSummary();
      
      expect(summary.overallHealth).toBe('healthy');
      expect(summary.availableServices).toBe(summary.totalServices);
      expect(summary.criticalServicesDown).toBe(0);
    });

    test('reports degraded status when non-critical services are down', async () => {
      // Mark a non-critical service as down
      (fetch as any).mockRejectedValueOnce(new Error('Service down'));
      await manager.checkServiceAvailability(HarvestProService.GAS_ESTIMATION);
      
      const summary = manager.getHealthSummary();
      
      expect(summary.overallHealth).toBe('degraded');
      expect(summary.unavailableServices).toBe(1);
    });

    test('reports critical status when critical services are down', async () => {
      // Mark a critical service as down
      (fetch as any).mockRejectedValueOnce(new Error('Service down'));
      await manager.checkServiceAvailability(HarvestProService.PRICE_ORACLE);
      
      const summary = manager.getHealthSummary();
      
      expect(summary.overallHealth).toBe('critical');
      expect(summary.criticalServicesDown).toBe(1);
    });
  });

  describe('Cleanup', () => {
    test('cleanup stops all monitoring and clears services', () => {
      manager.startMonitoringAll();
      manager.cleanup();
      
      expect(manager['checkIntervals'].size).toBe(0);
      expect(manager['services'].size).toBe(0);
    });
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withServiceFallback', () => {
    test('returns service result when call succeeds', async () => {
      const mockServiceCall = vi.fn().mockResolvedValue('success');
      
      const result = await withServiceFallback(
        HarvestProService.PRICE_ORACLE,
        mockServiceCall
      );
      
      expect(result).toBe('success');
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
    });

    test('returns fallback data when service call fails', async () => {
      const mockServiceCall = vi.fn().mockRejectedValue(new Error('Service failed'));
      const fallbackData = { fallback: 'data' };
      
      const result = await withServiceFallback(
        HarvestProService.PRICE_ORACLE,
        mockServiceCall,
        fallbackData
      );
      
      expect(result).toEqual(fallbackData);
    });

    test('returns default fallback when no custom fallback provided', async () => {
      const mockServiceCall = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      const result = await withServiceFallback(
        HarvestProService.PRICE_ORACLE,
        mockServiceCall
      );
      
      expect(result).toEqual({
        ETH: 2000,
        BTC: 40000,
        USDC: 1,
        timestamp: expect.any(Number),
        source: 'fallback'
      });
    });

    test('throws error when no fallback data available', async () => {
      const mockServiceCall = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      await expect(
        withServiceFallback(HarvestProService.CEX_APIS, mockServiceCall)
      ).rejects.toThrow('Service failed');
    });
  });

  describe('isServiceHealthy', () => {
    test('returns service availability status', () => {
      // Should be true initially
      expect(isServiceHealthy(HarvestProService.PRICE_ORACLE)).toBe(true);
    });
  });

  describe('getServiceHealth', () => {
    test('returns health summary', () => {
      const health = getServiceHealth();
      
      expect(health).toHaveProperty('totalServices');
      expect(health).toHaveProperty('availableServices');
      expect(health).toHaveProperty('overallHealth');
    });
  });
});

describe('Service-Specific Health Checks', () => {
  let manager: ServiceAvailabilityManager;

  beforeEach(() => {
    manager = new ServiceAvailabilityManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  test('price oracle health check calls correct endpoint', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    
    await manager.checkServiceAvailability(HarvestProService.PRICE_ORACLE);
    
    expect(fetch).toHaveBeenCalledWith('/api/prices/health', {
      method: 'GET',
      signal: expect.any(AbortSignal)
    });
  });

  test('Guardian API health check calls correct endpoint', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    
    await manager.checkServiceAvailability(HarvestProService.GUARDIAN_API);
    
    expect(fetch).toHaveBeenCalledWith('/api/guardian/health', {
      method: 'GET',
      signal: expect.any(AbortSignal)
    });
  });

  test('gas estimation health check calls correct endpoint', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    
    await manager.checkServiceAvailability(HarvestProService.GAS_ESTIMATION);
    
    expect(fetch).toHaveBeenCalledWith('/api/gas/health', {
      method: 'GET',
      signal: expect.any(AbortSignal)
    });
  });

  test('wallet connection check does not use fetch', async () => {
    await manager.checkServiceAvailability(HarvestProService.WALLET_CONNECTION);
    
    expect(fetch).not.toHaveBeenCalled();
  });
});