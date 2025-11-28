/**
 * Guardian API client for frontend
 * Calls Supabase Edge Functions
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL not set, Guardian API calls may fail');
}

const GUARDIAN_BASE_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Scan a wallet address
 */
export async function scanWallet(
  walletAddress: string,
  network: string
): Promise<{ trust_score: number; flags: unknown[]; scan_timestamp: string }> {
  const response = await fetch(`${GUARDIAN_BASE_URL}/guardian-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      network,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get revoke transaction data
 */
export async function getRevokeTransaction(
  token: string,
  spender: string,
  user: string,
  chain: string
): Promise<{ to: string; data: string; value: string }> {
  const response = await fetch(`${GUARDIAN_BASE_URL}/guardian-revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      spender,
      user,
      chain,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Check Guardian health
 */
export async function checkHealth(): Promise<{
  ok: boolean;
  latestEventAgeSec: number;
  checks: { alchemy: boolean; etherscan: boolean; db: boolean };
}> {
  const response = await fetch(`${GUARDIAN_BASE_URL}/guardian-healthz`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Health check failed: HTTP ${response.status}`);
  }

  return response.json();
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addWallet(params: {
  address: string;
  alias?: string;
  wallet_type: 'browser' | 'mobile' | 'hardware' | 'exchange' | 'smart' | 'social' | 'readonly';
  ens_name?: string;
  user_id: string;
}) {
  const { address, alias, wallet_type, ens_name, user_id } = params;

  // Check for existing wallet
  const { data: existing } = await supabase
    .from('guardian_wallets')
    .select('id')
    .eq('address', address.toLowerCase())
    .eq('user_id', user_id)
    .single();

  if (existing) {
    throw new Error('Wallet already added');
  }

  // Insert new wallet
  const { data: wallet, error } = await supabase
    .from('guardian_wallets')
    .insert({
      user_id,
      address: address.toLowerCase(),
      alias: alias || null,
      wallet_type,
      ens_name: ens_name || null,
      status: wallet_type === 'browser' ? 'connected' : 'readonly',
      added_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Log the action
  await supabase.from('guardian_logs').insert({
    user_id,
    event_type: 'wallet_add',
    metadata: {
      address: address.toLowerCase(),
      wallet_type,
      alias,
      ens_name,
    },
  });

  return wallet;
}

export async function scanWallet(address: string, user_id: string) {
  // Trigger scan via edge function
  const { data, error } = await supabase.functions.invoke('guardian-scan-v2', {
    body: { address: address.toLowerCase(), user_id }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resolveENS(input: string) {
  if (!input.endsWith('.eth')) {
    return { address: input, ens_name: null };
  }

  // In production, use Viem to resolve ENS
  // For now, return placeholder
  return { address: input, ens_name: input };
}