/**
 * CEX Integration Layer for HarvestPro
 * Manages centralized exchange account linking and trade history
 */

import type { CexAccount, CexTrade } from '@/types/harvestpro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CexConnectionInfo {
  id: string;
  exchangeName: string;
  isActive: boolean;
  lastSynced?: Date;
  tradeCount?: number;
}

export interface CexCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface CexSyncResult {
  success: boolean;
  exchangeName: string;
  tradesFetched: number;
  errors: string[];
  syncedAt: Date;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// ENCRYPTION (Requirement 1.4)
// ============================================================================

const ENCRYPTION_KEY = import.meta.env.VITE_CEX_ENCRYPTION_KEY || 'default-key-for-dev';

/**
 * Encrypt API credentials using AES-256-GCM
 * 
 * Requirement 1.4: Encrypt and store API credentials
 */
export function encryptCredential(plaintext: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt API credentials
 */
export function decryptCredential(ciphertext: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}


// ============================================================================
// CEX ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Link a CEX account
 * 
 * Requirement 1.3: Link CEX account with read-only API credentials
 */
export async function linkCexAccount(
  userId: string,
  exchangeName: string,
  credentials: CexCredentials
): Promise<CexAccount> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Encrypt credentials
  const apiKeyEncrypted = encryptCredential(credentials.apiKey);
  const apiSecretEncrypted = encryptCredential(credentials.apiSecret);

  const { data, error } = await supabase
    .from('cex_accounts')
    .insert({
      user_id: userId,
      exchange_name: exchangeName,
      api_key_encrypted: apiKeyEncrypted,
      api_secret_encrypted: apiSecretEncrypted,
      is_active: true,
      last_synced_at: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link CEX account: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    exchangeName: data.exchange_name,
    apiKeyEncrypted: data.api_key_encrypted,
    apiSecretEncrypted: data.api_secret_encrypted,
    isActive: data.is_active,
    lastSyncedAt: data.last_synced_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get linked CEX accounts for a user
 */
export async function getCexAccounts(userId: string): Promise<CexConnectionInfo[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('cex_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch CEX accounts: ${error.message}`);
  }

  return (data || []).map(account => ({
    id: account.id,
    exchangeName: account.exchange_name,
    isActive: account.is_active,
    lastSynced: account.last_synced_at ? new Date(account.last_synced_at) : undefined,
  }));
}

/**
 * Deactivate a CEX account
 */
export async function deactivateCexAccount(accountId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('cex_accounts')
    .update({ is_active: false })
    .eq('id', accountId);

  if (error) {
    throw new Error(`Failed to deactivate CEX account: ${error.message}`);
  }
}

// ============================================================================
// TRADE HISTORY
// ============================================================================

/**
 * Fetch trade history for a CEX account
 * 
 * Requirement 1.3: Retrieve trade history, deposits, withdrawals, and balances
 */
export async function fetchCexTrades(
  accountId: string,
  token?: string
): Promise<CexTrade[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  let query = supabase
    .from('cex_trades')
    .select('*')
    .eq('cex_account_id', accountId);

  if (token) {
    query = query.eq('token', token.toUpperCase());
  }

  query = query.order('timestamp', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch CEX trades: ${error.message}`);
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

/**
 * Store CEX trades in database
 */
export async function storeCexTrades(
  accountId: string,
  userId: string,
  trades: Omit<CexTrade, 'id' | 'cexAccountId' | 'userId' | 'createdAt'>[]
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const rows = trades.map(trade => ({
    cex_account_id: accountId,
    user_id: userId,
    token: trade.token.toUpperCase(),
    trade_type: trade.tradeType,
    quantity: trade.quantity,
    price_usd: trade.priceUsd,
    timestamp: trade.timestamp,
  }));

  const { error } = await supabase
    .from('cex_trades')
    .upsert(rows, {
      onConflict: 'cex_account_id,token,timestamp',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Failed to store CEX trades: ${error.message}`);
  }
}


// ============================================================================
// DATA AGGREGATION (Requirement 1.5)
// ============================================================================

/**
 * Aggregate trades from all CEX accounts
 * 
 * Requirement 1.5: Aggregate data from all sources into unified view
 */
export async function aggregateCexTrades(
  userId: string,
  token?: string
): Promise<CexTrade[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

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

/**
 * Get CEX holdings summary
 */
export async function getCexHoldingsSummary(
  userId: string
): Promise<Map<string, { totalBuys: number; totalSells: number; netPosition: number }>> {
  const trades = await aggregateCexTrades(userId);
  
  const summary = new Map<string, { totalBuys: number; totalSells: number; netPosition: number }>();
  
  for (const trade of trades) {
    const current = summary.get(trade.token) || { totalBuys: 0, totalSells: 0, netPosition: 0 };
    
    if (trade.tradeType === 'buy') {
      current.totalBuys += trade.quantity;
      current.netPosition += trade.quantity;
    } else if (trade.tradeType === 'sell') {
      current.totalSells += trade.quantity;
      current.netPosition -= trade.quantity;
    }
    
    summary.set(trade.token, current);
  }
  
  return summary;
}

// ============================================================================
// CEX SYNC
// ============================================================================

/**
 * Sync CEX account data
 * 
 * Note: This is a placeholder that would integrate with CEX APIs
 * (Binance, Coinbase, Kraken) in production
 */
export async function syncCexAccount(
  accountId: string,
  userId: string
): Promise<CexSyncResult> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const result: CexSyncResult = {
    success: false,
    exchangeName: '',
    tradesFetched: 0,
    errors: [],
    syncedAt: new Date(),
  };

  try {
    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('cex_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (accountError || !account) {
      throw new Error('CEX account not found');
    }

    result.exchangeName = account.exchange_name;

    // In production, this would call CEX APIs
    // For now, we'll just verify the account exists
    const trades = await fetchCexTrades(accountId);
    
    // Update last synced timestamp
    await supabase
      .from('cex_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', accountId);

    result.success = true;
    result.tradesFetched = trades.length;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Sync all CEX accounts for a user
 */
export async function syncAllCexAccounts(userId: string): Promise<CexSyncResult[]> {
  const accounts = await getCexAccounts(userId);
  
  const results = await Promise.all(
    accounts.map(account => syncCexAccount(account.id, userId))
  );
  
  return results;
}

// ============================================================================
// SUPPORTED EXCHANGES
// ============================================================================

export const SUPPORTED_EXCHANGES = [
  'Binance',
  'Coinbase',
  'Kraken',
  'Gemini',
  'Bitfinex',
] as const;

export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

/**
 * Check if exchange is supported
 */
export function isSupportedExchange(exchangeName: string): boolean {
  return SUPPORTED_EXCHANGES.includes(exchangeName as SupportedExchange);
}

/**
 * Get exchange display name
 */
export function getExchangeDisplayName(exchangeName: string): string {
  return exchangeName;
}

/**
 * Get exchange logo URL
 */
export function getExchangeLogoUrl(exchangeName: string): string {
  const logos: Record<string, string> = {
    'Binance': '/partners/binance-logo.png',
    'Coinbase': '/partners/coinbase-logo.png',
    'Kraken': '/partners/kraken-logo.png',
    'Gemini': '/partners/gemini-logo.png',
    'Bitfinex': '/partners/bitfinex-logo.png',
  };
  
  return logos[exchangeName] || '/partners/default-exchange.png';
}
