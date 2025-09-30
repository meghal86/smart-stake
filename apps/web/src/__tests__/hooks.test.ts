import { renderHook, waitFor } from '@testing-library/react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { usePredictions } from '@/hooks/usePredictions';
import { useExplainability } from '@/hooks/useExplainability';
import { useScenarioBuilder } from '@/hooks/useScenarioBuilder';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

// Mock useSubscription
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    userPlan: { plan: 'premium', subscribed: true }
  })
}));

describe('Redesign Hooks', () => {
  describe('useUserPlan', () => {
    test('returns user plan correctly', () => {
      const { result } = renderHook(() => useUserPlan());
      
      expect(result.current.plan).toBe('premium');
    });
  });

  describe('usePredictions', () => {
    test('fetches predictions with default options', async () => {
      const { result } = renderHook(() => usePredictions());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.predictions).toBeDefined();
      expect(Array.isArray(result.current.predictions)).toBe(true);
    });

    test('filters predictions by asset', async () => {
      const { result } = renderHook(() => usePredictions({ asset: 'ETH', limit: 5 }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.predictions).toBeDefined();
    });
  });

  describe('useExplainability', () => {
    test('returns null for no prediction ID', () => {
      const { result } = renderHook(() => useExplainability(null));
      
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    test('loads explainability data for valid prediction ID', async () => {
      const { result } = renderHook(() => useExplainability('test-prediction-1'));
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.features).toBeDefined();
      expect(result.current.data?.importance).toBeDefined();
      expect(result.current.data?.narrative).toBeDefined();
    });
  });

  describe('useScenarioBuilder', () => {
    test('initializes with empty results', () => {
      const { result } = renderHook(() => useScenarioBuilder());
      
      expect(result.current.loading).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    test('runs simulation and returns result', async () => {
      const { result } = renderHook(() => useScenarioBuilder());
      
      const params = {
        whaleCount: 5,
        transactionSize: 1000,
        timeframe: '6h',
        chain: 'ethereum',
        token: 'ETH'
      };
      
      const simulationPromise = result.current.run(params);
      
      expect(result.current.loading).toBe(true);
      
      const simulationResult = await simulationPromise;
      
      expect(result.current.loading).toBe(false);
      expect(simulationResult).toBeDefined();
      expect(simulationResult.id).toBeDefined();
      expect(simulationResult.params).toEqual(params);
      expect(simulationResult.priceImpact).toBeDefined();
      expect(simulationResult.confidence).toBeDefined();
      expect(result.current.results).toHaveLength(1);
    });
  });
});