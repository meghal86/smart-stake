/**
 * Guardian TypeScript Types
 * Evidence-based trust scoring with confidence tracking
 */

export interface Evidence {
  source: string;        // 'alchemy' | 'etherscan' | 'honeypot-api' | 'cache' | 'heuristic'
  observedAt: number;    // Unix timestamp
  ttl: number;           // Time-to-live in seconds
  cached?: boolean;      // Whether this came from cache
  latencyMs?: number;    // API call latency
}

export interface RiskFactor {
  category:
    | 'Approvals'
    | 'Honeypot'
    | 'Hidden Mint'
    | 'Reputation'
    | 'Mixer'
    | 'Age'
    | 'Liquidity'
    | 'Taxes'
    | 'Contract';
  impact: number;        // Negative points deducted
  severity: 'low' | 'medium' | 'high' | 'unknown';
  description: string;
  evidence?: Evidence;
  meta?: Record<string, any>;
}

export interface TrustScoreResult {
  score: number;         // 0..100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;    // 0..1 (data quality/freshness)
  factors: RiskFactor[];
  totals: {
    flags: number;
    critical: number;
  };
  meta?: {
    timings?: Record<string, number>;
    cache?: {
      hits: number;
      misses: number;
    };
  };
}

export interface Approval {
  token: `0x${string}`;
  spender: `0x${string}`;
  allowance: bigint;
  symbol: string;
  decimals: number;
  tokenName?: string;
}

export interface ApprovalRisk extends Approval {
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  usdValue?: number;
  evidence?: Evidence;
}

export interface MixerProximityResult {
  hasMixerActivity: boolean;
  proximityScore: number; // 0-100
  directInteractions: number;
  oneHopInteractions: number;
  lastInteraction: number | null; // Unix timestamp
  mixerAddresses: string[];
  evidence?: Evidence;
}

export interface ReputationResult {
  level: 'good' | 'neutral' | 'caution' | 'bad';
  score: number; // 0-100
  reasons: string[];
  labels: string[];
  evidence?: Evidence;
}

export interface HoneypotResult {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  evidence?: Evidence;
}

export interface ScanStep {
  step: 'approvals' | 'reputation' | 'mixer' | 'honeypot' | 'complete';
  progress: number; // 0-100
  data?: Partial<TrustScoreResult>;
  message?: string;
}

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfterSec?: number;
    details?: any;
  };
  requestId?: string;
}

export interface ApiSuccessShape<T> {
  success: true;
  data: T;
  requestId?: string;
  meta?: {
    cached?: boolean;
    latencyMs?: number;
  };
}

export type ApiResponse<T> = ApiSuccessShape<T> | ApiErrorShape;

export interface RevokeRequest {
  token: `0x${string}`;
  spender: `0x${string}`;
  user: `0x${string}`;
  chain: string;
  idempotencyKey: string;
}

export interface RevokeResponse {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  gasEstimate?: bigint;
  scoreDelta?: {
    min: number;
    max: number;
  };
  simulation?: {
    success: boolean;
    reason?: string;
  };
}

export interface GuardianScanResult extends TrustScoreResult {
  targetAddress: string;
  chains: string[];
  lastScanAt: number;
  approvals: ApprovalRisk[];
  scanId?: string;
  requestId?: string;
}

export interface CacheMetrics {
  hitRatio: number;
  hits: number;
  misses: number;
  avgAgeMs: number;
}

export interface HealthCheckResult {
  ok: boolean;
  latestEventAgeSec: number;
  checks: {
    alchemy: { ok: boolean; latencyMs: number };
    etherscan: { ok: boolean; latencyMs: number };
    db: { ok: boolean; latencyMs: number };
    cache: CacheMetrics;
  };
  timestamp: string;
  requestId: string;
}

