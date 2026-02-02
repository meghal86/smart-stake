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
import { requestHunterScan } from './hunterService';
import { requestHarvestScan } from './harvestService';
import { riskAwareCache, calculateCacheTTL } from '@/lib/cache/RiskAwareCacheService';
import { cacheInvalidationEngine } from '@/lib/cache/CacheInvalidationEngine';

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
    if (addresses.length === 0) {
      return { opportunities: [], positions: [] };
    }

    const hunterResult = await requestHunterScan({
      walletAddresses: addresses
    });

    return {
      opportunities: hunterResult.opportunities,
      positions: hunterResult.positions,
      confidence: hunterResult.confidence
    };
  }

  /**
   * Get Harvest tax optimization data
   */
  private async getHarvestData(addresses: string[]) {
    if (addresses.length === 0) {
      return { recommendations: [], taxSavings: 0 };
    }

    const harvestResult = await requestHarvestScan({
      walletAddresses: addresses
    });

    return {
      recommendations: harvestResult.recommendations,
      taxSavings: harvestResult.totalTaxSavings,
      confidence: harvestResult.confidence
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
    
    // Add Hunter positions
    if (hunter?.positions) {
      hunter.positions.forEach((hunterPos: any) => {
        positions.push({
          id: hunterPos.id,
          token: hunterPos.token,
          symbol: hunterPos.token,
          amount: hunterPos.amount,
          valueUsd: hunterPos.valueUsd,
          chainId: hunterPos.chainId,
          category: 'defi' as const,
          protocol: hunterPos.protocol,
          apy: hunterPos.apy
        });
      });
    }
    
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
    
    // Add Guardian-based actions (approval hygiene, de-risk)
    if (guardian?.flags) {
      guardian.flags.forEach((flag: any, index: number) => {
        if (flag.severity === 'critical' || flag.severity === 'high') {
          actions.push({
            id: `guardian_action_${index}`,
            title: flag.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
            severity: flag.severity,
            why: [flag.description, flag.recommendation || 'Take action to reduce risk'],
            impactPreview: {
              riskDelta: -0.3,
              preventedLossP50Usd: 1000,
              expectedGainUsd: 0,
              gasEstimateUsd: 5,
              timeEstimateSec: 30,
              confidence: 0.85
            },
            actionScore: this.calculateActionScore(flag.severity, 1000, 0.85, 5, 30),
            cta: {
              label: 'Review & Fix',
              intent: 'revoke_approval',
              params: { flagType: flag.type }
            },
            walletScope: { mode: 'active_wallet', address: '0x0' as `0x${string}` }
          });
        }
      });
    }
    
    // Add Hunter-based actions (claim rewards, opportunities)
    if (hunter?.opportunities) {
      hunter.opportunities.slice(0, 3).forEach((opp: any) => {
        actions.push({
          id: opp.id,
          title: opp.title,
          severity: 'medium',
          why: [opp.description, `Estimated value: $${opp.estimatedValue.toFixed(2)}`],
          impactPreview: {
            riskDelta: 0,
            preventedLossP50Usd: 0,
            expectedGainUsd: opp.estimatedValue,
            gasEstimateUsd: 10,
            timeEstimateSec: 60,
            confidence: opp.confidence
          },
          actionScore: this.calculateActionScore('medium', opp.estimatedValue, opp.confidence, 10, 60),
          cta: {
            label: 'Explore Opportunity',
            intent: 'route_opportunity',
            params: { opportunityId: opp.id }
          },
          walletScope: { mode: 'active_wallet', address: '0x0' as `0x${string}` }
        });
      });
    }
    
    // Add Harvest-based actions (tax optimization)
    if (harvest?.recommendations) {
      harvest.recommendations.slice(0, 2).forEach((rec: any) => {
        if (rec.type === 'tax_loss_harvest' && rec.estimatedTaxSavings > 100) {
          actions.push({
            id: rec.id,
            title: rec.title,
            severity: 'low',
            why: [rec.description, `Estimated tax savings: $${rec.estimatedTaxSavings.toFixed(2)}`],
            impactPreview: {
              riskDelta: 0,
              preventedLossP50Usd: 0,
              expectedGainUsd: rec.estimatedTaxSavings,
              gasEstimateUsd: 15,
              timeEstimateSec: 120,
              confidence: rec.confidence
            },
            actionScore: this.calculateActionScore('low', rec.estimatedTaxSavings, rec.confidence, 15, 120),
            cta: {
              label: 'Review Tax Strategy',
              intent: 'harvest_rewards',
              params: { recommendationId: rec.id }
            },
            walletScope: { mode: 'active_wallet', address: '0x0' as `0x${string}` }
          });
        }
      });
    }
    
    // Sort by action score (descending)
    actions.sort((a, b) => b.actionScore - a.actionScore);
    
    return actions;
  }
  
  /**
   * Calculate action score for prioritization
   * Requirements: R4.3-R4.4 - ActionScore weights and tie-break rules
   */
  private calculateActionScore(
    severity: 'critical' | 'high' | 'medium' | 'low',
    exposureUsd: number,
    confidence: number,
    gasUsd: number,
    timeSec: number
  ): number {
    const severityWeights = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25
    };
    
    const severityWeight = severityWeights[severity];
    const timeDecay = 1.0; // No time decay for now
    const friction = gasUsd + (timeSec / 60); // Convert time to minutes
    
    return (severityWeight * exposureUsd * confidence * timeDecay) - friction;
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
      count += guardian.flags.filter((flag: any) => flag.severity === 'critical').length;
    }
    
    // Count Hunter high-value opportunities as potential issues if missed
    if (hunter?.opportunities) {
      count += hunter.opportunities.filter((opp: any) => 
        opp.estimatedValue > 1000 && opp.confidence > 0.8
      ).length;
    }
    
    // Count Harvest high-value tax loss opportunities
    if (harvest?.recommendations) {
      count += harvest.recommendations.filter((rec: any) => 
        rec.type === 'tax_loss_harvest' && rec.estimatedTaxSavings > 500
      ).length;
    }
    
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
  invalidateCacheForWallet(walletAddress: string, userId: string): void {
    cacheInvalidationEngine.invalidateOnNewTransaction(walletAddress, userId);
  }

  /**
   * Invalidate cache on wallet switch
   * 
   * Requirements: 10.6 - Clear user-specific caches on wallet switching
   */
  invalidateCacheOnWalletSwitch(
    userId: string,
    previousWallet: string | null,
    newWallet: string
  ): void {
    cacheInvalidationEngine.invalidateOnWalletSwitch(userId, previousWallet, newWallet);
  }

  /**
   * Invalidate cache on policy change
   * 
   * Requirements: 10.6 - Invalidate simulation results on policy changes
   */
  invalidateCacheOnPolicyChange(userId: string, changedPolicies: string[]): void {
    cacheInvalidationEngine.invalidateOnPolicyChange(userId, changedPolicies);
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