/**
 * Guardian Service
 *
 * Provides security scanning and risk assessment functionality.
 * Calls the guardian-scan-v2 edge function for real security data.
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildDemoGuardianPayload,
  normalizeGuardianScanPayload,
  type GuardianNormalizedScanResult,
  type GuardianFinding,
} from '@/lib/guardian/scan-contract';
import { env } from '@/lib/env';

export interface GuardianScanRequest {
  walletAddress: string;
  network: string;
}

export type GuardianFlag = GuardianFinding;
export type GuardianScanResult = GuardianNormalizedScanResult;

export interface GuardianRevokeRequest {
  wallet: string;
  approvals: Array<{
    token: string;
    spender: string;
  }>;
  network: string;
  dry_run?: boolean;
}

export interface GuardianRevokeResponse {
  gas_estimate?: {
    total_gas: number;
  };
  [key: string]: unknown;
}

let guardianSupabaseClient:
  | ReturnType<typeof createClient>
  | null = null;

function getSupabaseClient() {
  if (!guardianSupabaseClient) {
    guardianSupabaseClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return guardianSupabaseClient;
}

/**
 * Request Guardian security scan for a wallet.
 */
export async function requestGuardianScan(request: GuardianScanRequest): Promise<GuardianScanResult> {
  console.log('🛡️ [Guardian] Attempting to call guardian-scan-v2 edge function for:', request.walletAddress);

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('guardian-scan-v2', {
    body: {
      wallet_address: request.walletAddress,
      network: request.network,
    },
  });

  if (error) {
    console.error('❌ [Guardian] Edge function error:', error);
    throw new Error(error.message || 'Guardian scan is currently unavailable.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Guardian scan returned an invalid response.');
  }

  console.log('✅ [Guardian] Received REAL scan data:', data);

  return normalizeGuardianScanPayload(data, {
    walletAddress: request.walletAddress,
    network: request.network,
    dataSource: 'live',
  });
}

export async function requestGuardianRevoke(request: GuardianRevokeRequest): Promise<GuardianRevokeResponse> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('guardian-revoke', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Guardian revoke is currently unavailable.');
  }

  return (data || {}) as GuardianRevokeResponse;
}

export function buildDemoGuardianScanResult(walletAddress: string): GuardianScanResult {
  return normalizeGuardianScanPayload(buildDemoGuardianPayload(walletAddress), {
    walletAddress,
    network: 'ethereum',
    dataSource: 'demo',
  });
}
