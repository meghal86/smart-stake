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
): Promise<any> {
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

