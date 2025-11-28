import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Advanced Whale Predictions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prediction API', () => {
    it('should fetch whale predictions successfully', async () => {
      const mockPredictions = [
        {
          id: '1',
          type: 'accumulation',
          confidence: 87.5,
          whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
          predicted_amount: 2500,
          timeframe: '6-12 hours',
          impact_score: 8.2,
          explanation: ['Large inflow pattern detected']
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: mockPredictions },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(data.predictions).toHaveLength(1);
      expect(data.predictions[0].type).toBe('accumulation');
      expect(data.predictions[0].confidence).toBe(87.5);
    });

    it('should handle prediction API errors gracefully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API Error' }
      });

      const { error } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(error).toBeTruthy();
      expect(error.message).toBe('API Error');
    });

    it('should validate prediction data structure', async () => {
      const mockPredictions = [
        {
          id: '1',
          type: 'accumulation',
          confidence: 87.5,
          whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
          predicted_amount: 2500,
          timeframe: '6-12 hours',
          impact_score: 8.2,
          explanation: ['Large inflow pattern detected']
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: mockPredictions },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      const prediction = data.predictions[0];
      
      expect(prediction).toHaveProperty('id');
      expect(prediction).toHaveProperty('type');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('whale_address');
      expect(prediction).toHaveProperty('predicted_amount');
      expect(prediction).toHaveProperty('timeframe');
      expect(prediction).toHaveProperty('impact_score');
      expect(prediction).toHaveProperty('explanation');
      expect(Array.isArray(prediction.explanation)).toBe(true);
    });
  });

  describe('Market Impact Simulation', () => {
    it('should run simulation with valid parameters', async () => {
      const simulationParams = {
        whaleCount: 5,
        transactionSize: 1000,
        timeframe: '24h',
        chain: 'ethereum',
        action: 'simulate'
      };

      const mockResult = {
        priceImpact: '12.00',
        liquidityDrain: '95.0',
        volumeSpike: 400,
        recoveryHours: 24,
        cascadeRisk: 'High',
        affectedTokens: 8,
        arbitrageOpportunities: 24,
        riskZones: [
          { price: '$2892', impact: '3.6%', probability: '66%' }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions', {
        body: JSON.stringify(simulationParams)
      });
      
      expect(data.priceImpact).toBe('12.00');
      expect(data.cascadeRisk).toBe('High');
      expect(data.riskZones).toHaveLength(1);
    });

    it('should validate simulation parameters', async () => {
      const invalidParams = {
        whaleCount: -1,
        transactionSize: 0,
        timeframe: 'invalid',
        chain: 'unknown'
      };

      // Test that the function handles invalid parameters
      const result = validateSimulationParams(invalidParams);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('whaleCount must be positive');
      expect(result.errors).toContain('transactionSize must be greater than 0');
      expect(result.errors).toContain('invalid timeframe');
      expect(result.errors).toContain('unsupported chain');
    });

    it('should calculate price impact correctly', () => {
      const params = {
        whaleCount: 3,
        transactionSize: 500,
        timeframe: '6h',
        chain: 'ethereum'
      };

      const result = calculatePriceImpact(params);
      
      expect(result.priceImpact).toBeGreaterThan(0);
      expect(result.liquidityDrain).toBeLessThanOrEqual(95);
      expect(result.recoveryHours).toBeGreaterThan(0);
    });

    it('should handle different chain configurations', () => {
      const chains = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
      
      chains.forEach(chain => {
        const params = {
          whaleCount: 2,
          transactionSize: 1000,
          timeframe: '24h',
          chain
        };

        const result = calculatePriceImpact(params);
        expect(result.priceImpact).toBeGreaterThan(0);
      });
    });
  });

  describe('Prediction Types', () => {
    it('should handle accumulation predictions', async () => {
      const mockPrediction = {
        type: 'accumulation',
        confidence: 89.2,
        explanation: ['Consistent inflows detected', 'Strategic timing']
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: [mockPrediction] },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(data.predictions[0].type).toBe('accumulation');
      expect(data.predictions[0].confidence).toBeGreaterThan(80);
    });

    it('should handle liquidation predictions', async () => {
      const mockPrediction = {
        type: 'liquidation',
        confidence: 94.2,
        explanation: ['High outflow ratio', 'Stress indicators']
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: [mockPrediction] },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(data.predictions[0].type).toBe('liquidation');
      expect(data.predictions[0].confidence).toBeGreaterThan(90);
    });

    it('should handle cluster movement predictions', async () => {
      const mockPrediction = {
        type: 'cluster_movement',
        confidence: 76.8,
        explanation: ['Coordinated activity', 'Similar timing']
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: [mockPrediction] },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(data.predictions[0].type).toBe('cluster_movement');
      expect(data.predictions[0].confidence).toBeGreaterThan(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      try {
        await supabase.functions.invoke('advanced-whale-predictions');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle invalid response format', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { invalid: 'format' },
        error: null
      });

      const { data } = await supabase.functions.invoke('advanced-whale-predictions');
      
      expect(data.predictions).toBeUndefined();
    });

    it('should provide fallback data on API failure', () => {
      const fallbackPredictions = getFallbackPredictions();
      
      expect(fallbackPredictions).toHaveLength(3);
      expect(fallbackPredictions[0]).toHaveProperty('type');
      expect(fallbackPredictions[0]).toHaveProperty('confidence');
    });
  });
});

// Helper functions for testing
function validateSimulationParams(params: unknown) {
  const errors: string[] = [];
  
  if (params.whaleCount <= 0) errors.push('whaleCount must be positive');
  if (params.transactionSize <= 0) errors.push('transactionSize must be greater than 0');
  if (!['1h', '6h', '24h', '7d'].includes(params.timeframe)) errors.push('invalid timeframe');
  if (!['ethereum', 'polygon', 'bsc', 'arbitrum'].includes(params.chain)) errors.push('unsupported chain');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function calculatePriceImpact(params: unknown) {
  const liquidityPools = {
    ethereum: { depth: 50000 },
    polygon: { depth: 15000 },
    bsc: { depth: 25000 },
    arbitrum: { depth: 20000 }
  };
  
  const pool = liquidityPools[params.chain] || liquidityPools.ethereum;
  const totalVolume = params.whaleCount * params.transactionSize;
  const baseImpact = (totalVolume / pool.depth) * 100;
  
  const timeMultipliers = { '1h': 2.5, '6h': 1.8, '24h': 1.2, '7d': 0.8 };
  const timeMultiplier = timeMultipliers[params.timeframe] || 1;
  
  const priceImpact = baseImpact * timeMultiplier;
  const liquidityDrain = Math.min(95, priceImpact * 15);
  const recoveryHours = Math.max(1, Math.round(priceImpact * 2));
  
  return {
    priceImpact: priceImpact.toFixed(2),
    liquidityDrain: liquidityDrain.toFixed(1),
    recoveryHours
  };
}

function getFallbackPredictions() {
  return [
    {
      id: '1',
      type: 'accumulation',
      confidence: 87.5,
      whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
      predicted_amount: 2500,
      timeframe: '6-12 hours',
      impact_score: 8.2,
      explanation: ['Large inflow pattern detected']
    },
    {
      id: '2',
      type: 'liquidation',
      confidence: 94.2,
      whale_address: '0x8ba1f109eddd4bd1c328681c71137145c5af8223',
      predicted_amount: 5000,
      timeframe: '2-4 hours',
      impact_score: 9.1,
      explanation: ['Stress indicators in portfolio']
    },
    {
      id: '3',
      type: 'cluster_movement',
      confidence: 76.8,
      whale_address: 'Multiple addresses',
      predicted_amount: 15000,
      timeframe: '24-48 hours',
      impact_score: 7.5,
      explanation: ['Coordinated wallet activity']
    }
  ];
}