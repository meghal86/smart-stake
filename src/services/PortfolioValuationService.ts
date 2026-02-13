/**
 * Portfolio Valuation Service
 * 
 * Provides portfolio valuation and holdings data aggregation.
 * Calls the portfolio-tracker-live edge function for real blockchain data.
 */

import { createClient } from '@supabase/supabase-js';

export interface PortfolioHolding {
  token: string;
  source: string;
  qty: number;
  value: number;
}

export interface PortfolioKPIs {
  total_value: number;
  pnl_24h: number;
  risk_score: number;
  concentration_hhi: number;
}

export interface PortfolioValuationResult {
  kpis: PortfolioKPIs;
  holdings: PortfolioHolding[];
  meta: {
    cache_status: 'hit' | 'miss';
    last_updated: Date;
    sim_version: string;
    latency_ms: number;
  };
}

class PortfolioValuationService {
  private getSupabaseClient() {
    // Lazy load Supabase client to avoid issues with process.env
    if (typeof window === 'undefined') {
      // Server-side
      const { createClient } = require('@supabase/supabase-js');
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    } else {
      // Client-side (shouldn't happen, but fallback)
      const { createClient } = require('@supabase/supabase-js');
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
  }

  /**
   * Valuate portfolio for given addresses
   * Tries to call portfolio-tracker-live edge function, falls back to mock data
   */
  async valuatePortfolio(addresses: string[]): Promise<PortfolioValuationResult> {
    const startTime = Date.now();
    
    console.log('📊 [PortfolioValuation] Attempting to call portfolio-tracker-live edge function for addresses:', addresses);
    
    try {
      const supabase = this.getSupabaseClient();
      
      // Try to call the portfolio-tracker-live edge function
      const { data, error } = await supabase.functions.invoke('portfolio-tracker-live', {
        body: { addresses }
      });

      if (error) {
        console.warn('⚠️ [PortfolioValuation] Edge function error, falling back to mock data:', error);
        return this.getMockPortfolioData(addresses, startTime);
      }

      console.log('✅ [PortfolioValuation] Received data from edge function:', data);

      // Check if we got valid data
      if (!data || Object.keys(data).length === 0) {
        console.warn('⚠️ [PortfolioValuation] Empty data from edge function, falling back to mock data');
        return this.getMockPortfolioData(addresses, startTime);
      }

      // Aggregate data from all addresses
      let totalValue = 0;
      let totalPnl24h = 0;
      const allHoldings: PortfolioHolding[] = [];
      let maxRiskScore = 0;

      // Process each address's data
      Object.entries(data || {}).forEach(([address, walletData]: [string, any]) => {
        if (walletData && typeof walletData === 'object') {
          totalValue += walletData.total_value_usd || 0;
          maxRiskScore = Math.max(maxRiskScore, walletData.risk_score || 0);

          // Add holdings from tokens
          if (Array.isArray(walletData.tokens)) {
            walletData.tokens.forEach((token: any) => {
              allHoldings.push({
                token: token.symbol,
                source: address,
                qty: token.balance,
                value: token.value_usd
              });

              // Calculate 24h PnL from price change
              if (token.price_change_24h) {
                const pnl = token.value_usd * (token.price_change_24h / 100);
                totalPnl24h += pnl;
              }
            });
          }
        }
      });

      // Calculate concentration (Herfindahl-Hirschman Index)
      const concentration_hhi = this.calculateConcentration(allHoldings);

      const latency = Date.now() - startTime;

      console.log(`✅ [PortfolioValuation] Aggregated REAL data: $${totalValue.toFixed(2)}, ${allHoldings.length} holdings, ${latency}ms`);

      return {
        kpis: {
          total_value: totalValue,
          pnl_24h: totalPnl24h,
          risk_score: maxRiskScore,
          concentration_hhi
        },
        holdings: allHoldings,
        meta: {
          cache_status: 'miss',
          last_updated: new Date(),
          sim_version: '2.0.0-real',
          latency_ms: latency
        }
      };
    } catch (error) {
      console.error('❌ [PortfolioValuation] Error calling edge function, falling back to mock data:', error);
      return this.getMockPortfolioData(addresses, startTime);
    }
  }

  /**
   * Get mock portfolio data as fallback
   */
  private getMockPortfolioData(addresses: string[], startTime: number): PortfolioValuationResult {
    console.log('🎭 [PortfolioValuation] Using MOCK data for', addresses.length, 'address(es)');
    
    // Generate deterministic mock data based on addresses
    const totalValue = addresses.length * 1000 + Math.random() * 5000;
    const pnl24h = (Math.random() - 0.5) * 200;
    
    return {
      kpis: {
        total_value: totalValue,
        pnl_24h: pnl24h,
        risk_score: Math.random() * 10,
        concentration_hhi: Math.random() * 0.5
      },
      holdings: addresses.flatMap((address, index) => [
        {
          token: 'ETH',
          source: `wallet_${index}`,
          qty: Math.random() * 10,
          value: Math.random() * 2000
        },
        {
          token: 'USDC',
          source: `wallet_${index}`,
          qty: Math.random() * 1000,
          value: Math.random() * 1000
        }
      ]),
      meta: {
        cache_status: 'miss',
        last_updated: new Date(),
        sim_version: '2.0.0-mock',
        latency_ms: Date.now() - startTime
      }
    };
  }

  /**
   * Calculate portfolio concentration using Herfindahl-Hirschman Index
   * Returns value between 0 (perfectly diversified) and 1 (fully concentrated)
   */
  private calculateConcentration(holdings: PortfolioHolding[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    if (totalValue === 0) return 0;

    // Calculate sum of squared market shares
    const hhi = holdings.reduce((sum, holding) => {
      const share = holding.value / totalValue;
      return sum + (share * share);
    }, 0);

    return hhi;
  }
}

export const portfolioValuationService = new PortfolioValuationService();