export type Confidence = 'low'|'med'|'high';
export type Source = 'etherscan'|'coingecko'|'defillama'|'simulated'|'internal';

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
  predicate: Record<string, any>;
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
