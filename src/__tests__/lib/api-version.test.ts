/**
 * Tests for API versioning and client guards
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  CURRENT_API_VERSION,
  MIN_CLIENT_VERSION,
  parseSemver,
  compareSemver,
  isVersionSupported,
  checkClientVersion,
  getApiVersionOverride,
  getEffectiveApiVersion,
  shouldEnforceVersion,
  VersionError,
  VERSION_POLICY,
  VERSION_DEPRECATION_TIMELINE,
} from '@/lib/api-version';

describe('API Version Module', () => {
  describe('parseSemver', () => {
    it('should parse valid semver strings', () => {
      expect(parseSemver('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(parseSemver('2.5.3')).toEqual({ major: 2, minor: 5, patch: 3 });
      expect(parseSemver('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should return null for invalid semver strings', () => {
      expect(parseSemver('1.0')).toBeNull();
      expect(parseSemver('1')).toBeNull();
      expect(parseSemver('v1.0.0')).toBeNull();
      expect(parseSemver('1.0.0-beta')).toBeNull();
      expect(parseSemver('invalid')).toBeNull();
      expect(parseSemver('')).toBeNull();
    });
  });

  describe('compareSemver', () => {
    it('should compare major versions correctly', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    });

    it('should compare minor versions correctly', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemver('1.1.0', '1.2.0')).toBe(-1);
      expect(compareSemver('1.1.0', '1.1.0')).toBe(0);
    });

    it('should compare patch versions correctly', () => {
      expect(compareSemver('1.0.2', '1.0.1')).toBe(1);
      expect(compareSemver('1.0.1', '1.0.2')).toBe(-1);
      expect(compareSemver('1.0.1', '1.0.1')).toBe(0);
    });

    it('should throw error for invalid semver', () => {
      expect(() => compareSemver('invalid', '1.0.0')).toThrow('Invalid semver format');
      expect(() => compareSemver('1.0.0', 'invalid')).toThrow('Invalid semver format');
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      expect(isVersionSupported(MIN_CLIENT_VERSION)).toBe(true);
      expect(isVersionSupported('2.0.0')).toBe(true);
      expect(isVersionSupported('1.5.0')).toBe(true);
    });

    it('should return false for unsupported versions', () => {
      expect(isVersionSupported('0.9.0')).toBe(false);
      expect(isVersionSupported('0.1.0')).toBe(false);
    });

    it('should return false for invalid versions', () => {
      expect(isVersionSupported('invalid')).toBe(false);
      expect(isVersionSupported('v1.0.0')).toBe(false);
    });
  });

  describe('checkClientVersion', () => {
    it('should return null when version not provided and not required', () => {
      const req = new NextRequest('https://api.example.com/test');
      expect(checkClientVersion(req, { required: false })).toBeNull();
    });

    it('should throw VersionError when version not provided and required', () => {
      const req = new NextRequest('https://api.example.com/test');
      
      expect(() => checkClientVersion(req, { required: true })).toThrow(VersionError);
      
      try {
        checkClientVersion(req, { required: true });
      } catch (error) {
        expect(error).toBeInstanceOf(VersionError);
        expect((error as VersionError).clientVersion).toBe('unknown');
        expect((error as VersionError).minVersion).toBe(MIN_CLIENT_VERSION);
        expect((error as VersionError).currentVersion).toBe(CURRENT_API_VERSION);
      }
    });

    it('should extract version from X-Client-Version header', () => {
      const req = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });
      
      expect(checkClientVersion(req)).toBe('1.0.0');
    });

    it('should extract version from query parameter', () => {
      const req = new NextRequest('https://api.example.com/test?client_version=1.2.0');
      
      expect(checkClientVersion(req, { allowQueryOverride: true })).toBe('1.2.0');
    });

    it('should prefer query parameter over header', () => {
      const req = new NextRequest('https://api.example.com/test?client_version=1.2.0', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });
      
      expect(checkClientVersion(req, { allowQueryOverride: true })).toBe('1.2.0');
    });

    it('should ignore query parameter when allowQueryOverride is false', () => {
      const req = new NextRequest('https://api.example.com/test?client_version=1.2.0', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });
      
      expect(checkClientVersion(req, { allowQueryOverride: false })).toBe('1.0.0');
    });

    it('should throw VersionError for invalid version format', () => {
      const req = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-Client-Version': 'invalid',
        },
      });
      
      expect(() => checkClientVersion(req)).toThrow(VersionError);
      expect(() => checkClientVersion(req)).toThrow('Invalid client version format');
    });

    it('should throw VersionError for unsupported version', () => {
      const req = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-Client-Version': '0.5.0',
        },
      });
      
      expect(() => checkClientVersion(req)).toThrow(VersionError);
      expect(() => checkClientVersion(req)).toThrow('no longer supported');
    });

    it('should accept supported versions', () => {
      const req = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });
      
      expect(checkClientVersion(req)).toBe('1.0.0');
    });

    it('should accept newer versions', () => {
      const req = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-Client-Version': '2.0.0',
        },
      });
      
      expect(checkClientVersion(req)).toBe('2.0.0');
    });
  });

  describe('getApiVersionOverride', () => {
    it('should return null when no override provided', () => {
      const req = new NextRequest('https://api.example.com/test');
      expect(getApiVersionOverride(req)).toBeNull();
    });

    it('should return version from query parameter', () => {
      const req = new NextRequest('https://api.example.com/test?api_version=1.1.0');
      expect(getApiVersionOverride(req)).toBe('1.1.0');
    });

    it('should return null for invalid version format', () => {
      const req = new NextRequest('https://api.example.com/test?api_version=invalid');
      expect(getApiVersionOverride(req)).toBeNull();
    });
  });

  describe('getEffectiveApiVersion', () => {
    it('should return current version when no override', () => {
      const req = new NextRequest('https://api.example.com/test');
      expect(getEffectiveApiVersion(req)).toBe(CURRENT_API_VERSION);
    });

    it('should return override version when provided', () => {
      const req = new NextRequest('https://api.example.com/test?api_version=1.1.0');
      expect(getEffectiveApiVersion(req)).toBe('1.1.0');
    });
  });

  describe('shouldEnforceVersion', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return true in production', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldEnforceVersion()).toBe(true);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldEnforceVersion()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';
      expect(shouldEnforceVersion()).toBe(false);
    });
  });

  describe('VERSION_POLICY', () => {
    it('should have complete policy documentation', () => {
      expect(VERSION_POLICY.description).toBeDefined();
      expect(VERSION_POLICY.rules).toHaveLength(3);
      expect(VERSION_POLICY.deprecationProcess).toHaveLength(3);
      expect(VERSION_POLICY.headers['X-API-Version']).toBeDefined();
      expect(VERSION_POLICY.headers['X-Client-Version']).toBeDefined();
    });
  });

  describe('VERSION_DEPRECATION_TIMELINE', () => {
    it('should have timeline for current version', () => {
      expect(VERSION_DEPRECATION_TIMELINE[CURRENT_API_VERSION]).toBeDefined();
      expect(VERSION_DEPRECATION_TIMELINE[CURRENT_API_VERSION].introduced).toBeDefined();
    });

    it('should have null deprecated and sunset for current version', () => {
      expect(VERSION_DEPRECATION_TIMELINE[CURRENT_API_VERSION].deprecated).toBeNull();
      expect(VERSION_DEPRECATION_TIMELINE[CURRENT_API_VERSION].sunset).toBeNull();
    });
  });

  describe('VersionError', () => {
    it('should create error with correct properties', () => {
      const error = new VersionError(
        'Test error',
        '0.5.0',
        '1.0.0',
        '1.2.0'
      );
      
      expect(error.message).toBe('Test error');
      expect(error.clientVersion).toBe('0.5.0');
      expect(error.minVersion).toBe('1.0.0');
      expect(error.currentVersion).toBe('1.2.0');
      expect(error.name).toBe('VersionError');
    });
  });
});
