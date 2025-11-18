/**
 * Data Aggregation Module for HarvestPro
 * Combines wallet and CEX data into unified views
 * 
 * Requirement 1.5: Aggregate data from all sources into unified view
 */

import type { WalletTransaction, CexTrade } from '@/types/harvestpro';
import { aggregateMultiWalletTransactions, getAllDataSources } from './wallet-connection';
import { aggregateCexTrades } from './cex-integration';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedTransaction {
  id: string;
  source: 'wallet' | 'cex';
  sourceIdentifier: string; // wallet address or CEX account ID
  token: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  priceUsd: number;
  timestamp: string;
}

export interface AggregatedDataSummary {
  totalSources: number;
  walletSources: number;
  cexSources: number;
  totalTransactions: number;
  walletTransactions: number;
  cexTransactions: number;
  uniqueTokens: string[];
}

// ============================================================================
// UNIFIED DATA AGGREGATION
// ============================================================================

/**
 * Aggregate all transactions from wallets and CEX accounts into unified view
 * 
 * Property 18: Data Aggregation Completeness
 * For any user with N connected wallets and M CEX accounts, the unified view
 * SHALL include data from all N+M sources.
 * 
 * Requirement 1.5: Aggregate data from all sources into unified view
 */
export async function aggregateAllTransactions(
  userId: string,
  token?: string
): Promise<UnifiedTransaction[]> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(userId);

  // Fetch wallet transactions
  const walletTxs = wallets.length > 0
    ? await aggregateMultiWalletTransactions(userId, wallets, token)
    : [];

  // Fetch CEX trades
  const cexTrades = await aggregateCexTrades(userId, token);

  // Convert to unified format
  const unifiedWalletTxs: UnifiedTransaction[] = walletTxs.map(tx => ({
    id: tx.id,
    source: 'wallet' as const,
    sourceIdentifier: tx.walletAddress,
    token: tx.token,
    type: tx.transactionType,
    quantity: tx.quantity,
    priceUsd: tx.priceUsd,
    timestamp: tx.timestamp,
  }));

  const unifiedCexTrades: UnifiedTransaction[] = cexTrades.map(trade => ({
    id: trade.id,
    source: 'cex' as const,
    sourceIdentifier: trade.cexAccountId,
    token: trade.token,
    type: trade.tradeType,
    quantity: trade.quantity,
    priceUsd: trade.priceUsd,
    timestamp: trade.timestamp,
  }));

  // Combine and sort by timestamp
  const allTransactions = [...unifiedWalletTxs, ...unifiedCexTrades];
  allTransactions.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return allTransactions;
}

/**
 * Get summary of aggregated data
 * 
 * Requirement 1.5: Aggregate data from all sources
 */
export async function getAggregatedDataSummary(
  userId: string
): Promise<AggregatedDataSummary> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(userId);

  // Get all transactions
  const allTransactions = await aggregateAllTransactions(userId);

  // Count transactions by source
  const walletTransactions = allTransactions.filter(tx => tx.source === 'wallet');
  const cexTransactions = allTransactions.filter(tx => tx.source === 'cex');

  // Get unique tokens
  const uniqueTokens = [...new Set(allTransactions.map(tx => tx.token))];

  return {
    totalSources: wallets.length + cexAccounts.length,
    walletSources: wallets.length,
    cexSources: cexAccounts.length,
    totalTransactions: allTransactions.length,
    walletTransactions: walletTransactions.length,
    cexTransactions: cexTransactions.length,
    uniqueTokens,
  };
}

/**
 * Verify that all sources are included in aggregated data
 * 
 * This function is used for testing Property 18
 */
export async function verifyDataAggregationCompleteness(
  userId: string
): Promise<{
  complete: boolean;
  expectedSources: number;
  actualSources: number;
  missingSources: string[];
}> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(userId);
  const expectedSources = wallets.length + cexAccounts.length;

  // Get aggregated transactions
  const allTransactions = await aggregateAllTransactions(userId);

  // Get unique sources from transactions
  const actualSources = new Set(allTransactions.map(tx => tx.sourceIdentifier));
  const actualSourceCount = actualSources.size;

  // Find missing sources
  const allExpectedSources = [...wallets, ...cexAccounts];
  const missingSources = allExpectedSources.filter(
    source => !actualSources.has(source)
  );

  return {
    complete: actualSourceCount === expectedSources && missingSources.length === 0,
    expectedSources,
    actualSources: actualSourceCount,
    missingSources,
  };
}

/**
 * Get transactions grouped by source
 */
export async function getTransactionsBySource(
  userId: string
): Promise<Map<string, UnifiedTransaction[]>> {
  const allTransactions = await aggregateAllTransactions(userId);
  
  const bySource = new Map<string, UnifiedTransaction[]>();
  
  for (const tx of allTransactions) {
    const existing = bySource.get(tx.sourceIdentifier) || [];
    existing.push(tx);
    bySource.set(tx.sourceIdentifier, existing);
  }
  
  return bySource;
}

/**
 * Get holdings summary across all sources
 */
export async function getUnifiedHoldingsSummary(
  userId: string
): Promise<Map<string, { 
  totalBuys: number; 
  totalSells: number; 
  netPosition: number;
  sources: Set<string>;
}>> {
  const allTransactions = await aggregateAllTransactions(userId);
  
  const summary = new Map<string, { 
    totalBuys: number; 
    totalSells: number; 
    netPosition: number;
    sources: Set<string>;
  }>();
  
  for (const tx of allTransactions) {
    const current = summary.get(tx.token) || { 
      totalBuys: 0, 
      totalSells: 0, 
      netPosition: 0,
      sources: new Set<string>(),
    };
    
    // Track which sources have this token
    current.sources.add(tx.sourceIdentifier);
    
    if (tx.type === 'buy' || tx.type === 'transfer_in') {
      current.totalBuys += tx.quantity;
      current.netPosition += tx.quantity;
    } else if (tx.type === 'sell' || tx.type === 'transfer_out') {
      current.totalSells += tx.quantity;
      current.netPosition -= tx.quantity;
    }
    
    summary.set(tx.token, current);
  }
  
  return summary;
}
