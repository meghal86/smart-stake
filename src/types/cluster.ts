// Whale Behavior Clusters - Data Contracts
export type Window = "24h" | "7d" | "30d";

export type ClusterKind = "Dormant" | "CEXInflow" | "Defi" | "Outflow" | "Accumulation" | "Other";

export interface ClusterMetrics {
  clusterId: string;
  name: string;
  kind: ClusterKind;
  activeAddresses: number;
  valueAbsUSD: number;    // Σ abs(in/out)
  netFlowUSD: number;     // signed
  shareOfTotalPct: number;// 0..100, of total abs(netFlow)
  riskScore: number;      // 0..100
  confidencePct: number;  // 0..100
  note?: "balance_delta_source" | "insufficient_data";
}

export interface TxSample {
  txId: string;
  ts: string;
  chain: string;
  from: string;
  to: string;
  direction: "in" | "out";
  amountUSD: number;
  token?: string;
  venue?: "CEX" | "DEX" | "Bridge" | "Unknown";
}

export interface TopMover {
  address: string;
  deltaUSD: number;
  lastSeen?: string;
}

export interface ClusterBundle {
  metrics: ClusterMetrics;
  tx: TxSample[];           // 0..N; may be empty
  topMovers?: TopMover[];   // balance-delta fallback
  relatedAlerts: string[];  // alert IDs
}

export interface ClusterFilters {
  timeWindow: Window;
  chain: string;
  minValueUSD: number;
}