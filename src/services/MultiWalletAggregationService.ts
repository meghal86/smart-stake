/**
 * Multi-Wallet Aggregation Service
 * 
 * Extends PortfolioSnapshotService to provide cross-wallet aggregation,
 * unified risk scoring, and exposure distribution tracking.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { createClient } from '@/lib/supabase/client';
import { 
  PortfolioSnapshot, 
  Position, 
  ApprovalRisk,
  RecommendedAction
} from '@/types/portfolio';
import { portfolioSnapshotService } from './PortfolioSnapshotService';

export interface MultiWalletAggregation {
  userId: string;
  totalNetWorth: number;
  delta24h: number;
  walletCount: number;
  exposureBreakdown: ExposureBreakdown;
  unifiedRiskScore: number;
  topMovers: TopMover[];
  aggregatedPositions: Position[];
  aggregatedApprovals: ApprovalRisk[];
  aggregatedActions: RecommendedAction[];
  lastUpdated: string;
}

export interface ExposureBreakdown {
  byChain: Record<string, ChainExposure>;
  byProtocol: Record<string, ProtocolExposure>;
  byAssetType: Record<string, number>;
}

export interface ChainExposure {
  valueUsd: number;
  percentage: number;
  walletCount: number;
}

export interface ProtocolExposure {
  valueUsd: number;
  percentage: number;
  riskScore: number;
}

export interface TopMover {
  token: string;
  symbol: string;
  delta24h: number;
  deltaPercentage: number;
  currentValue: number;
  walletAddress: string;
}

class MultiWalletAggregationService {
  private supabase = createClient();

  /**
   * Aggregate portfolio data across all user wallets
   * 
   * Requirements: 12.1 - Aggregate net worth and exposure breakdown
   */
  async aggregateAllWallets(userId: string): Promise<MultiWalletAggregation> {
    // Get all user wallet addresses
    const walletAddresses = await this.getUserWalletAddresses(userId);
    
    if (walletAddresses.length === 0) {
      return this.getEmptyAggregation(userId);
    }

    // Fetch snapshots for all wallets in parallel
    const snapshots = await Promise.all(
      walletAddresses.map(address =>
        portfolioSnapshotService.getSnapshot(userId, {
          mode: 'active_wallet',
          address
        })
      )
    );

    // Aggregate net worth across all wallets
    const totalNetWorth = this.aggregateNetWorth(snapshots);
    const delta24h = this.aggregateDelta24h(snapshots);

    // Calculate unified risk score
    const unifiedRiskScore = this.calculateUnifiedRiskScore(snapshots);

    // Track exposure distributions
    const exposureBreakdown = this.calculateExposureBreakdown(snapshots, totalNetWorth);

    // Identify top movers
    const topMovers = this.identifyTopMovers(snapshots);

    // Aggregate positions, approvals, and actions
    const aggregatedPositions = this.aggregatePositions(snapshots);
    const aggregatedApprovals = this.aggregateApprovals(snapshots);
    const aggregatedActions = this.aggregateActions(snapshots);

    return {
      userId,
      totalNetWorth,
      delta24h,
      walletCount: walletAddresses.length,
      exposureBreakdown,
      unifiedRiskScore,
      topMovers,
      aggregatedPositions,
      aggregatedApprovals,
      aggregatedActions,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get all wallet addresses for a user
   */
  private async getUserWalletAddresses(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_portfolio_addresses')
      .select('address')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching user wallet addresses:', error);
      return [];
    }

    return data?.map(row => row.address) || [];
  }

  /**
   * Aggregate net worth across all wallet snapshots
   * 
   * Requirements: 12.1 - Cross-wallet net worth calculation
   */
  private aggregateNetWorth(snapshots: PortfolioSnapshot[]): number {
    return snapshots.reduce((total, snapshot) => total + snapshot.netWorth, 0);
  }

  /**
   * Aggregate 24h delta across all wallet snapshots
   */
  private aggregateDelta24h(snapshots: PortfolioSnapshot[]): number {
    return snapshots.reduce((total, snapshot) => total + snapshot.delta24h, 0);
  }

  /**
   * Calculate unified risk score across all wallets
   * 
   * Requirements: 12.3 - Unified risk scores across wallet set
   */
  private calculateUnifiedRiskScore(snapshots: PortfolioSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    // Use weighted average based on net worth
    const totalNetWorth = this.aggregateNetWorth(snapshots);
    
    if (totalNetWorth === 0) {
      // If no net worth, use simple average
      const sum = snapshots.reduce((total, snapshot) => 
        total + snapshot.riskSummary.overallScore, 0
      );
      return sum / snapshots.length;
    }

    // Weighted average by net worth
    const weightedSum = snapshots.reduce((total, snapshot) => {
      const weight = snapshot.netWorth / totalNetWorth;
      return total + (snapshot.riskSummary.overallScore * weight);
    }, 0);

    return weightedSum;
  }

  /**
   * Calculate exposure breakdown by chain, protocol, and asset type
   * 
   * Requirements: 12.2 - Asset/chain/protocol distribution tracking
   */
  private calculateExposureBreakdown(
    snapshots: PortfolioSnapshot[],
    totalNetWorth: number
  ): ExposureBreakdown {
    const byChain: Record<string, ChainExposure> = {};
    const byProtocol: Record<string, ProtocolExposure> = {};
    const byAssetType: Record<string, number> = {};

    // Track which wallets have exposure on each chain
    const chainWallets: Record<string, Set<string>> = {};

    snapshots.forEach(snapshot => {
      // Aggregate chain exposure
      Object.entries(snapshot.riskSummary.exposureByChain).forEach(([chain, value]) => {
        if (!byChain[chain]) {
          byChain[chain] = {
            valueUsd: 0,
            percentage: 0,
            walletCount: 0
          };
          chainWallets[chain] = new Set();
        }
        byChain[chain].valueUsd += value;
        
        // Track unique wallets per chain
        if (snapshot.userId) {
          chainWallets[chain].add(snapshot.userId);
        }
      });

      // Aggregate positions by asset type
      snapshot.positions.forEach(position => {
        const assetType = position.category || 'token';
        byAssetType[assetType] = (byAssetType[assetType] || 0) + position.valueUsd;
      });
    });

    // Calculate percentages and wallet counts
    Object.keys(byChain).forEach(chain => {
      byChain[chain].percentage = totalNetWorth > 0 
        ? (byChain[chain].valueUsd / totalNetWorth) * 100 
        : 0;
      byChain[chain].walletCount = chainWallets[chain]?.size || 0;
    });

    // TODO: Implement protocol exposure tracking
    // This requires protocol identification from positions data

    return {
      byChain,
      byProtocol,
      byAssetType
    };
  }

  /**
   * Identify top movers across all portfolios
   * 
   * Requirements: 12.4 - Top movers and "what changed" drivers
   */
  private identifyTopMovers(snapshots: PortfolioSnapshot[]): TopMover[] {
    const movers: TopMover[] = [];

    snapshots.forEach(snapshot => {
      snapshot.positions.forEach(position => {
        // Calculate 24h change (simplified - would need historical data)
        const delta24h = snapshot.delta24h * (position.valueUsd / snapshot.netWorth);
        const deltaPercentage = position.valueUsd > 0 
          ? (delta24h / position.valueUsd) * 100 
          : 0;

        movers.push({
          token: position.token,
          symbol: position.symbol,
          delta24h,
          deltaPercentage,
          currentValue: position.valueUsd,
          walletAddress: snapshot.userId // Using userId as placeholder
        });
      });
    });

    // Sort by absolute delta and return top 10
    return movers
      .sort((a, b) => Math.abs(b.delta24h) - Math.abs(a.delta24h))
      .slice(0, 10);
  }

  /**
   * Aggregate positions across all wallets
   */
  private aggregatePositions(snapshots: PortfolioSnapshot[]): Position[] {
    const positionMap = new Map<string, Position>();

    snapshots.forEach(snapshot => {
      snapshot.positions.forEach(position => {
        // Create unique key for position (token + chain)
        const key = `${position.token}_${position.chainId}`;
        
        if (positionMap.has(key)) {
          // Aggregate existing position
          const existing = positionMap.get(key)!;
          existing.amount = (
            parseFloat(existing.amount) + parseFloat(position.amount)
          ).toString();
          existing.valueUsd += position.valueUsd;
        } else {
          // Add new position
          positionMap.set(key, { ...position });
        }
      });
    });

    return Array.from(positionMap.values())
      .sort((a, b) => b.valueUsd - a.valueUsd);
  }

  /**
   * Aggregate approvals across all wallets
   */
  private aggregateApprovals(snapshots: PortfolioSnapshot[]): ApprovalRisk[] {
    const approvals: ApprovalRisk[] = [];

    snapshots.forEach(snapshot => {
      approvals.push(...snapshot.approvals);
    });

    // Sort by risk score descending
    return approvals.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Aggregate recommended actions across all wallets
   */
  private aggregateActions(snapshots: PortfolioSnapshot[]): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    snapshots.forEach(snapshot => {
      actions.push(...snapshot.recommendedActions);
    });

    // Sort by action score descending
    return actions.sort((a, b) => b.actionScore - a.actionScore);
  }

  /**
   * Get empty aggregation for users with no wallets
   */
  private getEmptyAggregation(userId: string): MultiWalletAggregation {
    return {
      userId,
      totalNetWorth: 0,
      delta24h: 0,
      walletCount: 0,
      exposureBreakdown: {
        byChain: {},
        byProtocol: {},
        byAssetType: {}
      },
      unifiedRiskScore: 0,
      topMovers: [],
      aggregatedPositions: [],
      aggregatedApprovals: [],
      aggregatedActions: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

export const multiWalletAggregationService = new MultiWalletAggregationService();
