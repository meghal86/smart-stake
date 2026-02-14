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
import { 
  aggregateConfidence, 
  sourceConfidenceFromResult, 
  isSafetyCriticalSource 
} from '@/lib/portfolio/confidenceAggregation';

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
      console.log('🎯 [PortfolioSnapshot] Resolving addresses for ACTIVE_WALLET mode:', walletScope.address);
      return [walletScope.address];
    }
    
    // Fetch all user wallets from database
    console.log('🎯 [PortfolioSnapshot] Resolving addresses for ALL_WALLETS mode, userId:', userId);
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('user_portfolio_addresses')
        .select('address')
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ [PortfolioSnapshot] Error fetching user wallets:', error);
        throw error;
      }
      
      const addresses = data.map(row => row.address);
      console.log(`✅ [PortfolioSnapshot] Found ${addresses.length} wallets for user:`, addresses);
      
      return addresses;
    } catch (error) {
      console.error('❌ [PortfolioSnapshot] Failed to resolve addresses:', error);
      return [];
    }
  }

  /**
   * Get portfolio valuation data
   * Aggregates data across multiple addresses if provided
   */
  private async getPortfolioData(addresses: string[]) {
    console.log(`📊 [PortfolioSnapshot] Fetching portfolio data for ${addresses.length} address(es)`);
    
    if (addresses.length === 0) {
      console.log('⚠️ [PortfolioSnapshot] No addresses provided, returning empty portfolio');
      return { netWorth: 0, delta24h: 0, positions: [] };
    }

    try {
      // For multiple addresses, aggregate valuations
      if (addresses.length > 1) {
        console.log('🔄 [PortfolioSnapshot] Aggregating portfolio data across multiple wallets');
        
        const valuations = await Promise.allSettled(
          addresses.map(addr => portfolioValuationService.valuatePortfolio([addr]))
        );
        
        let totalNetWorth = 0;
        let totalDelta24h = 0;
        const allPositions: any[] = [];
        
        valuations.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const valuation = result.value;
            totalNetWorth += valuation.kpis.total_value;
            totalDelta24h += valuation.kpis.pnl_24h;
            
            // Add positions with wallet identifier
            valuation.holdings.forEach(holding => {
              allPositions.push({
                id: `${addresses[index]}-${holding.token}-${holding.source}`,
                token: holding.token,
                symbol: holding.token,
                amount: holding.qty.toString(),
                valueUsd: holding.value,
                chainId: 1, // Default to Ethereum mainnet
                category: 'token' as const,
                walletAddress: addresses[index]
              });
            });
          } else {
            console.error(`❌ [PortfolioSnapshot] Failed to fetch portfolio for wallet ${addresses[index]}:`, result.reason);
          }
        });
        
        console.log(`✅ [PortfolioSnapshot] Aggregated portfolio: $${totalNetWorth.toFixed(2)}, ${allPositions.length} positions`);
        
        return {
          netWorth: totalNetWorth,
          delta24h: totalDelta24h,
          positions: allPositions
        };
      }
      
      // Single address - direct call
      console.log('🔄 [PortfolioSnapshot] Fetching portfolio data for single wallet');
      const valuation = await portfolioValuationService.valuatePortfolio(addresses);
      
      console.log(`✅ [PortfolioSnapshot] Portfolio data: $${valuation.kpis.total_value.toFixed(2)}`);
      
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
    } catch (error) {
      console.error('❌ [PortfolioSnapshot] Error fetching portfolio data:', error);
      throw error;
    }
  }

  /**
   * Get Guardian security data
   * Aggregates security data across multiple addresses
   */
  private async getGuardianData(addresses: string[]) {
    console.log(`🛡️ [PortfolioSnapshot] Fetching Guardian data for ${addresses.length} address(es)`);
    
    if (addresses.length === 0) {
      console.log('⚠️ [PortfolioSnapshot] No addresses provided, returning empty Guardian data');
      return { approvals: [], riskScore: 0, flags: [] };
    }

    try {
      // For multiple addresses, aggregate Guardian scans
      if (addresses.length > 1) {
        console.log('🔄 [PortfolioSnapshot] Aggregating Guardian data across multiple wallets');
        
        const scans = await Promise.allSettled(
          addresses.map(addr => requestGuardianScan({
            walletAddress: addr,
            network: 'ethereum'
          }))
        );
        
        const allApprovals: any[] = [];
        const allFlags: any[] = [];
        let maxRiskScore = 0;
        
        scans.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const scanResult = result.value;
            maxRiskScore = Math.max(maxRiskScore, scanResult.riskScore);
            
            // Add approvals with wallet identifier
            const approvals = this.mapGuardianApprovals(scanResult, addresses[index]);
            allApprovals.push(...approvals);
            
            // Add flags
            if (scanResult.flags) {
              allFlags.push(...scanResult.flags.map((flag: any) => ({
                ...flag,
                walletAddress: addresses[index]
              })));
            }
          } else {
            console.error(`❌ [PortfolioSnapshot] Failed to fetch Guardian data for wallet ${addresses[index]}:`, result.reason);
          }
        });
        
        console.log(`✅ [PortfolioSnapshot] Aggregated Guardian: ${allApprovals.length} approvals, risk score ${maxRiskScore}`);
        
        return {
          approvals: allApprovals,
          riskScore: maxRiskScore,
          flags: allFlags
        };
      }
      
      // Single address - direct call
      console.log('🔄 [PortfolioSnapshot] Fetching Guardian data for single wallet');
      const address = addresses[0];
      const scanResult = await requestGuardianScan({
        walletAddress: address,
        network: 'ethereum'
      });

      console.log(`✅ [PortfolioSnapshot] Guardian data: risk score ${scanResult.riskScore}`);

      return {
        approvals: this.mapGuardianApprovals(scanResult, address),
        riskScore: scanResult.riskScore,
        flags: scanResult.flags
      };
    } catch (error) {
      console.error('❌ [PortfolioSnapshot] Error fetching Guardian data:', error);
      throw error;
    }
  }

  /**
   * Get Hunter opportunities data
   * Aggregates opportunities across multiple addresses
   */
  private async getHunterData(addresses: string[]) {
    console.log(`🎯 [PortfolioSnapshot] Fetching Hunter data for ${addresses.length} address(es)`);
    
    if (addresses.length === 0) {
      console.log('⚠️ [PortfolioSnapshot] No addresses provided, returning empty Hunter data');
      return { opportunities: [], positions: [] };
    }

    try {
      console.log('🔄 [PortfolioSnapshot] Fetching Hunter opportunities');
      const hunterResult = await requestHunterScan({
        walletAddresses: addresses
      });

      console.log(`✅ [PortfolioSnapshot] Hunter data: ${hunterResult.opportunities.length} opportunities`);

      return {
        opportunities: hunterResult.opportunities,
        positions: hunterResult.positions,
        confidence: hunterResult.confidence
      };
    } catch (error) {
      console.error('❌ [PortfolioSnapshot] Error fetching Hunter data:', error);
      throw error;
    }
  }

  /**
   * Get Harvest tax optimization data
   * Aggregates tax recommendations across multiple addresses
   */
  private async getHarvestData(addresses: string[]) {
    console.log(`💰 [PortfolioSnapshot] Fetching Harvest data for ${addresses.length} address(es)`);
    
    if (addresses.length === 0) {
      console.log('⚠️ [PortfolioSnapshot] No addresses provided, returning empty Harvest data');
      return { recommendations: [], taxSavings: 0 };
    }

    try {
      console.log('🔄 [PortfolioSnapshot] Fetching Harvest recommendations');
      const harvestResult = await requestHarvestScan({
        walletAddresses: addresses
      });

      console.log(`✅ [PortfolioSnapshot] Harvest data: ${harvestResult.recommendations.length} recommendations, $${harvestResult.totalTaxSavings.toFixed(2)} potential savings`);

      return {
        recommendations: harvestResult.recommendations,
        taxSavings: harvestResult.totalTaxSavings,
        confidence: harvestResult.confidence
      };
    } catch (error) {
      console.error('❌ [PortfolioSnapshot] Error fetching Harvest data:', error);
      throw error;
    }
  }

  /**
   * Calculate freshness and confidence metadata
   */
  private calculateFreshness(results: PromiseSettledResult<any>[]): FreshnessConfidence {
    const sources = ['Portfolio', 'Guardian', 'Hunter', 'Harvest'];
    
    // Create source confidences with safety-critical flags
    const sourceConfidences = results.map((result, index) => 
      sourceConfidenceFromResult(
        sources[index],
        result,
        isSafetyCriticalSource(sources[index])
      )
    );

    // Aggregate confidence using min rule for safety-critical sources
    // Requirements: R1.10 - confidence = min(sourceConfidences) for safety-critical aggregates
    const aggregated = aggregateConfidence(sourceConfidences, this.MIN_CONFIDENCE_THRESHOLD);
    const confidence = aggregated.confidence;
    
    // Determine if system is in degraded mode
    const degraded = confidence < this.DEFAULT_CONFIDENCE_THRESHOLD;
    const degradedReasons = [];
    
    if (degraded) {
      const failedSources = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
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
    // If Guardian scan includes approvals, map them directly
    if (scanResult.approvals && Array.isArray(scanResult.approvals)) {
      return scanResult.approvals.map((approval: any) => ({
        id: approval.id,
        walletAddress: address,
        spender: approval.spender,
        spenderName: approval.spenderName,
        token: approval.token,
        tokenAddress: approval.tokenAddress,
        amount: approval.amount,
        isUnlimited: approval.isUnlimited,
        approvedAt: approval.approvedAt,
        lastUsedAt: approval.lastUsedAt,
        riskLevel: approval.riskLevel,
        chainId: approval.chainId,
        estimatedValue: 0, // TODO: Calculate from token price
        recommendation: this.getApprovalRecommendation(approval.riskLevel)
      }));
    }

    // Fallback: Create approval risks from flags
    const approvalRisks: ApprovalRisk[] = [];
    
    if (scanResult.flags && Array.isArray(scanResult.flags)) {
      scanResult.flags.forEach((flag: any, index: number) => {
        // Only create approval risks for approval-related flags
        if (flag.type.includes('APPROVAL') || flag.type.includes('ALLOWANCE')) {
          approvalRisks.push({
            id: `${address}_approval_${index}`,
            walletAddress: address,
            spender: 'Unknown',
            token: 'Unknown',
            tokenAddress: '0x0',
            amount: 'unlimited',
            isUnlimited: true,
            approvedAt: new Date().toISOString(),
            riskLevel: flag.severity,
            chainId: 1,
            estimatedValue: 0,
            recommendation: flag.recommendation || this.getApprovalRecommendation(flag.severity)
          });
        }
      });
    }

    return approvalRisks;
  }

  /**
   * Get recommendation text based on risk level
   */
  private getApprovalRecommendation(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical':
        return 'Revoke this approval immediately to prevent potential loss of funds';
      case 'high':
        return 'Review and consider revoking this high-risk approval';
      case 'medium':
        return 'Monitor this approval and revoke if no longer needed';
      case 'low':
        return 'This approval appears safe but review periodically';
      default:
        return 'Review this approval';
    }
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