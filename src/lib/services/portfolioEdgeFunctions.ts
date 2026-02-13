/**
 * Portfolio Edge Functions Service
 * 
 * Client-side functions for calling Supabase Edge Functions
 * related to portfolio data.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client for browser-side calls
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // SSR context
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
};

export interface WalletTransaction {
  id: string;
  hash: string;
  timestamp: Date;
  type: 'swap' | 'approval' | 'transfer' | 'mint' | 'burn' | 'other';
  from: string;
  to: string;
  value: number;
  gasUsed: number;
  gasPrice: number;
  status: 'success' | 'failed' | 'pending';
  aiTags?: string[];
  riskScore?: number;
  description?: string;
}

/**
 * Fetch wallet transactions from database
 * 
 * @param walletAddress - Wallet address to fetch transactions for
 * @param limit - Maximum number of transactions to fetch (default: 50)
 * @returns Array of wallet transactions
 */
export async function fetchWalletTransactions(
  walletAddress: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available (SSR context)');
      return [];
    }

    // Query transactions from database
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }

    // Transform database records to WalletTransaction format
    return (data || []).map(tx => ({
      id: tx.id,
      hash: tx.transaction_hash,
      timestamp: new Date(tx.timestamp),
      type: tx.transaction_type || 'other',
      from: tx.from_address,
      to: tx.to_address,
      value: tx.value_usd || 0,
      gasUsed: tx.gas_used || 0,
      gasPrice: tx.gas_price || 0,
      status: tx.status || 'success',
      aiTags: tx.ai_tags || [],
      riskScore: tx.risk_score || 0,
      description: tx.description || ''
    }));
  } catch (error) {
    console.error('Failed to fetch wallet transactions:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

/**
 * Fetch portfolio positions from Edge Function
 * 
 * @param userId - User ID
 * @param walletAddress - Optional wallet address for filtering
 * @returns Portfolio positions data
 */
export async function fetchPortfolioPositions(
  userId: string,
  walletAddress?: string
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.functions.invoke('portfolio-positions', {
      body: { userId, walletAddress }
    });

    if (error) {
      console.error('Error fetching portfolio positions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch portfolio positions:', error);
    throw error;
  }
}

/**
 * Run stress test simulation via Edge Function
 * 
 * @param scenarios - Stress test scenarios
 * @param portfolioValue - Current portfolio value
 * @returns Stress test results
 */
export async function runStressTest(
  scenarios: Record<string, number>,
  portfolioValue: number
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.functions.invoke('portfolio-stress-test', {
      body: { scenarios, portfolioValue }
    });

    if (error) {
      console.error('Error running stress test:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to run stress test:', error);
    throw error;
  }
}

/**
 * Fetch flow graph data for wallet interactions
 * 
 * @param walletAddress - Wallet address
 * @returns Flow graph nodes and edges
 */
export async function fetchFlowGraph(walletAddress: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.functions.invoke('portfolio-flow-graph', {
      body: { walletAddress }
    });

    if (error) {
      console.error('Error fetching flow graph:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch flow graph:', error);
    throw error;
  }
}

/**
 * Fetch execution receipts for portfolio actions
 * 
 * @param userId - User ID
 * @param limit - Maximum number of receipts to fetch
 * @returns Array of execution receipts
 */
export async function fetchExecutionReceipts(
  userId: string,
  limit: number = 20
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available (SSR context)');
      return [];
    }

    const { data, error } = await supabase
      .from('execution_receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching execution receipts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch execution receipts:', error);
    return [];
  }
}
