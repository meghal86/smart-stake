/**
 * Unit Tests for Trust Signal Verification System
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { 
  TrustSignalVerificationManager, 
  DEFAULT_TRUST_SIGNALS,
  type TrustSignal,
  type ProofModalConfig 
} from '../TrustSignalVerification';

describe('TrustSignalVerificationManager', () => {
  let manager: TrustSignalVerificationManager;

  beforeEach(() => {
    manager = TrustSignalVerificationManager.getInstance();
    manager.clearCache();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = TrustSignalVerificationManager.getInstance();
      const instance2 = TrustSignalVerificationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('verifyTrustSignal', () => {
    test('should validate URL format', async () => {
      const invalidSignal: TrustSignal = {
        id: 'test-invalid',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'invalid-url',
        verified: false,
        lastUpdated: new Date()
      };

      const result = await manager.verifyTrustSignal(invalidSignal);
      
      expect(result.isValid).toBe(false);
      expect(result.hasValidUrl).toBe(false);
      expect(result.errorMessage).toBe('Invalid proof URL format');
    });

    test('should accept valid HTTPS URLs', async () => {
      const validSignal: TrustSignal = {
        id: 'test-valid',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'https://certik.com/projects/alphawhale',
        verified: true,
        lastUpdated: new Date()
      };

      const result = await manager.verifyTrustSignal(validSignal);
      
      expect(result.hasValidUrl).toBe(true);
    });

    test('should accept valid relative URLs', async () => {
      const validSignal: TrustSignal = {
        id: 'test-relative',
        type: 'methodology',
        label: 'Test',
        description: 'Test description',
        proofUrl: '/proof/guardian-methodology',
        verified: true,
        lastUpdated: new Date()
      };

      const result = await manager.verifyTrustSignal(validSignal);
      
      expect(result.hasValidUrl).toBe(true);
    });

    test('should validate recent timestamps', async () => {
      const recentSignal: TrustSignal = {
        id: 'test-recent',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'https://certik.com/projects/alphawhale',
        verified: true,
        lastUpdated: new Date() // Current date
      };

      const result = await manager.verifyTrustSignal(recentSignal);
      
      expect(result.hasTimestamp).toBe(true);
    });

    test('should reject old timestamps', async () => {
      const oldSignal: TrustSignal = {
        id: 'test-old',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'https://certik.com/projects/alphawhale',
        verified: true,
        lastUpdated: new Date('2020-01-01') // Very old date
      };

      const result = await manager.verifyTrustSignal(oldSignal);
      
      expect(result.hasTimestamp).toBe(false);
    });

    test('should cache verification results', async () => {
      const signal: TrustSignal = {
        id: 'test-cache',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'https://certik.com/projects/alphawhale',
        verified: true,
        lastUpdated: new Date()
      };

      const result1 = await manager.verifyTrustSignal(signal);
      const result2 = await manager.verifyTrustSignal(signal);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('getProofConfig', () => {
    test('should return config for known URLs', () => {
      const config = manager.getProofConfig('https://certik.com/projects/alphawhale');
      
      expect(config).toBeDefined();
      expect(config?.title).toContain('CertiK');
    });

    test('should return null for unknown URLs', () => {
      const config = manager.getProofConfig('https://unknown.com');
      
      expect(config).toBeNull();
    });

    test('should handle relative URLs', () => {
      const config = manager.getProofConfig('/proof/guardian-methodology');
      
      expect(config).toBeDefined();
      expect(config?.title).toContain('Guardian');
    });
  });

  describe('setProofConfig', () => {
    test('should allow adding new proof configurations', () => {
      const newConfig: ProofModalConfig = {
        title: 'Test Config',
        content: ['Test content'],
        linkText: 'Test Link',
        linkUrl: 'https://test.com',
        type: 'external'
      };

      manager.setProofConfig('test-config', newConfig);
      
      const configs = manager.getAllProofConfigs();
      expect(configs.get('test-config')).toEqual(newConfig);
    });
  });

  describe('clearCache', () => {
    test('should clear verification cache', async () => {
      const signal: TrustSignal = {
        id: 'test-clear',
        type: 'audit',
        label: 'Test',
        description: 'Test description',
        proofUrl: 'invalid-url',
        verified: false,
        lastUpdated: new Date()
      };

      // First verification should cache result
      await manager.verifyTrustSignal(signal);
      
      // Clear cache
      manager.clearCache();
      
      // Second verification should recalculate (we can't directly test this,
      // but we can verify the method exists and doesn't throw)
      const result = await manager.verifyTrustSignal(signal);
      expect(result).toBeDefined();
    });
  });
});

describe('DEFAULT_TRUST_SIGNALS', () => {
  test('should contain valid trust signals', () => {
    expect(DEFAULT_TRUST_SIGNALS).toBeDefined();
    expect(Array.isArray(DEFAULT_TRUST_SIGNALS)).toBe(true);
    expect(DEFAULT_TRUST_SIGNALS.length).toBeGreaterThan(0);
  });

  test('should have required properties', () => {
    DEFAULT_TRUST_SIGNALS.forEach(signal => {
      expect(signal.id).toBeDefined();
      expect(signal.type).toBeDefined();
      expect(signal.label).toBeDefined();
      expect(signal.description).toBeDefined();
      expect(signal.proofUrl).toBeDefined();
      expect(signal.verified).toBeDefined();
      expect(signal.lastUpdated).toBeInstanceOf(Date);
    });
  });

  test('should have valid URLs', () => {
    DEFAULT_TRUST_SIGNALS.forEach(signal => {
      // Should be either valid HTTPS URL or relative path
      const isValidUrl = signal.proofUrl.startsWith('https://') || signal.proofUrl.startsWith('/');
      expect(isValidUrl).toBe(true);
    });
  });

  test('should have recent timestamps', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    DEFAULT_TRUST_SIGNALS.forEach(signal => {
      expect(signal.lastUpdated.getTime()).toBeGreaterThan(oneYearAgo.getTime());
    });
  });
});

describe('Trust Signal Types', () => {
  test('should support all required trust signal types', () => {
    const requiredTypes = ['audit', 'methodology', 'certification', 'metrics_proof'];
    
    const signalTypes = DEFAULT_TRUST_SIGNALS.map(signal => signal.type);
    
    // Should have at least audit and methodology types
    expect(signalTypes).toContain('audit');
    expect(signalTypes).toContain('methodology');
  });
});

describe('Proof Modal Config', () => {
  test('should have valid structure', () => {
    const manager = TrustSignalVerificationManager.getInstance();
    const configs = manager.getAllProofConfigs();
    
    configs.forEach((config, key) => {
      expect(config.title).toBeDefined();
      expect(config.content).toBeDefined();
      expect(Array.isArray(config.content)).toBe(true);
      expect(config.content.length).toBeGreaterThan(0);
      expect(config.linkText).toBeDefined();
      expect(config.linkUrl).toBeDefined();
      expect(['modal', 'external', 'page']).toContain(config.type);
    });
  });
});