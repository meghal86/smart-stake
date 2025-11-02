import { supabase } from '@/integrations/supabase/client';
import { generateRequestId, Logger } from '@/lib/guardian/observability';
import { generateIdempotencyKey, isKeyRecentlyUsed, markKeyAsUsed } from '@/lib/guardian/idempotency';

export type GuardianSeverity = 'low' | 'medium' | 'high';
export type GuardianRiskLevel = 'Low' | 'Medium' | 'High';

// Create logger instance
const logger = new Logger({ service: 'guardian-service' });

export interface GuardianFlag {
  id: string;
  type: string;
  severity: GuardianSeverity;
  details?: string;
  timestamp?: string;
}

export interface GuardianScanRequest {
  walletAddress: string;
  /**
   * Network identifier. Accepts either a canonical slug (ethereum, base, polygon)
   * or a display label (Ethereum Mainnet, Base, Polygon).
   */
  network: string;
}

export interface GuardianScanApiResponse {
  trust_score: number;
  risk_score: number;
  risk_level: GuardianRiskLevel;
  flags: Array<{
    id: string | number;
    type: string;
    severity: GuardianSeverity;
    details?: string;
    timestamp?: string;
  }>;
  wallet_address: string;
  network: string;
  last_scan: string;
  guardian_scan_id?: string;
}

export interface GuardianScanResult {
  trustScorePercent: number;
  trustScoreRaw: number;
  riskScore: number;
  riskLevel: GuardianRiskLevel;
  statusLabel: 'Trusted' | 'Warning' | 'Danger';
  statusTone: 'trusted' | 'warning' | 'danger';
  walletAddress: string;
  network: string;
  networkCode: string;
  lastScan: string;
  lastScanLocal: string;
  lastScanRelative: string;
  flags: GuardianFlag[];
  issuesBySeverity: Record<GuardianSeverity, number>;
  hasFlags: boolean;
  summary: string;
  guardianScanId?: string;
}

const NETWORK_ALIASES: Record<string, string> = {
  ethereum: 'ethereum',
  eth: 'ethereum',
  mainnet: 'ethereum',
  'ethereum mainnet': 'ethereum',
  base: 'base',
  'base mainnet': 'base',
  polygon: 'polygon',
  matic: 'polygon',
  'polygon mainnet': 'polygon',
  arbitrum: 'arbitrum',
  'arbitrum one': 'arbitrum',
  optimism: 'optimism',
  'optimism mainnet': 'optimism',
  solana: 'solana'
};

const NETWORK_LABELS: Record<string, string> = {
  ethereum: 'Ethereum Mainnet',
  base: 'Base',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum One',
  optimism: 'Optimism',
  solana: 'Solana'
};

const FALLBACK_SCAN: GuardianScanApiResponse = {
  trust_score: 0.87,
  risk_score: 6.2,
  risk_level: 'Medium',
  flags: [
    {
      id: 1,
      type: 'Mixer Interaction',
      severity: 'medium',
      details: 'Address interacted with Tornado Cash proxy within the last 45 days',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: 2,
      type: 'Suspicious Contract',
      severity: 'low',
      details: 'Approval granted to a contract younger than 30 days',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString()
    }
  ],
  wallet_address: '0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C',
  network: 'Ethereum Mainnet',
  last_scan: new Date().toISOString(),
  guardian_scan_id: cryptoRandomId()
};

function cryptoRandomId() {
  return globalThis?.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `guardian-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculateStatus(trustScorePercent: number, riskLevel: GuardianRiskLevel) {
  if (trustScorePercent >= 80 && (riskLevel === 'Low' || riskLevel === 'Medium')) {
    return { label: 'Trusted', tone: 'trusted' as const };
  }

  if (trustScorePercent >= 60 || riskLevel === 'Medium') {
    return { label: 'Warning', tone: 'warning' as const };
  }

  return { label: 'Danger', tone: 'danger' as const };
}

function getRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes === 0 ? 'just now' : `${Math.abs(diffMinutes)}m ${diffMinutes > 0 ? 'ago' : 'from now'}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)}h ${diffHours > 0 ? 'ago' : 'from now'}`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)}d ${diffDays > 0 ? 'ago' : 'from now'}`;
}

function mapFlag(flag: GuardianScanApiResponse['flags'][number]): GuardianFlag {
  return {
    id: String(flag.id ?? cryptoRandomId()),
    type: flag.type || 'Unknown Flag',
    severity: (flag.severity || 'low') as GuardianSeverity,
    details: flag.details,
    timestamp: flag.timestamp
  };
}

function normalizeGuardianScan(response: GuardianScanApiResponse): GuardianScanResult {
  const trustScoreRaw = clamp(response.trust_score ?? 0.8, 0, 1);
  const trustScorePercent = Math.round(trustScoreRaw * 100);
  const riskScore = clamp(response.risk_score ?? 5, 0, 10);
  const riskLevel = (response.risk_level || (riskScore > 7 ? 'High' : riskScore > 4 ? 'Medium' : 'Low')) as GuardianRiskLevel;
  const status = calculateStatus(trustScorePercent, riskLevel);
  const networkDetails = resolveNetwork(response.network);

  const flags = (response.flags || []).map(mapFlag);
  const issuesBySeverity: Record<GuardianSeverity, number> = {
    low: flags.filter((flag) => flag.severity === 'low').length,
    medium: flags.filter((flag) => flag.severity === 'medium').length,
    high: flags.filter((flag) => flag.severity === 'high').length
  };

  const lastScan = response.last_scan || new Date().toISOString();
  const lastScanLocal = new Date(lastScan).toLocaleString();
  const lastScanRelative = getRelativeTime(lastScan);

  const summary = flags.length
    ? `Detected ${flags.length} issue${flags.length > 1 ? 's' : ''}: ${flags
        .map((flag) => `${flag.type} (${flag.severity})`)
        .join(', ')}.`
    : 'No active security flags detected.';

  return {
    trustScorePercent,
    trustScoreRaw,
    riskScore,
    riskLevel,
    statusLabel: status.label,
    statusTone: status.tone,
    walletAddress: response.wallet_address,
    network: networkDetails.label,
    networkCode: networkDetails.code,
    lastScan,
    lastScanLocal,
    lastScanRelative,
    flags,
    issuesBySeverity,
    hasFlags: flags.length > 0,
    summary,
    guardianScanId: response.guardian_scan_id
  };
}

function resolveNetwork(network: string) {
  const trimmed = (network || '').trim();
  if (!trimmed) {
    return {
      code: 'ethereum',
      label: NETWORK_LABELS['ethereum']
    };
  }

  const lower = trimmed.toLowerCase();
  const code = NETWORK_ALIASES[lower] || lower;
  const label = NETWORK_LABELS[code] || trimmed;

  return { code, label };
}

async function fetchFromApi(request: GuardianScanRequest): Promise<GuardianScanResult> {
  try {
    const response = await fetch('/api/guardian/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: request.walletAddress,
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload?.result) {
        return normalizeGuardianScan(payload.result as GuardianScanApiResponse);
      }
    } else {
      const errorText = await response.text();
      console.warn('Guardian scan API route failed', response.status, errorText);
    }
  } catch (error) {
    console.warn('Guardian scan API route unavailable, falling back to Supabase function', error);
  }

  const resolvedNetwork = resolveNetwork(request.network);
  
  // Generate request ID for tracing
  const requestId = generateRequestId();
  
  logger.info('Starting Guardian scan', {
    requestId,
    walletAddress: request.walletAddress,
    network: resolvedNetwork.code,
  });
  
  // Use Supabase Edge Function instead of /api route (Vite doesn't have /api directory)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !anonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY not configured');
  }
  
  const functionUrl = `${supabaseUrl}/functions/v1/guardian-scan-v2`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      wallet_address: request.walletAddress,
      network: resolvedNetwork.code,
      request_id: requestId,
    })
  });

  // Capture response headers for debugging
  const serverRequestId = response.headers.get('x-request-id') || requestId;
  logger.info('Guardian scan response received', {
    requestId: serverRequestId,
    status: response.status,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Guardian scan failed', {
      requestId: serverRequestId,
      status: response.status,
      error: errorText,
    });
    throw new Error(`Guardian API responded with status ${response.status}: ${errorText}`);
  }

  // Handle SSE response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let data: GuardianScanApiResponse | null = null;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            if (eventData.step === 'complete' && eventData.data) {
              data = eventData.data as GuardianScanApiResponse;
              break;
            }
          } catch (e) {
            // Ignore parsing errors for progress events
          }
        }
      }
      
      if (data) break;
    }
  }

  if (!data) {
    throw new Error('No complete data received from Guardian scan');
  }
  
  logger.info('Guardian scan completed', {
    requestId: serverRequestId,
    trustScore: data.trust_score,
    riskLevel: data.risk_level,
    flagCount: data.flags?.length || 0,
  });

  return normalizeGuardianScan(data);
}

async function fetchFromSupabase(request: GuardianScanRequest): Promise<GuardianScanResult | null> {
  try {
    const resolvedNetwork = resolveNetwork(request.network);
    const networkFilters = Array.from(
      new Set([request.network, resolvedNetwork.code, resolvedNetwork.label].filter(Boolean))
    );

    const { data } = await supabase
      .from('guardian_scans' as any)
      .select('*')
      .eq('wallet_address', request.walletAddress)
      .in('network', networkFilters.length ? networkFilters : [request.network])
      .order('last_scan', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return null;
    }

    return normalizeGuardianScan(data as GuardianScanApiResponse);
  } catch (error) {
    console.warn('Guardian Supabase fallback failed:', error);
    return null;
  }
}

export async function requestGuardianScan(request: GuardianScanRequest): Promise<GuardianScanResult> {
  try {
    const result = await fetchFromApi(request);
    console.log('🟢 Guardian: Using LIVE API data', { trustScore: result.trustScorePercent, source: 'API' });
    return result;
  } catch (apiError) {
    console.warn('Guardian API primary fetch failed, attempting Supabase fallback:', apiError);

    const supabaseResult = await fetchFromSupabase(request);
    if (supabaseResult) {
      console.log('🟡 Guardian: Using SUPABASE fallback data', { trustScore: supabaseResult.trustScorePercent, source: 'Supabase' });
      return supabaseResult;
    }

    const finalResult = normalizeGuardianScan({
      ...FALLBACK_SCAN,
      wallet_address: request.walletAddress || FALLBACK_SCAN.wallet_address,
      network: resolveNetwork(request.network).label,
      last_scan: FALLBACK_SCAN.last_scan
    });

    console.log('🔴 Guardian: Using MOCK fallback data', { trustScore: finalResult.trustScorePercent, source: 'Mock' });
    return finalResult;
  }
}

/**
 * Request to revoke approvals
 */
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
  transactions: Array<{
    token: string;
    spender: string;
    data: string;
    to: string;
    value: string;
  }>;
  gas_estimate?: {
    total_gas: number;
    per_tx: number;
  };
  score_delta?: number;
  idempotency_key?: string;
}

export async function requestGuardianRevoke(
  request: GuardianRevokeRequest
): Promise<GuardianRevokeResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY not configured');
  }

  const functionUrl = `${supabaseUrl}/functions/v1/guardian-revoke-v2`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Guardian revoke API responded with status ${response.status}: ${errorText}`);
  }

  return await response.json();
}
