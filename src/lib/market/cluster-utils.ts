import { ClusterBundle, ClusterMetrics, TxSample, Window } from '@/types/cluster';

type WhaleAlertEntity = {
  address?: string;
  owner?: string;
  owner_type?: string;
};

type WhaleAlertTransaction = {
  id?: string;
  hash?: string;
  tx_hash?: string;
  timestamp?: number;
  amount_usd?: number;
  amount?: number;
  symbol?: string;
  token?: string;
  blockchain?: string;
  chain?: string;
  transaction_type?: string;
  from?: WhaleAlertEntity | null;
  to?: WhaleAlertEntity | null;
};

type ClusterAlert = WhaleAlertTransaction & {
  cluster?: string;
  confidence?: number;
  reasons?: string[];
  to_entity?: string | null;
  from_entity?: string | null;
  counterparty_type?: string | null;
};

interface BuildBundleOptions {
  clusterId: string;
  clusterType?: string;
  clusterName?: string;
  clusterKind?: string;
  clusterRiskScore?: number;
  clusterConfidence?: number;
  addressesCount?: number;
  netFlow24h?: number;
  sumBalanceUsd?: number;
  shareOfTotalPct?: number;
  alerts?: ClusterAlert[];
  fallbackTransactions?: WhaleAlertTransaction[];
  timeWindow: Window;
}

const CEX_KEYWORDS = ['binance', 'coinbase', 'kraken', 'okx', 'bybit', 'kucoin', 'huobi', 'bitfinex'];
const DEFI_KEYWORDS = ['swap', 'dex', 'defi', 'stake', 'lend', 'pool', 'curve', 'aave', 'compound', 'balancer', 'sushiswap', 'uniswap'];

const WINDOW_IN_MS: Record<Window, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const defaultNames: Record<string, string> = {
  DORMANT_WAKING: 'Dormant Wallets Awakening',
  CEX_INFLOW: 'Exchange Inflows',
  DEFI_ACTIVITY: 'DeFi Interactions',
  DISTRIBUTION: 'Token Distribution',
  ACCUMULATION: 'Accumulation Pattern',
};

const defaultKinds: Record<string, ClusterMetrics['kind']> = {
  DORMANT_WAKING: 'Dormant',
  CEX_INFLOW: 'CEXInflow',
  DEFI_ACTIVITY: 'Defi',
  DISTRIBUTION: 'Outflow',
  ACCUMULATION: 'Accumulation',
};

function normaliseClusterType(clusterId: string): string {
  if (!clusterId) return 'ACCUMULATION';
  if (clusterId.includes(':')) {
    return clusterId.split(':').pop()!.toUpperCase();
  }
  if (clusterId.startsWith('cluster_')) {
    return clusterId.replace('cluster_', '').toUpperCase();
  }
  return clusterId.toUpperCase();
}

function deriveDirection(clusterType: string | undefined, tx?: WhaleAlertTransaction | ClusterAlert): 'in' | 'out' {
  const type = normaliseClusterType(clusterType || '');

  if (type === 'ACCUMULATION' || type === 'DORMANT_WAKING') {
    return 'in';
  }

  if (type === 'CEX_INFLOW' || type === 'DISTRIBUTION') {
    return 'out';
  }

  const toType = (tx as unknown)?.to?.owner_type?.toLowerCase?.() || (tx as unknown)?.counterparty_type?.toLowerCase?.();
  if (toType && ['bridge', 'amm', 'dex'].includes(toType)) {
    return 'out';
  }

  return 'out';
}

function detectVenue(tx?: WhaleAlertTransaction | ClusterAlert): TxSample['venue'] {
  if (!tx) return 'Unknown';

  const toOwner = ((tx as unknown).to?.owner || (tx as unknown).to_entity || '').toLowerCase();
  const toType = ((tx as unknown).to?.owner_type || (tx as unknown).counterparty_type || '').toLowerCase();

  if (CEX_KEYWORDS.some(keyword => toOwner.includes(keyword) || toType.includes(keyword))) {
    return 'CEX';
  }

  if (['amm', 'dex'].includes(toType) || DEFI_KEYWORDS.some(keyword => toOwner.includes(keyword))) {
    return 'DEX';
  }

  if (toType.includes('bridge')) {
    return 'Bridge';
  }

  return 'Unknown';
}

function clampConfidence(value: number | undefined, fallback = 0): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  if (value <= 1) {
    return Math.round(value * 100);
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function formatChain(chain?: string): string {
  if (!chain) return 'ETH';
  const upper = chain.toUpperCase();
  if (upper === 'ETHEREUM') return 'ETH';
  if (upper === 'POLYGON') return 'POLYGON';
  return upper;
}

function withinWindow(ts: number | undefined, window: Window): boolean {
  if (!ts) return false;
  const cutoff = Date.now() - WINDOW_IN_MS[window];
  return ts >= cutoff;
}

function ensureTimestamp(value: number | string | undefined): number | undefined {
  if (typeof value === 'number') {
    // Whale Alert timestamps come as seconds
    if (value > 1e12) {
      return value;
    }
    return value * 1000;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function mergeTransaction(source?: WhaleAlertTransaction, fallback?: ClusterAlert, clusterType?: string) {
  const timestampMs = ensureTimestamp(source?.timestamp) ?? ensureTimestamp(fallback?.timestamp);
  const amountUSD = Number(source?.amount_usd ?? source?.amount ?? fallback?.amount_usd ?? fallback?.amount ?? 0);

  if (!timestampMs || !Number.isFinite(amountUSD)) {
    return null;
  }

  const fromAddress = source?.from?.address || fallback?.from_address || fallback?.from?.address || '';
  const toAddress = source?.to?.address || fallback?.to_address || fallback?.to?.address || '';
  const direction = deriveDirection(clusterType, source || fallback);

  const txSample: TxSample = {
    txId: source?.hash || source?.tx_hash || fallback?.hash || fallback?.id || `${clusterType || 'cluster'}_${timestampMs}`,
    ts: new Date(timestampMs).toISOString(),
    chain: formatChain(source?.blockchain || source?.chain || fallback?.blockchain || fallback?.chain),
    from: fromAddress || 'unknown',
    to: toAddress || 'unknown',
    direction,
    amountUSD,
    token: (source?.symbol || source?.token || fallback?.symbol || fallback?.token)?.toUpperCase(),
    venue: detectVenue(source || fallback),
  };

  return txSample;
}

function buildMetrics(options: BuildBundleOptions, samples: TxSample[], aggregateVolume: number): ClusterMetrics {
  const clusterType = normaliseClusterType(options.clusterType || options.clusterId);
  const valueAbsUSD = samples.reduce((acc, sample) => acc + Math.abs(sample.amountUSD), 0);
  const netFlowUSD = samples.reduce((acc, sample) => acc + (sample.direction === 'in' ? sample.amountUSD : -sample.amountUSD), 0);

  const uniqueAddresses = new Set<string>();
  samples.forEach(sample => {
    uniqueAddresses.add(sample.from);
    uniqueAddresses.add(sample.to);
  });

  const shareOfTotal = aggregateVolume > 0 ? (valueAbsUSD / aggregateVolume) * 100 : options.shareOfTotalPct || 0;

  return {
    clusterId: options.clusterId,
    name: options.clusterName || defaultNames[clusterType] || options.clusterId,
    kind: (options.clusterKind as ClusterMetrics['kind']) || defaultKinds[clusterType] || 'Other',
    activeAddresses: options.addressesCount || uniqueAddresses.size,
    valueAbsUSD: valueAbsUSD || Math.abs(options.sumBalanceUsd || 0),
    netFlowUSD: samples.length > 0 ? netFlowUSD : options.netFlow24h || 0,
    shareOfTotalPct: shareOfTotal || 0,
    riskScore: typeof options.clusterRiskScore === 'number' ? options.clusterRiskScore : Math.min(95, Math.round(samples.length * 8 + Math.abs(netFlowUSD) / 1_000_000)),
    confidencePct: clampConfidence(options.clusterConfidence, samples.length ? Math.min(90, samples.length * 12 + 40) : 0),
    note: samples.length === 0 ? 'insufficient_data' : undefined,
  };
}

export function buildClusterBundle(options: BuildBundleOptions): ClusterBundle {
  const clusterType = normaliseClusterType(options.clusterType || options.clusterId);

  const clusterAlerts = Array.isArray(options.alerts) ? options.alerts : [];
  const fallbackTransactions = Array.isArray(options.fallbackTransactions) ? options.fallbackTransactions : [];

  const alertsByHash = new Map<string, WhaleAlertTransaction>();
  fallbackTransactions.forEach(tx => {
    const hash = tx.hash || tx.tx_hash || tx.id;
    if (hash) {
      alertsByHash.set(hash, tx);
    }
  });

  const windowFilter = (timestamp?: number) => !timestamp || withinWindow(timestamp, options.timeWindow);

  let samples: TxSample[] = clusterAlerts
    .map(alert => {
      const match = alertsByHash.get(alert.hash || alert.id || '');
      const sample = mergeTransaction(match, alert, clusterType);
      if (!sample) return null;
      const timestampMs = ensureTimestamp(alert.timestamp) ?? ensureTimestamp(match?.timestamp);
      if (!windowFilter(timestampMs)) return null;
      return sample;
    })
    .filter((sample): sample is TxSample => Boolean(sample));

  if (!samples.length && fallbackTransactions.length) {
    samples = fallbackTransactions
      .map(tx => {
        const sample = mergeTransaction(tx, undefined, clusterType);
        if (!sample) return null;
        const timestampMs = ensureTimestamp(tx.timestamp);
        if (!windowFilter(timestampMs)) return null;
        return sample;
      })
      .filter((sample): sample is TxSample => Boolean(sample));
  }

  const aggregateVolume = fallbackTransactions.reduce((acc, tx) => {
    const amount = Number(tx.amount_usd ?? tx.amount ?? 0);
    return Number.isFinite(amount) ? acc + Math.abs(amount) : acc;
  }, 0);

  const metrics = buildMetrics(options, samples, aggregateVolume);

  return {
    metrics,
    tx: samples,
    relatedAlerts: clusterAlerts.map(alert => String(alert.id || alert.hash || alert.tx_hash || '')),
  };
}

export function normaliseClusterId(clusterId: string): string {
  if (!clusterId) return 'cluster_accumulation';
  return clusterId.startsWith('cluster_') ? clusterId : `cluster_${clusterId.toLowerCase()}`;
}
