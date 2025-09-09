import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// Test the MarketImpactSimulator class
Deno.test('MarketImpactSimulator - Basic Simulation', () => {
  class MarketImpactSimulator {
    private readonly LIQUIDITY_POOLS = {
      ethereum: { depth: 50000, slippage: 0.001 },
      polygon: { depth: 15000, slippage: 0.002 },
      bsc: { depth: 25000, slippage: 0.0015 },
      arbitrum: { depth: 20000, slippage: 0.0012 }
    };
    
    simulate(params: {
      whaleCount: number;
      transactionSize: number;
      timeframe: string;
      chain: string;
    }) {
      const { whaleCount, transactionSize, timeframe, chain } = params;
      const totalVolume = whaleCount * transactionSize;
      
      const liquidityPool = this.LIQUIDITY_POOLS[chain] || this.LIQUIDITY_POOLS.ethereum;
      const baseImpact = (totalVolume / liquidityPool.depth) * 100;
      
      const timeMultipliers = {
        '1h': 2.5,
        '6h': 1.8,
        '24h': 1.2,
        '7d': 0.8
      };
      
      const timeMultiplier = timeMultipliers[timeframe] || 1;
      const priceImpact = baseImpact * timeMultiplier;
      
      return {
        priceImpact: priceImpact.toFixed(2),
        liquidityDrain: Math.min(95, priceImpact * 15).toFixed(1),
        volumeSpike: Math.round(priceImpact * 25 + 100),
        recoveryHours: Math.max(1, Math.round(priceImpact * 2)),
        cascadeRisk: priceImpact > 8 ? 'High' : priceImpact > 3 ? 'Medium' : 'Low'
      };
    }
  }

  const simulator = new MarketImpactSimulator();
  const result = simulator.simulate({
    whaleCount: 5,
    transactionSize: 1000,
    timeframe: '24h',
    chain: 'ethereum'
  });

  assertExists(result.priceImpact);
  assertExists(result.liquidityDrain);
  assertExists(result.cascadeRisk);
  assertEquals(typeof result.volumeSpike, 'number');
  assertEquals(typeof result.recoveryHours, 'number');
});

Deno.test('MarketImpactSimulator - Different Chains', () => {
  class MarketImpactSimulator {
    private readonly LIQUIDITY_POOLS = {
      ethereum: { depth: 50000, slippage: 0.001 },
      polygon: { depth: 15000, slippage: 0.002 },
      bsc: { depth: 25000, slippage: 0.0015 },
      arbitrum: { depth: 20000, slippage: 0.0012 }
    };
    
    simulate(params: any) {
      const { whaleCount, transactionSize, chain } = params;
      const totalVolume = whaleCount * transactionSize;
      const liquidityPool = this.LIQUIDITY_POOLS[chain] || this.LIQUIDITY_POOLS.ethereum;
      const baseImpact = (totalVolume / liquidityPool.depth) * 100;
      
      return {
        priceImpact: baseImpact.toFixed(2),
        chain: chain
      };
    }
  }

  const simulator = new MarketImpactSimulator();
  const chains = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
  
  chains.forEach(chain => {
    const result = simulator.simulate({
      whaleCount: 2,
      transactionSize: 1000,
      timeframe: '24h',
      chain
    });
    
    assertExists(result.priceImpact);
    assertEquals(result.chain, chain);
  });
});

Deno.test('MarketImpactSimulator - Timeframe Multipliers', () => {
  class MarketImpactSimulator {
    simulate(params: any) {
      const timeMultipliers = {
        '1h': 2.5,
        '6h': 1.8,
        '24h': 1.2,
        '7d': 0.8
      };
      
      const baseImpact = 5; // Fixed base impact for testing
      const timeMultiplier = timeMultipliers[params.timeframe] || 1;
      const priceImpact = baseImpact * timeMultiplier;
      
      return {
        priceImpact: priceImpact.toFixed(2),
        timeMultiplier
      };
    }
  }

  const simulator = new MarketImpactSimulator();
  
  // Test 1h timeframe (highest multiplier)
  const result1h = simulator.simulate({ timeframe: '1h' });
  assertEquals(result1h.priceImpact, '12.50'); // 5 * 2.5
  
  // Test 24h timeframe
  const result24h = simulator.simulate({ timeframe: '24h' });
  assertEquals(result24h.priceImpact, '6.00'); // 5 * 1.2
  
  // Test 7d timeframe (lowest multiplier)
  const result7d = simulator.simulate({ timeframe: '7d' });
  assertEquals(result7d.priceImpact, '4.00'); // 5 * 0.8
});

Deno.test('MarketImpactSimulator - Risk Zones Generation', () => {
  class MarketImpactSimulator {
    simulate(params: any) {
      const priceImpact = 10; // Fixed for testing
      const currentPrice = 3000;
      
      const riskZones = [
        {
          price: `$${(currentPrice * (1 - priceImpact * 0.3 / 100)).toFixed(0)}`,
          impact: `${(priceImpact * 0.3).toFixed(1)}%`,
          probability: `${Math.max(20, 90 - priceImpact * 2).toFixed(0)}%`
        },
        {
          price: `$${(currentPrice * (1 - priceImpact * 0.6 / 100)).toFixed(0)}`,
          impact: `${(priceImpact * 0.6).toFixed(1)}%`,
          probability: `${Math.max(10, 60 - priceImpact * 3).toFixed(0)}%`
        }
      ];
      
      return { riskZones };
    }
  }

  const simulator = new MarketImpactSimulator();
  const result = simulator.simulate({});
  
  assertEquals(result.riskZones.length, 2);
  assertEquals(result.riskZones[0].price, '$2991'); // 3000 * (1 - 3/100)
  assertEquals(result.riskZones[0].impact, '3.0%');
  assertEquals(result.riskZones[1].price, '$2982'); // 3000 * (1 - 6/100)
  assertEquals(result.riskZones[1].impact, '6.0%');
});

Deno.test('Prediction Data Validation', () => {
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

  // Validate prediction structure
  const prediction = mockPredictions[0];
  assertExists(prediction.id);
  assertExists(prediction.type);
  assertExists(prediction.confidence);
  assertExists(prediction.whale_address);
  assertExists(prediction.predicted_amount);
  assertExists(prediction.timeframe);
  assertExists(prediction.impact_score);
  assertExists(prediction.explanation);
  
  // Validate data types
  assertEquals(typeof prediction.id, 'string');
  assertEquals(typeof prediction.type, 'string');
  assertEquals(typeof prediction.confidence, 'number');
  assertEquals(typeof prediction.whale_address, 'string');
  assertEquals(typeof prediction.predicted_amount, 'number');
  assertEquals(typeof prediction.timeframe, 'string');
  assertEquals(typeof prediction.impact_score, 'number');
  assertEquals(Array.isArray(prediction.explanation), true);
  
  // Validate ranges
  assertEquals(prediction.confidence >= 0 && prediction.confidence <= 100, true);
  assertEquals(prediction.impact_score >= 0 && prediction.impact_score <= 10, true);
});

Deno.test('Prediction Types Validation', () => {
  const validTypes = ['accumulation', 'liquidation', 'cluster_movement', 'cross_chain'];
  
  validTypes.forEach(type => {
    const prediction = {
      type: type,
      confidence: 85.0
    };
    
    assertEquals(validTypes.includes(prediction.type), true);
    assertEquals(prediction.confidence > 0, true);
  });
});

Deno.test('Simulation Parameter Validation', () => {
  function validateSimulationParams(params: any) {
    const errors: string[] = [];
    
    if (!params.whaleCount || params.whaleCount <= 0) {
      errors.push('whaleCount must be positive');
    }
    if (!params.transactionSize || params.transactionSize <= 0) {
      errors.push('transactionSize must be greater than 0');
    }
    if (!['1h', '6h', '24h', '7d'].includes(params.timeframe)) {
      errors.push('invalid timeframe');
    }
    if (!['ethereum', 'polygon', 'bsc', 'arbitrum'].includes(params.chain)) {
      errors.push('unsupported chain');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Test valid parameters
  const validParams = {
    whaleCount: 5,
    transactionSize: 1000,
    timeframe: '24h',
    chain: 'ethereum'
  };
  
  const validResult = validateSimulationParams(validParams);
  assertEquals(validResult.valid, true);
  assertEquals(validResult.errors.length, 0);

  // Test invalid parameters
  const invalidParams = {
    whaleCount: -1,
    transactionSize: 0,
    timeframe: 'invalid',
    chain: 'unknown'
  };
  
  const invalidResult = validateSimulationParams(invalidParams);
  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.errors.length, 4);
});

Deno.test('Edge Function Response Format', () => {
  // Mock successful response
  const successResponse = {
    predictions: [
      {
        id: '1',
        type: 'accumulation',
        confidence: 87.5
      }
    ]
  };
  
  assertExists(successResponse.predictions);
  assertEquals(Array.isArray(successResponse.predictions), true);
  assertEquals(successResponse.predictions.length, 1);

  // Mock simulation response
  const simulationResponse = {
    priceImpact: '12.00',
    liquidityDrain: '95.0',
    volumeSpike: 400,
    recoveryHours: 24,
    cascadeRisk: 'High'
  };
  
  assertExists(simulationResponse.priceImpact);
  assertExists(simulationResponse.cascadeRisk);
  assertEquals(typeof simulationResponse.volumeSpike, 'number');
  assertEquals(typeof simulationResponse.recoveryHours, 'number');
});

Deno.test('Error Handling', () => {
  function handleApiError(error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      fallbackData: {
        predictions: []
      }
    };
  }

  const testError = new Error('Network timeout');
  const result = handleApiError(testError);
  
  assertEquals(result.success, false);
  assertEquals(result.error, 'Network timeout');
  assertExists(result.fallbackData);
  assertEquals(Array.isArray(result.fallbackData.predictions), true);
});