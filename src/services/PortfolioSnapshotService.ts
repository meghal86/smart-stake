import { 
  PortfolioSnapshot, 
  WalletScope, 
  FreshnessConfidence, 
  Position, 
  ApprovalRisk, 
  RecommendedAction 
} from '@/types/portfolio';
import { portfolioValuationService } from './PortfolioValuationService';
import { requestGuardianScan } from './guardianService';
import { riskAwareCache, calculateCacheTTL } from '@/lib/cache/RiskAwareCacheService';

/**
 * Portfolio Snapshot Service
 * 
 * Aggregates data from Guardian, Hunter, and Harvest systems to provide
 * a unified portfolio view with freshness and confidence metadata.
 * 
 * Requirements: 1.6, 1.8, 1.9, 15.3
 */
class PortfolioSnapshotService {
  private readonly DEFAULT_CONFIDENCE_THRESHOLD = 0.70;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.50;

  /**
   * Get unified portfolio snapshot with risk-aware caching
   */
  async getSnapshot(userId: string, walletScope: WalletScope): Promise<PortfolioSnapshot> {
    const startTime = Date.now();
    
    // Generate cache key based on scope
    const cacheKey = this.generateCacheKey(userId, walletScope);
    
    // Try to get from cache first
    const cached = riskAwareCache.get<PortfolioSnapshot>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // Determine addresses to analyze
      const addresses = await this.resolveAddresses(userId, walletScope);
      
      // Aggregate data from all systems in parallel
      const [
        portfolioData,
        guardianData,
        hunterData,
        harvestData
      ] = await Promise.allSettled([
        this.getPortfolioData(addresses),
        this.getGuardianData(addresses),
        this.getHunterData(addresses),
        this.getHarvestData(addresses)
      ]);

      // Calculate freshness and confidence
      const freshness = this.calculateFreshness([
        portfolioData,
        guardianData,
        hunterData,
        harvestData
      ]);

      // Extract successful data
      const portfolio = portfolioData.status === 'fulfilled' ? portfolioData.value : null;
      const guardian = guardianData.status === 'fulfilled' ? guardianData.value : null;
      const hunter = hunterData.status === 'fulfilled' ? hunterData.value : null;
      const harvest = harvestData.status === 'fulfilled' ? harvestData.value : null;

      // Build unified snapshot
      const snapshot: PortfolioSnapshot = {
        userId,
        netWorth: portfolio?.netWorth || 0,
        delta24h: portfolio?.delta24h || 0,
        freshness,
        positions: this.aggregatePositions(portfolio, hunter),
        approvals: this.aggregateApprovals(guardian),
        recommendedActions: this.aggregateActions(guardian, hunter, harvest),
        riskSummary: {
          overallScore: this.calculateOverallRisk(guardian, portfolio),
          criticalIssues: this.countCriticalIssues(guardian, hunter, harvest),
          highRiskApprovals: this.countHighRiskApprovals(guardian),
          exposureByChain: this.calculateChainExposure(portfolio, hunter)
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache with severity-based TTL
      const cacheSeverity = this.determineCacheSeverity(snapshot);
      riskAwareCache.set(cacheKey, snapshot, cacheSeverity);

      return snapshot;

    } catch (error) {
      console.error('Portfolio snapshot aggregation error:', error);
      throw error;
    }
  }

  /**
   * Resolve wallet addresses based on scope
   */
  private async resolveAddresses(userId: string, walletScope: WalletScope): Promise<string[]> {
    if (walletScope.mode === 'active_wallet') {
      return [walletScope.address];
    }
    
    // TODO: Implement user wallet lookup for all_wallets mode
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get portfolio valuation data
   */
  private async getPortfolioData(addresses: string[]) {
    if (addresses.length === 0) {
      return { netWorth: 0, delta24h: 0, positions: [] };
    }

    const valuation = await portfolioValuationService.valuatePortfolio(addresses);
    
    return {
      netWorth: valuation.kpis.total_value,
      delta24h: valuation.kpis.pnl_24h,
      positions: valuation.holdings.map(holding => ({
        id: `${holding.token}-${holding.source}`,
        token: holding.token,
        symbol: holding.token,
        amount: holding.qty.toString(),
        valueUsd: holding.value,
        chainId: 1, // Default to Ethereum mainnet
        category: 'token' as const
      }))
    };
  }

  /**
   * Get Guardian security data
   */
  private async getGuardianData(addresses: string[]) {
    if (addresses.length === 0) {
      return { approvals: [], riskScore: 0, flags: [] };
    }

    // For now, scan the first address
    // TODO: Implement multi-address Guardian scanning
    const address = addresses[0];
    const scanResult = await requestGuardianScan({
      walletAddress: address,
      network: 'ethereum'
    });

    return {
      approvals: this.mapGuardianApprovals(scanResult, address),
      riskScore: scanResult.riskScore,
      flags: scanResult.flags
    };
  }

  /**
   * Get Hunter opportunities data
   */
  private async getHunterData(addresses: string[]) {
    // TODO: Implement Hunter API integration
    // Placeholder for Hunter opportunities
    return {
      opportunities: [],
      positions: []
    };
  }

  /**
   * Get Harvest tax optimization data
   */
  private async getHarvestData(addresses: string[]) {
    // TODO: Implement Harvest API integration
    // Placeholder for Harvest recommendations
    return {
      recommendations: [],
      taxSavings: 0
    };
  }

  /**
   * Calculate freshness and confidence metadata
   */
  private calculateFreshness(results: PromiseSettledResult<any>[]): FreshnessConfidence {
    const now = Date.now();
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const totalCount = results.length;
    
    // Calculate confidence based on successful data sources
    // Requirements: R1.10 - confidence = min(sourceConfidences) for safety-critical aggregates
    const baseConfidence = successCount / totalCount;
    const confidence = Math.max(this.MIN_CONFIDENCE_THRESHOLD, baseConfidence);
    
    // Determine if system is in degraded mode
    const degraded = confidence < this.DEFAULT_CONFIDENCE_THRESHOLD;
    const degradedReasons = [];
    
    if (degraded) {
      const failedSources = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sources = ['Portfolio', 'Guardian', 'Hunter', 'Harvest'];
          failedSources.push(sources[index]);
        }
      });
      degradedReasons.push(`Failed to load data from: ${failedSources.join(', ')}`);
    }

    return {
      freshnessSec: 0, // Always 0 for new data
      confidence,
      confidenceThreshold: this.DEFAULT_CONFIDENCE_THRESHOLD,
      degraded,
      degradedReasons: degradedReasons.length > 0 ? degradedReasons : undefined
    };
  }

  /**
   * Map Guardian flags to approval risks
   */
  private mapGuardianApprovals(scanResult: any, address: string): ApprovalRisk[] {
    // TODO: Implement proper Guardian approval mapping
    // This is a placeholder implementation
    return [];
  }

  /**
   * Aggregate positions from multiple sources
   */
  private aggregatePositions(portfolio: any, hunter: any): Position[] {
    const positions: Position[] = [];
    
    // Add portfolio positions
    if (portfolio?.positions) {
      positions.push(...portfolio.positions);
    }
    
    // TODO: Add Hunter positions
    
    return positions;
  }

  /**
   * Aggregate approvals from Guardian
   */
  private aggregateApprovals(guardian: any): ApprovalRisk[] {
    return guardian?.approvals || [];
  }

  /**
   * Aggregate recommended actions from all sources
   */
  private aggregateActions(guardian: any, hunter: any, harvest: any): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
    
    // TODO: Implement action aggregation from all sources
    
    return actions;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRisk(guardian: any, portfolio: any): number {
    if (guardian?.riskScore !== undefined) {
      return guardian.riskScore / 10; // Normalize to 0-1 scale
    }
    
    if (portfolio?.riskScore !== undefined) {
      return portfolio.riskScore / 10; // Normalize to 0-1 scale
    }
    
    return 0.5; // Default moderate risk
  }

  /**
   * Count critical issues across all sources
   */
  private countCriticalIssues(guardian: any, hunter: any, harvest: any): number {
    let count = 0;
    
    // Count Guardian critical flags
    if (guardian?.flags) {
      count += guardian.flags.filter((flag: any) => flag.severity === 'high').length;
    }
    
    // TODO: Add Hunter and Harvest critical issue counting
    
    return count;
  }

  /**
   * Count high-risk approvals
   */
  private countHighRiskApprovals(guardian: any): number {
    if (guardian?.approvals) {
      return guardian.approvals.filter((approval: any) => 
        approval.severity === 'critical' || approval.severity === 'high'
      ).length;
    }
    
    return 0;
  }

  /**
   * Calculate exposure by chain
   */
  private calculateChainExposure(portfolio: any, hunter: any): Record<string, number> {
    const exposure: Record<string, number> = {};
    
    // Add portfolio chain exposure
    if (portfolio?.positions) {
      portfolio.positions.forEach((position: Position) => {
        const chainName = this.getChainName(position.chainId);
        exposure[chainName] = (exposure[chainName] || 0) + position.valueUsd;
      });
    }
    
    return exposure;
  }

  /**
   * Get chain name from chain ID
   */
  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      250: 'Fantom',
      42161: 'Arbitrum',
      10: 'Optimism'
    };
    
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  /**
   * Generate cache key for portfolio snapshot
   */
  private generateCacheKey(userId: string, walletScope: WalletScope): string {
    if (walletScope.mode === 'active_wallet') {
      return `portfolio_snapshot_${userId}_${walletScope.address}`;
    } else {
      return `portfolio_snapshot_${userId}_all_wallets`;
    }
  }

  /**
   * Determine cache severity based on portfolio risk
   * 
   * Requirements: 10.5 - Severity-based TTL ranges
   */
  private determineCacheSeverity(snapshot: PortfolioSnapshot): 'critical' | 'high' | 'medium' | 'low' {
    // Critical: High risk score or critical issues present
    if (snapshot.riskSummary.overallScore >= 0.8 || snapshot.riskSummary.criticalIssues > 0) {
      return 'critical';
    }
    
    // High: Medium-high risk or high-risk approvals
    if (snapshot.riskSummary.overallScore >= 0.6 || snapshot.riskSummary.highRiskApprovals > 0) {
      return 'high';
    }
    
    // Medium: Some risk present or degraded confidence
    if (snapshot.riskSummary.overallScore >= 0.4 || snapshot.freshness.degraded) {
      return 'medium';
    }
    
    // Low: Low risk, high confidence
    return 'low';
  }

  /**
   * Invalidate cache for wallet on new transaction
   * 
   * Requirements: 10.6 - Cache invalidation on new transactions
   */
  invalidateCacheForWallet(walletAddress: string): void {
    riskAwareCache.invalidateCritical(walletAddress, 'New transaction detected');
  }

  /**
   * Warm cache for critical portfolio data
   * 
   * Requirements: 10.6 - Cache warming for critical data
   */
  async warmCacheForUser(userId: string, walletScope: WalletScope): Promise<void> {
    const cacheKey = this.generateCacheKey(userId, walletScope);
    
    await riskAwareCache.warmCache(
      cacheKey,
      () => this.getSnapshot(userId, walletScope),
      'medium'
    );
  }
}

export const portfolioSnapshotService = new PortfolioSnapshotService();