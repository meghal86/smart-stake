interface WhaleEvent {
  id: string;
  timestamp: Date;
  asset: string;
  type: 'CEX_INFLOW' | 'CEX_OUTFLOW' | 'DEX_SWAP' | 'STABLECOIN_MINT' | 'LARGE_TRANSFER' | 'STAKING';
  amountUsd: number;
  impactScore: number;
  whaleAddress: string;
  links: {
    explorer?: string;
    whale?: string;
  };
}

interface UserContext {
  addresses: string[];
  portfolioValue: number;
  holdings: Array<{ token: string; value: number }>;
}

class WhaleSimulator {
  private readonly BLOCK_SEED = 20345678; // Updated weekly
  private readonly SIM_VERSION = '2.0';
  
  // Event type probabilities by asset
  private readonly EVENT_PRIORS: Record<string, Record<string, number>> = {
    'ETH': {
      'CEX_INFLOW': 0.25,
      'CEX_OUTFLOW': 0.25,
      'DEX_SWAP': 0.20,
      'STABLECOIN_MINT': 0.05,
      'LARGE_TRANSFER': 0.15,
      'STAKING': 0.10
    },
    'BTC': {
      'CEX_INFLOW': 0.35,
      'CEX_OUTFLOW': 0.35,
      'DEX_SWAP': 0.05,
      'STABLECOIN_MINT': 0.00,
      'LARGE_TRANSFER': 0.20,
      'STAKING': 0.05
    },
    'SOL': {
      'CEX_INFLOW': 0.20,
      'CEX_OUTFLOW': 0.20,
      'DEX_SWAP': 0.30,
      'STABLECOIN_MINT': 0.05,
      'LARGE_TRANSFER': 0.15,
      'STAKING': 0.10
    }
  };

  // Whale addresses by tier (deterministic)
  private readonly WHALE_ADDRESSES = {
    'whale': [
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
      '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
      '0x8ba1f109551bD432803012645Hac136c22C57592',
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503'
    ],
    'large': [
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      '0x9876543210987654321098765432109876543210'
    ]
  };

  generateWhaleEvents(userContext: UserContext, bucket: string = '30m'): WhaleEvent[] {
    const events: WhaleEvent[] = [];
    const bucketSeed = this.hashString(`${bucket}_${this.BLOCK_SEED}`);
    
    // Generate events for each user holding
    userContext.holdings.forEach((holding, index) => {
      const tokenWeight = holding.value / userContext.portfolioValue;
      const lambda = this.calculateLambda(tokenWeight, holding.token);
      
      // Poisson distribution for event count
      const eventCount = this.poissonRandom(lambda, bucketSeed + index);
      
      for (let i = 0; i < eventCount; i++) {
        const event = this.generateSingleEvent(holding, userContext, bucketSeed + index + i);
        if (event) events.push(event);
      }
    });

    // Sort by timestamp (most recent first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private calculateLambda(tokenWeight: number, token: string): number {
    // Base lambda scaled by token weight and asset volatility
    const baseRate = 2.0; // Base events per bucket
    const volatilityMultiplier = this.getVolatilityMultiplier(token);
    const weightMultiplier = Math.min(5, tokenWeight * 10); // Cap at 5x
    
    return baseRate * volatilityMultiplier * weightMultiplier;
  }

  private getVolatilityMultiplier(token: string): number {
    const multipliers: Record<string, number> = {
      'BTC': 1.0,
      'ETH': 1.2,
      'SOL': 1.8,
      'CHAINLINK': 1.5,
      'POLYGON': 1.6
    };
    return multipliers[token.toUpperCase()] || 1.3;
  }

  private poissonRandom(lambda: number, seed: number): number {
    // Deterministic Poisson using inverse transform sampling
    const rng = this.seededRandom(seed);
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= rng();
    } while (p > L);
    
    return Math.max(0, k - 1);
  }

  private generateSingleEvent(
    holding: { token: string; value: number }, 
    userContext: UserContext, 
    seed: number
  ): WhaleEvent | null {
    const rng = this.seededRandom(seed);
    const token = holding.token.toUpperCase();
    
    // Select event type based on priors
    const eventType = this.selectEventType(token, rng());
    if (!eventType) return null;

    // Generate whale address (deterministic)
    const whaleAddress = this.selectWhaleAddress(seed);
    
    // Generate amount (scaled by holding value and randomness)
    const baseAmount = holding.value * (0.5 + rng() * 2); // 0.5x to 2.5x holding value
    const amountUsd = Math.floor(baseAmount);
    
    // Calculate impact score
    const impactScore = this.calculateImpactScore(amountUsd, userContext.portfolioValue, eventType);
    
    // Generate timestamp (within last 48 hours)
    const hoursAgo = Math.floor(rng() * 48);
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    return {
      id: `whale_${seed}_${Date.now()}`,
      timestamp,
      asset: token,
      type: eventType,
      amountUsd,
      impactScore,
      whaleAddress,
      links: {
        explorer: this.getExplorerLink(whaleAddress, token),
        whale: `https://etherscan.io/address/${whaleAddress}`
      }
    };
  }

  private selectEventType(token: string, random: number): WhaleEvent['type'] | null {
    const priors = this.EVENT_PRIORS[token] || this.EVENT_PRIORS['ETH'];
    let cumulative = 0;
    
    for (const [eventType, probability] of Object.entries(priors)) {
      cumulative += probability;
      if (random <= cumulative) {
        return eventType as WhaleEvent['type'];
      }
    }
    
    return 'LARGE_TRANSFER';
  }

  private selectWhaleAddress(seed: number): string {
    const rng = this.seededRandom(seed);
    const tier = rng() > 0.7 ? 'whale' : 'large';
    const addresses = this.WHALE_ADDRESSES[tier];
    const index = Math.floor(rng() * addresses.length);
    return addresses[index];
  }

  private calculateImpactScore(amountUsd: number, portfolioValue: number, eventType: string): number {
    const relativeSize = amountUsd / portfolioValue;
    let baseScore = Math.min(10, relativeSize * 100);
    
    // Adjust by event type
    const typeMultipliers: Record<string, number> = {
      'CEX_INFLOW': 0.8,  // Bearish
      'CEX_OUTFLOW': 1.2, // Bullish
      'DEX_SWAP': 1.0,
      'STABLECOIN_MINT': 0.9,
      'LARGE_TRANSFER': 0.7,
      'STAKING': 1.1
    };
    
    baseScore *= (typeMultipliers[eventType] || 1.0);
    return Math.max(1, Math.min(10, Math.round(baseScore)));
  }

  private getExplorerLink(address: string, token: string): string {
    const explorers: Record<string, string> = {
      'ETH': `https://etherscan.io/address/${address}`,
      'BTC': `https://blockstream.info/address/${address}`,
      'SOL': `https://solscan.io/account/${address}`,
      'POLYGON': `https://polygonscan.com/address/${address}`
    };
    return explorers[token] || explorers['ETH'];
  }

  // Deterministic random number generator (LCG)
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Whale proximity detection
  generateWhaleProximityEvents(userAddresses: string[], threshold: number = 500000): WhaleEvent[] {
    const proximityEvents: WhaleEvent[] = [];
    
    userAddresses.forEach((address, index) => {
      // Generate deterministic "nearby" whales (3-hop simulation)
      const seed = this.hashString(`${address}_${this.BLOCK_SEED}_proximity`);
      const rng = this.seededRandom(seed);
      
      // 30% chance of whale proximity event
      if (rng() > 0.7) {
        const whaleAddress = this.selectWhaleAddress(seed);
        const amount = threshold + (rng() * threshold * 2); // threshold to 3x threshold
        
        proximityEvents.push({
          id: `proximity_${seed}_${index}`,
          timestamp: new Date(Date.now() - Math.floor(rng() * 6 * 60 * 60 * 1000)), // Last 6 hours
          asset: 'ETH', // Most common for proximity
          type: rng() > 0.5 ? 'CEX_OUTFLOW' : 'LARGE_TRANSFER',
          amountUsd: Math.floor(amount),
          impactScore: Math.min(10, Math.floor(amount / 100000)), // $100K = 1 point
          whaleAddress,
          links: {
            explorer: `https://etherscan.io/address/${whaleAddress}`,
            whale: `https://etherscan.io/address/${whaleAddress}`
          }
        });
      }
    });
    
    return proximityEvents;
  }

  getSimVersion(): string {
    return this.SIM_VERSION;
  }

  getBlockSeed(): number {
    return this.BLOCK_SEED;
  }
}

export const whaleSimulator = new WhaleSimulator();