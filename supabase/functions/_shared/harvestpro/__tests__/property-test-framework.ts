/**
 * Property-Based Testing Framework for HarvestPro (Deno)
 * 
 * Provides generators and utilities for property-based testing
 * using a simple property testing approach compatible with Deno
 * 
 * Since fast-check isn't available for Deno, we implement a minimal
 * but powerful property testing framework.
 */

// ============================================================================
// PROPERTY TESTING FRAMEWORK
// ============================================================================

export interface PropertyTestConfig {
  numRuns?: number;
  seed?: number;
  timeout?: number;
}

export class PropertyTestRunner {
  private seed: number;
  private numRuns: number;

  constructor(config: PropertyTestConfig = {}) {
    this.seed = config.seed ?? Date.now();
    this.numRuns = config.numRuns ?? 100;
  }

  /**
   * Run a property test
   */
  async assert<T>(
    generator: () => T,
    property: (input: T) => boolean | Promise<boolean>,
    description?: string
  ): Promise<void> {
    const failures: Array<{ input: T; run: number }> = [];
    
    for (let run = 0; run < this.numRuns; run++) {
      const input = generator();
      const result = await property(input);
      
      if (!result) {
        failures.push({ input, run });
      }
    }

    if (failures.length > 0) {
      const errorMsg = [
        `Property test failed: ${description || 'unnamed property'}`,
        `Failed ${failures.length}/${this.numRuns} runs`,
        `First failure (run ${failures[0].run}):`,
        JSON.stringify(failures[0].input, null, 2),
      ].join('\n');
      
      throw new Error(errorMsg);
    }
  }
}

// ============================================================================
// RANDOM GENERATORS
// ============================================================================

export class Random {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  /**
   * Simple linear congruential generator
   */
  private next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 0x100000000;
    return this.seed / 0x100000000;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate random boolean
   */
  boolean(): boolean {
    return this.next() < 0.5;
  }

  /**
   * Pick random element from array
   */
  element<T>(array: readonly T[] | T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  /**
   * Generate random string
   */
  string(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.int(0, chars.length - 1)];
    }
    return result;
  }

  /**
   * Generate array of random elements
   */
  array<T>(generator: () => T, minLength: number = 0, maxLength: number = 10): T[] {
    const length = this.int(minLength, maxLength);
    const result: T[] = [];
    for (let i = 0; i < length; i++) {
      result.push(generator());
    }
    return result;
  }
}

// ============================================================================
// HARVESTPRO-SPECIFIC GENERATORS
// ============================================================================

export class HarvestProGenerators {
  public random: Random;

  constructor(seed?: number) {
    this.random = new Random(seed);
  }

  /**
   * Generate random transaction
   */
  transaction() {
    const tokens = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'WETH', 'UNI', 'LINK'];
    const types = ['buy', 'sell', 'transfer_in', 'transfer_out'] as const;
    
    return {
      id: this.random.string(8),
      token: this.random.element(tokens),
      type: this.random.element(types),
      quantity: this.random.float(0.001, 1000),
      priceUsd: this.random.float(0.01, 100000),
      timestamp: new Date(
        Date.now() - this.random.int(0, 365 * 24 * 60 * 60 * 1000)
      ),
      walletAddress: `0x${this.random.string(40)}`,
      transactionHash: `0x${this.random.string(64)}`,
    };
  }

  /**
   * Generate random lot
   */
  lot() {
    const tokens = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI'];
    
    return {
      id: this.random.string(8),
      token: this.random.element(tokens),
      quantity: this.random.float(0.001, 100),
      costBasisUsd: this.random.float(0.01, 10000),
      acquisitionDate: new Date(
        Date.now() - this.random.int(0, 365 * 24 * 60 * 60 * 1000)
      ),
      isLongTerm: this.random.boolean(),
    };
  }

  /**
   * Generate random harvest opportunity
   */
  harvestOpportunity() {
    return {
      id: this.random.string(8),
      token: this.random.element(['ETH', 'BTC', 'USDC']),
      unrealizedLoss: this.random.float(100, 10000),
      taxSavings: this.random.float(50, 3000),
      gasCost: this.random.float(10, 200),
      netBenefit: this.random.float(-100, 2800),
      riskLevel: this.random.element(['low', 'medium', 'high'] as const),
      isEligible: this.random.boolean(),
      washSaleRisk: this.random.boolean(),
      liquidityRisk: this.random.boolean(),
    };
  }

  /**
   * Generate random eligibility criteria
   */
  eligibilityCriteria() {
    return {
      minLoss: this.random.float(0, 1000),
      minNetBenefit: this.random.float(0, 500),
      maxRiskLevel: this.random.element(['low', 'medium', 'high'] as const),
      excludeWashSale: this.random.boolean(),
      excludeIlliquid: this.random.boolean(),
      minHoldingPeriod: this.random.int(0, 365),
    };
  }

  /**
   * Generate random wallet/CEX data sources
   */
  dataSources() {
    return {
      wallets: this.random.array(
        () => `0x${this.random.string(40)}`,
        0,
        5
      ),
      cexAccounts: this.random.array(
        () => this.random.string(8),
        0,
        3
      ),
    };
  }
}

// ============================================================================
// PROPERTY TEST UTILITIES
// ============================================================================

/**
 * Create a property test runner with default config
 */
export function createPropertyTest(config?: PropertyTestConfig): PropertyTestRunner {
  return new PropertyTestRunner(config);
}

/**
 * Create generators with optional seed
 */
export function createGenerators(seed?: number): HarvestProGenerators {
  return new HarvestProGenerators(seed);
}

/**
 * Helper to run a property test
 */
export async function property<T>(
  generator: () => T,
  predicate: (input: T) => boolean | Promise<boolean>,
  description?: string,
  config?: PropertyTestConfig
): Promise<void> {
  const runner = createPropertyTest(config);
  await runner.assert(generator, predicate, description);
}
