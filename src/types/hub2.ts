export type Confidence = 'low'|'med'|'high';
export type Source = 'etherscan'|'coingecko'|'defillama'|'simulated'|'internal'|'live';

export interface SignalEvent {
  id: string;
  ts: string; // ISO
  type: 'dormant_awake'|'cex_outflow'|'defi_leverage'|'risk_change'|'sentiment_change';
  entity: { kind:'asset'|'chain'|'cluster'; id:string; symbol?:string; name?:string };
  impactUsd?: number;
  delta?: number; // e.g. risk +2
  confidence: Confidence;
  source: Source;
  reasonCodes: string[];
}

export interface Gauges {
  sentiment: number;      // 0–100
  whalePressure: number;  // -100..+100 (in-out normalized)
  risk: number;           // 0–10
}

export interface EntitySummary {
  id: string;
  kind: 'asset'|'chain'|'cluster';
  symbol?: string;
  name: string;
  badges: ('real'|'sim')[];
  gauges: Gauges;
  priceUsd?: number;
  change24h?: number;
  lastEvents: SignalEvent[]; // <=3 recent
  provenance?: { source: Source; updatedAt: string };
}

export interface BacktestResult {
  winRate: number;        // 0..1
  avgReturnPct: number;   // e.g. 7.2
  sample: number;
}

export interface AlertRule {
  id: string;
  name: string;
  predicate: Record<string, unknown>;
  scope: { kind:'asset'|'chain'|'cluster'; ids:string[] };
  threshold?: Record<string, number>;
  window: '1h'|'4h'|'24h'|'7d';
  channels: ('inapp'|'push'|'email')[];
  enabled: boolean;
  lastTriggered?: string;
}

export interface PulseData {
  kpis: {
    marketSentiment: number;
    whalePressure: number;
    risk: number;
    deltas: {
      sentiment: number;
      pressure: number;
      risk: number;
    };
  };
  topSignals: EntitySummary[];
  ts: string;
}

export interface ExploreData {
  items: EntitySummary[];
  total: number;
  hasMore: boolean;
}

export interface EntityDetail {
  summary: EntitySummary;
  timeline: SignalEvent[];
  ai: {
    soWhat: string;
    next: string[];
  };
}

// New types for Summary KPIs, Sentiment, and Global Watchlist
export type TimeWindow = '24h' | '7d' | '30d';

export interface SummaryKpis {
  window: TimeWindow;
  refreshedAt: string; // ISO
  marketSentiment: number; // 0..100
  whalePressure: {
    score: number;      // e.g., +1264
    direction: 'inflow' | 'outflow' | 'balanced';
    deltaVsPrev: number; // signed
  };
  marketRisk: {
    score: number;      // 0..100
    deltaVsPrev: number; // signed
  };
}

export interface AssetSentiment {
  symbol: string;
  window: TimeWindow;
  sentiment: number; // 0..100
  label: 'Positive' | 'Neutral' | 'Negative';
  updatedAt: string;
}

export type WatchEntityType = 'asset' | 'address' | 'cluster';

export interface WatchItem {
  id: string;               // UUID
  entityType: WatchEntityType;
  entityId: string;         // symbol, address, cluster_id
  label?: string | null;
  createdAt: string;
  snapshots?: {
    sentiment?: number;
    whalePressure?: number;
    risk?: number;
    updatedAt: string;
  };
}

// Enhanced types for world-class crypto intelligence hub
export interface EnhancedMetrics {
  sentiment: number | null;
  risk: number | null;
  pressure: {
    inflow: number;
    outflow: number;
    net: number;
    unit: 'usd' | 'tx';
  };
}

export interface PercentileData {
  inflow: number; // 0-100
  risk: number;   // 0-100
}

export interface VenueData {
  venue: string;
  inflow: number;
  outflow: number;
}

export interface EnhancedResponse {
  asOf: string; // ISO8601
  provenance: 'real' | 'sim';
  metrics: EnhancedMetrics;
  percentile: PercentileData;
  topVenues: VenueData[];
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  providers: {
    whaleAlerts: { status: 'ok' | 'degraded' | 'down'; latency: number; errorRate: number };
    marketSummary: { status: 'ok' | 'degraded' | 'down'; latency: number; errorRate: number };
    assetSentiment: { status: 'ok' | 'degraded' | 'down'; latency: number; errorRate: number };
  };
  lastChecked: string;
}

export interface EvidenceTransaction {
  hash: string;
  symbol: string;
  amount_usd: number;
  timestamp: number;
  from: { address: string; owner_type: string };
  to: { address: string; owner_type: string };
}

export interface AIDigest {
  narrative: string;
  percentile: PercentileData;
  venues: VenueData[];
  evidenceTx: EvidenceTransaction[];
  cta: {
    watchAll: string;
    createAlert: string;
    showTransactions: string;
  };
}

export interface UIMode {
  mode: 'novice' | 'pro';
  density: 'simplified' | 'full';
}

export interface AlertKPI {
  total: number;
  active: number;
  disabled: number;
  avgTriggerLatency: number; // 24h in ms
}
