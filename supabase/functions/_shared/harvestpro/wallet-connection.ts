/**
 * Wallet Connection and Data Sync Layer for HarvestPro (Edge Functions)
 * Manages wallet connections and transaction history fetching
 * 
 * Migrated from src/lib/harvestpro/wallet-connection.ts to Deno
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

export interface WalletTransaction {
  id: string;
  userId: string;
  walletAddress: string;
  token: string;
  transactionHash: string;
  transactionType: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  priceUsd: number;
  timestamp: string;
  createdAt: string;
}

export interface WalletConnectionInfo {
  address: string;
  label?: string;
  isConnected: boolean;
  lastSynced?: Date;
  transactionCount?: number;
}

export interface TransactionFetchParams {
  walletAddress: string;
  token?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface SyncResult {
  success: boolean;
  walletAddress: string;
  transactionsFetched: number;
  errors: string[];
  syncedAt: Date;
}

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
// SUPABASE CLIENT FACTORY
// ============================================================================

/**
 * Create Supabase client for Edge Functions
 * Uses Deno.env.get() instead of process.env
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// WALLET CONNECTION
// ============================================================================

/**
 * Get connected wallets for a user
 * 
 * Requirement 1.1: Display wallet connection interface
 */
export async function getConnectedWallets(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletConnectionInfo[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('wallet_address')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wallets: ${error.message}`);
  }

  // Get unique wallet addresses
  const uniqueAddresses = [...new Set(data?.map(row => row.wallet_address) || [])];

  return uniqueAddresses.map(address => ({
    address,
    isConnected: true,
    lastSynced: new Date(),
  }));
}

/**
 * Fetch transaction history for a wallet
 * 
 * Requirement 1.2: Fetch complete transaction history
 */
export async function fetchWalletTransactions(
  supabase: SupabaseClient,
  params: TransactionFetchParams
): Promise<WalletTransaction[]> {
  let query = supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_address', params.walletAddress.toLowerCase());

  if (params.token) {
    query = query.eq('token', params.token.toUpperCase());
  }

  if (params.startDate) {
    query = query.gte('timestamp', params.startDate.toISOString());
  }

  if (params.endDate) {
    query = query.lte('timestamp', params.endDate.toISOString());
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  query = query.order('timestamp', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    token: row.token,
    transactionHash: row.transaction_hash,
    transactionType: row.transaction_type,
    quantity: parseFloat(row.quantity),
    priceUsd: parseFloat(row.price_usd),
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
}

/**
 * Store wallet transactions in database
 * 
 * Requirement 1.2: Store transaction history
 */
export async function storeWalletTransactions(
  supabase: SupabaseClient,
  userId: string,
  transactions: Omit<WalletTransaction, 'id' | 'userId' | 'createdAt'>[]
): Promise<void> {
  const rows = transactions.map(tx => ({
    user_id: userId,
    wallet_address: tx.walletAddress.toLowerCase(),
    token: tx.token.toUpperCase(),
    transaction_hash: tx.transactionHash,
    transaction_type: tx.transactionType,
    quantity: tx.quantity,
    price_usd: tx.priceUsd,
    timestamp: tx.timestamp,
  }));

  const { error } = await supabase
    .from('wallet_transactions')
    .upsert(rows, {
      onConflict: 'transaction_hash,wallet_address',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Failed to store transactions: ${error.message}`);
  }
}

/**
 * Sync wallet data from blockchain
 * 
 * Requirement 1.2: Fetch and sync transaction history
 * 
 * Note: This is a placeholder that would integrate with blockchain APIs
 * (Alchemy, Etherscan, etc.) in production
 */
export async function syncWalletData(
  supabase: SupabaseClient,
  userId: string,
  walletAddress: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    walletAddress,
    transactionsFetched: 0,
    errors: [],
    syncedAt: new Date(),
  };

  try {
    // In production, this would call blockchain APIs
    // For now, we'll just verify the wallet exists in our database
    const transactions = await fetchWalletTransactions(supabase, { walletAddress });
    
    result.success = true;
    result.transactionsFetched = transactions.length;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

// ============================================================================
// MULTI-WALLET SUPPORT
// ============================================================================

/**
 * Aggregate transactions from multiple wallets
 * 
 * Requirement 1.5: Aggregate data from all sources
 */
export async function aggregateMultiWalletTransactions(
  supabase: SupabaseClient,
  userId: string,
  walletAddresses: string[],
  token?: string
): Promise<WalletTransaction[]> {
  let query = supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .in('wallet_address', walletAddresses.map(addr => addr.toLowerCase()));

  if (token) {
    query = query.eq('token', token.toUpperCase());
  }

  query = query.order('timestamp', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to aggregate transactions: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    token: row.token,
    transactionHash: row.transaction_hash,
    transactionType: row.transaction_type,
    quantity: parseFloat(row.quantity),
    priceUsd: parseFloat(row.price_usd),
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
}

/**
 * Get transaction summary by token across all wallets
 */
export async function getTokenSummary(
  supabase: SupabaseClient,
  userId: string,
  walletAddresses: string[]
): Promise<Map<string, { totalBuys: number; totalSells: number; netPosition: number }>> {
  const transactions = await aggregateMultiWalletTransactions(supabase, userId, walletAddresses);
  
  const summary = new Map<string, { totalBuys: number; totalSells: number; netPosition: number }>();
  
  for (const tx of transactions) {
    const current = summary.get(tx.token) || { totalBuys: 0, totalSells: 0, netPosition: 0 };
    
    if (tx.transactionType === 'buy' || tx.transactionType === 'transfer_in') {
      current.totalBuys += tx.quantity;
      current.netPosition += tx.quantity;
    } else if (tx.transactionType === 'sell' || tx.transactionType === 'transfer_out') {
      current.totalSells += tx.quantity;
      current.netPosition -= tx.quantity;
    }
    
    summary.set(tx.token, current);
  }
  
  return summary;
}

/**
 * Get list of tokens held across all wallets
 */
export async function getHeldTokens(
  supabase: SupabaseClient,
  userId: string,
  walletAddresses: string[]
): Promise<string[]> {
  const summary = await getTokenSummary(supabase, userId, walletAddresses);
  
  // Return only tokens with positive net position
  return Array.from(summary.entries())
    .filter(([_, data]) => data.netPosition > 0)
    .map(([token]) => token);
}

// ============================================================================
// WALLET VALIDATION
// ============================================================================

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  // Basic Ethereum address validation (0x + 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize wallet address to lowercase
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Check if wallet has any transactions
 */
export async function hasTransactions(
  supabase: SupabaseClient,
  userId: string,
  walletAddress: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error) {
    throw new Error(`Failed to check transactions: ${error.message}`);
  }

  return (count || 0) > 0;
}

// ============================================================================
// UNIFIED DATA AGGREGATION (Requirement 1.5)
// ============================================================================

/**
 * Get all data sources for a user
 * 
 * Requirement 1.5: Aggregate data from all sources
 */
export async function getAllDataSources(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  wallets: string[];
  cexAccounts: string[];
}> {
  // Get unique wallet addresses
  const { data: walletData, error: walletError } = await supabase
    .from('wallet_transactions')
    .select('wallet_address')
    .eq('user_id', userId);

  if (walletError) {
    throw new Error(`Failed to fetch wallet sources: ${walletError.message}`);
  }

  const wallets = [...new Set(walletData?.map(row => row.wallet_address) || [])];

  // Get CEX account IDs
  const { data: cexData, error: cexError } = await supabase
    .from('cex_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (cexError) {
    throw new Error(`Failed to fetch CEX sources: ${cexError.message}`);
  }

  const cexAccounts = cexData?.map(row => row.id) || [];

  return { wallets, cexAccounts };
}

/**
 * Get aggregated data summary for a user
 * 
 * Requirement 1.5: Unified view of all sources
 */
export async function getAggregatedDataSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<AggregatedDataSummary> {
  const sources = await getAllDataSources(supabase, userId);
  
  // Get wallet transaction count
  const { count: walletTxCount, error: walletTxError } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (walletTxError) {
    throw new Error(`Failed to count wallet transactions: ${walletTxError.message}`);
  }

  // Get CEX transaction count
  const { count: cexTxCount, error: cexTxError } = await supabase
    .from('cex_trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (cexTxError) {
    throw new Error(`Failed to count CEX transactions: ${cexTxError.message}`);
  }

  // Get unique tokens
  const { data: walletTokens, error: walletTokensError } = await supabase
    .from('wallet_transactions')
    .select('token')
    .eq('user_id', userId);

  if (walletTokensError) {
    throw new Error(`Failed to fetch wallet tokens: ${walletTokensError.message}`);
  }

  const { data: cexTokens, error: cexTokensError } = await supabase
    .from('cex_trades')
    .select('token')
    .eq('user_id', userId);

  if (cexTokensError) {
    throw new Error(`Failed to fetch CEX tokens: ${cexTokensError.message}`);
  }

  const uniqueTokens = [
    ...new Set([
      ...(walletTokens?.map(row => row.token) || []),
      ...(cexTokens?.map(row => row.token) || []),
    ]),
  ];

  return {
    totalSources: sources.wallets.length + sources.cexAccounts.length,
    walletSources: sources.wallets.length,
    cexSources: sources.cexAccounts.length,
    totalTransactions: (walletTxCount || 0) + (cexTxCount || 0),
    walletTransactions: walletTxCount || 0,
    cexTransactions: cexTxCount || 0,
    uniqueTokens,
  };
}
