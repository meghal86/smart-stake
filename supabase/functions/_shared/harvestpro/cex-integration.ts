/**
 * CEX Integration Layer for HarvestPro (Deno/Edge Functions)
 * Manages centralized exchange account linking and trade history
 * 
 * Migrated from src/lib/harvestpro/cex-integration.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

export interface CexAccount {
  id: string;
  userId: string;
  exchangeName: string;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CexTrade {
  id: string;
  cexAccountId: string;
  userId: string;
  token: string;
  tradeType: 'buy' | 'sell';
  quantity: number;
  priceUsd: number;
  timestamp: string;
  createdAt: string;
}

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
// ENCRYPTION (Requirement 1.4)
// ============================================================================

/**
 * Encrypt API credentials using Web Crypto API (AES-256-GCM)
 * 
 * Requirement 1.4: Encrypt and store API credentials
 */
export async function encryptCredential(plaintext: string): Promise<string> {
  const encryptionKey = Deno.env.get('CEX_ENCRYPTION_KEY') || 'default-key-for-dev';
  
  // Derive key from password using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(encryptionKey)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Convert to hex strings
  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const encryptedHex = Array.from(new Uint8Array(encrypted))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${ivHex}:${encryptedHex}`;
}

/**
 * Decrypt API credentials using Web Crypto API
 */
export async function decryptCredential(ciphertext: string): Promise<string> {
  const encryptionKey = Deno.env.get('CEX_ENCRYPTION_KEY') || 'default-key-for-dev';
  
  const [ivHex, encryptedHex] = ciphertext.split(':');
  
  // Convert hex strings to Uint8Array
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const encrypted = new Uint8Array(
    encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Derive key from password using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(encryptionKey)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
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
  const supabase = getSupabaseClient();

  // Encrypt credentials
  const apiKeyEncrypted = await encryptCredential(credentials.apiKey);
  const apiSecretEncrypted = await encryptCredential(credentials.apiSecret);

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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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
// CEX API INTEGRATION (Production)
// ============================================================================

/**
 * Sign request for CEX API using HMAC-SHA256
 * 
 * This uses Deno's Web Crypto API for signing
 */
export async function signCexRequest(
  secret: string,
  message: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import secret as HMAC key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the message
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Call Binance API
 * 
 * Example implementation for production use
 */
export async function callBinanceApi(
  apiKey: string,
  apiSecret: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const baseUrl = 'https://api.binance.com';
  
  // Add timestamp
  const timestamp = Date.now().toString();
  params.timestamp = timestamp;
  
  // Create query string
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Sign request
  const signature = await signCexRequest(apiSecret, queryString);
  
  // Make request
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  const response = await fetch(url, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Call Coinbase API
 * 
 * Example implementation for production use
 */
export async function callCoinbaseApi(
  apiKey: string,
  apiSecret: string,
  endpoint: string,
  method: string = 'GET',
  body?: string
): Promise<unknown> {
  const baseUrl = 'https://api.coinbase.com';
  
  // Create signature
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method + endpoint + (body || '');
  const signature = await signCexRequest(apiSecret, message);
  
  // Make request
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    },
    body: body || undefined,
  });
  
  if (!response.ok) {
    throw new Error(`Coinbase API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Call Kraken API
 * 
 * Example implementation for production use
 */
export async function callKrakenApi(
  apiKey: string,
  apiSecret: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const baseUrl = 'https://api.kraken.com';
  
  // Add nonce
  const nonce = Date.now().toString();
  params.nonce = nonce;
  
  // Create POST data
  const postData = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Create signature (Kraken uses base64-encoded HMAC-SHA512)
  const encoder = new TextEncoder();
  const message = nonce + postData;
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  
  const secretDecoded = atob(apiSecret);
  const secretBytes = new Uint8Array(secretDecoded.length);
  for (let i = 0; i < secretDecoded.length; i++) {
    secretBytes[i] = secretDecoded.charCodeAt(i);
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const pathBytes = encoder.encode(endpoint);
  const messageBytes = new Uint8Array(pathBytes.length + hash.byteLength);
  messageBytes.set(pathBytes);
  messageBytes.set(new Uint8Array(hash), pathBytes.length);
  
  const signature = await crypto.subtle.sign('HMAC', key, messageBytes);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  // Make request
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signatureBase64,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: postData,
  });
  
  if (!response.ok) {
    throw new Error(`Kraken API error: ${response.statusText}`);
  }
  
  return await response.json();
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
