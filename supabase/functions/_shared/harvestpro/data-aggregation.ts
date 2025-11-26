/**
 * Data Aggregation Module for HarvestPro (Deno/Edge Functions)
 * Combines wallet and CEX data into unified views
 * 
 * Requirement 1.5: Aggregate data from all sources into unified view
 * 
 * Migrated from src/lib/harvestpro/data-aggregation.ts
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { 
  UnifiedTransaction, 
  AggregatedDataSummary 
} from './wallet-connection.ts';
import type { CexTrade } from './cex-integration.ts';
import { 
  aggregateMultiWalletTransactions, 
  getAllDataSources 
} from './wallet-connection.ts';

// ============================================================================
// SUPABASE CLIENT FACTORY
// ============================================================================

/**
 * Create Supabase client for Edge Functions
 */
function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch CEX trades for a user
 * This is a local implementation to avoid circular dependencies
 */
async function fetchCexTradesForUser(
  supabase: SupabaseClient,
  userId: string,
  token?: string
): Promise<CexTrade[]> {
  let query = supabase
    .from('cex_trades')
    .select('*')
    .eq('user_id', userId);

  if (token) {
    query = query.eq('token', token.toUpperCase());
  }

  query = query.order('timestamp', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to aggregate CEX trades: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    cexAccountId: row.cex_account_id,
    userId: row.user_id,
    token: row.token,
    tradeType: row.trade_type,
    quantity: parseFloat(row.quantity),
    priceUsd: parseFloat(row.price_usd),
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
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
  supabase: SupabaseClient,
  userId: string,
  token?: string
): Promise<UnifiedTransaction[]> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(supabase, userId);

  // Fetch wallet transactions
  const walletTxs = wallets.length > 0
    ? await aggregateMultiWalletTransactions(supabase, userId, wallets, token)
    : [];

  // Fetch CEX trades
  const cexTrades = await fetchCexTradesForUser(supabase, userId, token);

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
  supabase: SupabaseClient,
  userId: string
): Promise<AggregatedDataSummary> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(supabase, userId);

  // Get all transactions
  const allTransactions = await aggregateAllTransactions(supabase, userId);

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
  supabase: SupabaseClient,
  userId: string
): Promise<{
  complete: boolean;
  expectedSources: number;
  actualSources: number;
  missingSources: string[];
}> {
  // Get all data sources
  const { wallets, cexAccounts } = await getAllDataSources(supabase, userId);
  const expectedSources = wallets.length + cexAccounts.length;

  // Get aggregated transactions
  const allTransactions = await aggregateAllTransactions(supabase, userId);

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
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, UnifiedTransaction[]>> {
  const allTransactions = await aggregateAllTransactions(supabase, userId);
  
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
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, { 
  totalBuys: number; 
  totalSells: number; 
  netPosition: number;
  sources: Set<string>;
}>> {
  const allTransactions = await aggregateAllTransactions(supabase, userId);
  
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
