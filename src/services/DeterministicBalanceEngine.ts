interface TokenBalance {
  token: string;
  qty: number;
  source: 'simulated' | 'real';
  sim_version: string;
  chain: 'eth' | 'sol' | 'btc';
}

interface TokenConfig {
  min: number;
  max: number;
  chain: 'eth' | 'sol' | 'btc';
}

class DeterministicBalanceEngine {
  private readonly SIM_VERSION = '1.0';
  private readonly SALT = 'whaleplus_mvp_2024';
  
  private readonly TOKEN_CONFIGS: Record<string, TokenConfig> = {
    'bitcoin': { min: 0.1, max: 2.5, chain: 'btc' },
    'solana': { min: 10, max: 200, chain: 'sol' },
    'chainlink': { min: 50, max: 1000, chain: 'eth' },
    'polygon': { min: 100, max: 5000, chain: 'eth' },
    'usd-coin': { min: 100, max: 10000, chain: 'eth' }
  };

  generateBalances(address: string, tokens: string[]): TokenBalance[] {
    const seed = this.generateSeed(address);
    const balances: TokenBalance[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const config = this.TOKEN_CONFIGS[token];
      
      if (!config) continue;
      
      // Use seed + index for deterministic randomness
      const tokenSeed = this.hashString(`${seed}_${token}_${i}`);
      const normalizedSeed = tokenSeed / 0xffffffff; // 0-1 range
      
      const qty = config.min + (normalizedSeed * (config.max - config.min));
      
      balances.push({
        token,
        qty: Math.round(qty * 100) / 100, // 2 decimal places
        source: 'simulated',
        sim_version: this.SIM_VERSION,
        chain: config.chain
      });
    }
    
    return balances;
  }

  private generateSeed(address: string): number {
    // Simple hash function for deterministic seed
    return this.hashString(`${address}_${this.SALT}_${this.SIM_VERSION}`);
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

  // Get entropy explanation for UI
  getEntropyExplanation(address: string): string {
    const seed = this.generateSeed(address);
    return `Balances derived from address hash (seed: ${seed.toString(16).slice(0, 8)}...)`;
  }

  getSimVersion(): string {
    return this.SIM_VERSION;
  }
}

export const deterministicBalanceEngine = new DeterministicBalanceEngine();