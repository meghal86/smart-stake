import { priceOracle } from './PriceOracle_CoinGecko';
import { ethBalanceProvider } from './EthBalanceProvider_Etherscan';
import { deterministicBalanceEngine } from './DeterministicBalanceEngine';
import { coinGeckoBreaker, etherscanBreaker } from './circuitBreaker';
import { requestCoalescer } from './coalesce';

interface PortfolioKPIs {
  total_value: number;
  pnl_24h: number;
  risk_score: number;
  concentration_hhi: number;
}

interface PortfolioHolding {
  token: string;
  qty: number;
  value: number;
  source: 'real' | 'simulated';
  change_24h: number;
}

interface PortfolioMeta {
  cache_status: 'hit' | 'miss' | 'stale';
  last_updated: Date;
  sim_version: string;
  latency_ms: number;
}

interface PortfolioValuation {
  kpis: PortfolioKPIs;
  holdings: PortfolioHolding[];
  meta: PortfolioMeta;
}

class PortfolioValuationService {
  private readonly TOKENS = ['bitcoin', 'solana', 'chainlink', 'polygon', 'usd-coin'];

  async valuatePortfolio(addresses: string[]): Promise<PortfolioValuation> {
    const startTime = Date.now();
    
    try {
      // Fetch live prices with circuit breaker and coalescing
      const allTokens = ['ethereum', ...this.TOKENS];
      const priceKey = `prices_${allTokens.join(',')}`;
      
      const prices = await requestCoalescer.coalesce(
        priceKey,
        () => coinGeckoBreaker.execute(
          () => priceOracle.getPrices(allTokens),
          () => this.getCachedPrices(allTokens) // Fallback to cached prices
        )
      );
      
      let totalValue = 0;
      let totalChange = 0;
      const holdings: PortfolioHolding[] = [];
      
      for (const address of addresses) {
        // Real ETH balance with circuit breaker
        const ethBalanceKey = `eth_balance_${address}`;
        const ethBalance = await requestCoalescer.coalesce(
          ethBalanceKey,
          () => etherscanBreaker.execute(
            () => ethBalanceProvider.getEthBalance(address),
            () => Promise.resolve(0) // Fallback to 0 if circuit open
          )
        );
        const ethPrice = prices.ethereum;
        const ethValue = ethBalance * ethPrice.price;
        
        holdings.push({
          token: 'ETH',
          qty: ethBalance,
          value: ethValue,
          source: 'real',
          change_24h: ethPrice.change_24h
        });
        
        totalValue += ethValue;
        totalChange += ethPrice.change_24h * ethValue;
        
        // Simulated token balances
        const tokenBalances = deterministicBalanceEngine.generateBalances(address, this.TOKENS);
        
        for (const balance of tokenBalances) {
          const price = prices[balance.token];
          if (!price) continue;
          
          const value = balance.qty * price.price;
          
          holdings.push({
            token: balance.token.toUpperCase(),
            qty: balance.qty,
            value,
            source: 'simulated',
            change_24h: price.change_24h
          });
          
          totalValue += value;
          totalChange += price.change_24h * value;
        }
      }
      
      const avgChange = totalValue > 0 ? totalChange / totalValue : 0;
      const pnl24h = (totalValue * avgChange) / 100;
      
      // Calculate risk metrics
      const riskScore = this.calculateRiskScore(holdings, totalValue);
      const concentrationHHI = this.calculateHHI(holdings, totalValue);
      
      return {
        kpis: {
          total_value: totalValue,
          pnl_24h: pnl24h,
          risk_score: riskScore,
          concentration_hhi: concentrationHHI
        },
        holdings,
        meta: {
          cache_status: 'miss',
          last_updated: new Date(),
          sim_version: deterministicBalanceEngine.getSimVersion(),
          latency_ms: Date.now() - startTime
        }
      };
      
    } catch (error) {
      console.error('Portfolio valuation error:', error);
      throw error;
    }
  }

  private calculateRiskScore(holdings: PortfolioHolding[], totalValue: number): number {
    if (totalValue === 0) return 5;
    
    let riskScore = 5; // Base risk
    
    // Concentration risk (HHI)
    const hhi = this.calculateHHI(holdings, totalValue);
    if (hhi > 0.7) riskScore -= 2; // High concentration
    else if (hhi > 0.5) riskScore -= 1;
    
    // Volatility risk (average 24h change)
    const avgVolatility = holdings.reduce((sum, h) => sum + Math.abs(h.change_24h), 0) / holdings.length;
    if (avgVolatility > 10) riskScore -= 1;
    else if (avgVolatility < 3) riskScore += 1;
    
    // Portfolio size (larger = more stable)
    if (totalValue > 100000) riskScore += 1;
    if (totalValue > 500000) riskScore += 1;
    
    return Math.max(1, Math.min(10, riskScore));
  }

  private calculateHHI(holdings: PortfolioHolding[], totalValue: number): number {
    if (totalValue === 0) return 0;
    
    let hhi = 0;
    for (const holding of holdings) {
      const share = holding.value / totalValue;
      hhi += share * share;
    }
    
    return hhi;
  }

  // AI Hook for future ML risk models
  async riskV2Interface(holdingsVector: number[]): Promise<{ risk_prob: number; confidence: number }> {
    // Placeholder for future ML model
    return {
      risk_prob: Math.random(),
      confidence: 0.85
    };
  }

  getHealthStatus() {
    return {
      price_oracle: {
        ...priceOracle.getHealthStatus?.() || { status: 'unknown' },
        circuit_breaker: coinGeckoBreaker.getState()
      },
      eth_provider: {
        ...ethBalanceProvider.getHealthStatus(),
        circuit_breaker: etherscanBreaker.getState()
      },
      sim_version: deterministicBalanceEngine.getSimVersion(),
      coalescer: requestCoalescer.getStats()
    };
  }
  
  private getCachedPrices(tokens: string[]) {
    // Fallback cached prices (SLA: <150ms response)
    const cachedPrices: Record<string, any> = {
      ethereum: { price: 4171.90, change_24h: 0.18 },
      bitcoin: { price: 65000, change_24h: -0.5 },
      solana: { price: 150, change_24h: 2.1 },
      chainlink: { price: 15, change_24h: 1.2 },
      polygon: { price: 0.8, change_24h: -1.1 }
    };
    
    const result: Record<string, any> = {};
    tokens.forEach(token => {
      result[token] = cachedPrices[token] || { price: 1, change_24h: 0 };
    });
    
    return Promise.resolve(result);
  }
}

export const portfolioValuationService = new PortfolioValuationService();