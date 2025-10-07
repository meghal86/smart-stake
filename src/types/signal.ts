/**
 * Core Signal Types for Real-Time Feed
 */

export type SignalDirection = 'inflow' | 'outflow' | 'accumulation' | 'distribution' | 'neutral';
export type SignalOwnerType = 'whale' | 'exchange' | 'protocol' | 'unknown';
export type SignalRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Signal {
  id: string;
  asset: string;
  assetSymbol?: string;
  direction: SignalDirection;
  amountUsd: number;
  amount?: number;
  timestamp: string; // ISO 8601
  ownerType: SignalOwnerType;
  txHash?: string;
  from?: string;
  to?: string;
  source: string;
  risk: SignalRisk;
  impactScore?: number;
  groupCount?: number; // Number of signals grouped together
  groupedIds?: string[]; // IDs of grouped signals
  isLive?: boolean;
  reason?: string;
}

export interface Paged<T> {
  items: T[];
  nextCursor?: string;
  tookMs?: number;
  total?: number;
}

export interface SignalGroup {
  key: string;
  signals: Signal[];
  latestTimestamp: string;
  totalAmountUsd: number;
  count: number;
}

export interface SignalInsight {
  id: string;
  signalId: string;
  explanation: string;
  whatChanged: string;
  doNext: {
    title: string;
    description: string;
    action: 'create_alert' | 'follow_pattern' | 'view_details' | 'custom';
    actionData?: Record<string, unknown>;
  }[];
  generatedAt: string;
  cached: boolean;
}

export interface SignalFilter {
  mutedWallets: string[];
  mutedExchanges: string[];
  mutedAssets: string[];
  minAmountUsd?: number;
  directions?: SignalDirection[];
  ownerTypes?: SignalOwnerType[];
  risks?: SignalRisk[];
}

export interface SignalFeedState {
  signals: Signal[];
  groups: SignalGroup[];
  filter: SignalFilter;
  isConnected: boolean;
  isPaused: boolean;
  pendingCount: number;
  lastUpdate: string;
}
