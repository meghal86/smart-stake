/**
 * Unit tests for route context helper
 * 
 * Tests the getRouteContextKey function to ensure correct route matching
 * and context retrieval for various pathname patterns.
 */

import { describe, test, expect } from 'vitest';
import { getRouteContextKey, getRouteContext, HEADER_CONTEXT_MAP } from '@/lib/header';

describe('getRouteContextKey', () => {
  describe('exact route matching', () => {
    test('matches home route exactly', () => {
      const result = getRouteContextKey('/');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
      expect(result.context.subtitle).toBe('Institutional-Grade DeFi Risk Management');
    });

    test('matches guardian route exactly', () => {
      const result = getRouteContextKey('/guardian');
      
      expect(result.key).toBe('/guardian');
      expect(result.context.title).toBe('Guardian');
      expect(result.context.subtitle).toBe('Trust & Safety');
    });

    test('matches hunter route exactly', () => {
      const result = getRouteContextKey('/hunter');
      
      expect(result.key).toBe('/hunter');
      expect(result.context.title).toBe('Hunter');
      expect(result.context.subtitle).toBe('High-confidence opportunities');
    });

    test('matches harvestpro route exactly', () => {
      const result = getRouteContextKey('/harvestpro');
      
      expect(result.key).toBe('/harvestpro');
      expect(result.context.title).toBe('Harvest');
      expect(result.context.subtitle).toBe('Tax-optimized outcomes');
    });

    test('matches portfolio route exactly', () => {
      const result = getRouteContextKey('/portfolio');
      
      expect(result.key).toBe('/portfolio');
      expect(result.context.title).toBe('Portfolio');
      expect(result.context.subtitle).toBe('Overview');
      expect(result.context.enableWalletSelector).toBe(true);
    });
  });

  describe('nested route matching (longest-prefix)', () => {
    test('/harvestpro/opportunities inherits harvestpro context', () => {
      const result = getRouteContextKey('/harvestpro/opportunities');
      
      expect(result.key).toBe('/harvestpro');
      expect(result.context.title).toBe('Harvest');
      expect(result.context.subtitle).toBe('Tax-optimized outcomes');
    });

    test('/guardian/scan/123 inherits guardian context', () => {
      const result = getRouteContextKey('/guardian/scan/123');
      
      expect(result.key).toBe('/guardian');
      expect(result.context.title).toBe('Guardian');
      expect(result.context.subtitle).toBe('Trust & Safety');
    });

    test('/hunter/quests/active inherits hunter context', () => {
      const result = getRouteContextKey('/hunter/quests/active');
      
      expect(result.key).toBe('/hunter');
      expect(result.context.title).toBe('Hunter');
    });

    test('/portfolio/analytics inherits portfolio context', () => {
      const result = getRouteContextKey('/portfolio/analytics');
      
      expect(result.key).toBe('/portfolio');
      expect(result.context.title).toBe('Portfolio');
      expect(result.context.enableWalletSelector).toBe(true);
    });

    test('/harvestpro/settings/tax-rate inherits harvestpro context', () => {
      const result = getRouteContextKey('/harvestpro/settings/tax-rate');
      
      expect(result.key).toBe('/harvestpro');
      expect(result.context.title).toBe('Harvest');
    });
  });

  describe('fallback to home context', () => {
    test('/random falls back to home context', () => {
      const result = getRouteContextKey('/random');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
      expect(result.context.subtitle).toBe('Institutional-Grade DeFi Risk Management');
    });

    test('/unknown/nested/route falls back to home context', () => {
      const result = getRouteContextKey('/unknown/nested/route');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
    });

    test('/settings falls back to home context', () => {
      const result = getRouteContextKey('/settings');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
    });
  });

  describe('edge cases', () => {
    test('handles trailing slash correctly', () => {
      const result = getRouteContextKey('/guardian/');
      
      // Trailing slash should still match '/guardian' (reasonable behavior)
      expect(result.key).toBe('/guardian');
      expect(result.context.title).toBe('Guardian');
    });

    test('handles empty string', () => {
      const result = getRouteContextKey('');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
    });

    test('handles route without leading slash', () => {
      const result = getRouteContextKey('guardian');
      
      // Should fall back to home (invalid pathname format)
      expect(result.key).toBe('/');
    });
  });

  describe('longest-prefix matching priority', () => {
    test('prefers longer prefix match', () => {
      // If we had both '/harvest' and '/harvestpro' in the map,
      // '/harvestpro/opportunities' should match '/harvestpro'
      const result = getRouteContextKey('/harvestpro/opportunities');
      
      expect(result.key).toBe('/harvestpro');
      expect(result.context.title).toBe('Harvest');
    });

    test('does not match partial route names', () => {
      // '/guard' should not match '/guardian'
      const result = getRouteContextKey('/guard');
      
      expect(result.key).toBe('/');
    });

    test('does not match if no trailing slash separator', () => {
      // '/guardianx' should not match '/guardian'
      const result = getRouteContextKey('/guardianx');
      
      expect(result.key).toBe('/');
    });
  });

  describe('telemetry key vs UI context', () => {
    test('returns both key and context for telemetry and UI', () => {
      const result = getRouteContextKey('/harvestpro/opportunities');
      
      // Key for telemetry (matched route)
      expect(result.key).toBe('/harvestpro');
      
      // Context for UI (full context object)
      expect(result.context).toEqual(HEADER_CONTEXT_MAP['/harvestpro']);
    });

    test('key is always the matched route, not the full pathname', () => {
      const result = getRouteContextKey('/guardian/scan/0x123');
      
      // Key should be the matched route, not the full pathname
      expect(result.key).toBe('/guardian');
      expect(result.key).not.toBe('/guardian/scan/0x123');
    });
  });
});


describe('getRouteContext (convenience function)', () => {
  describe('returns context directly for UI', () => {
    test('/harvestpro/opportunities returns Harvest context', () => {
      const context = getRouteContext('/harvestpro/opportunities');
      
      expect(context.title).toBe('Harvest');
      expect(context.subtitle).toBe('Tax-optimized outcomes');
    });

    test('/guardian/scan/123 returns Guardian context', () => {
      const context = getRouteContext('/guardian/scan/123');
      
      expect(context.title).toBe('Guardian');
      expect(context.subtitle).toBe('Trust & Safety');
    });

    test('/unknown returns home context', () => {
      const context = getRouteContext('/unknown');
      
      expect(context.title).toBe('AlphaWhale');
      expect(context.subtitle).toBe('Institutional-Grade DeFi Risk Management');
    });

    test('/portfolio returns context with wallet selector enabled', () => {
      const context = getRouteContext('/portfolio');
      
      expect(context.title).toBe('Portfolio');
      expect(context.enableWalletSelector).toBe(true);
    });
  });

  describe('consistency with getRouteContextKey', () => {
    test('returns same context as getRouteContextKey().context', () => {
      const pathname = '/harvestpro/opportunities';
      
      const contextFromKey = getRouteContextKey(pathname).context;
      const contextDirect = getRouteContext(pathname);
      
      expect(contextDirect).toEqual(contextFromKey);
    });

    test('works for all configured routes', () => {
      const routes = Object.keys(HEADER_CONTEXT_MAP);
      
      routes.forEach(route => {
        const contextFromKey = getRouteContextKey(route).context;
        const contextDirect = getRouteContext(route);
        
        expect(contextDirect).toEqual(contextFromKey);
      });
    });
  });
});
