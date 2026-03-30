/**
 * Guardian live probes with evidence metadata.
 * These probes are intentionally conservative: every result should be explainable.
 */

import { isUnlimitedAllowance, type GuardianContractEvidence } from './guardian-score.ts';

export interface Evidence {
  source: string;
  observedAt: number;
  ttl: number;
  cached?: boolean;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface ProbeResult<T> {
  data: T;
  evidence: Evidence;
  error?: string;
}

export interface ApprovalProbeRecord {
  token: string;
  tokenAddress: string;
  spender: string;
  spenderName?: string;
  allowance: string;
  isUnlimited: boolean;
  approvedAt: string;
  txHash?: string;
  chainId: number;
  evidence: Evidence;
}

export interface ReputationProbeResult {
  level: 'good' | 'neutral' | 'caution' | 'bad';
  score: number;
  reasons: string[];
  labels: string[];
}

export interface MixerProbeResult {
  proximityScore: number;
  directInteractions: number;
  oneHopInteractions: number;
  lastInteraction: number | null;
  mixerAddresses: string[];
}

interface ExplorerTransaction {
  hash: string;
  from: string;
  to: string;
  input: string;
  methodId?: string;
  functionName?: string;
  timeStamp: string;
  isError?: string;
  contractAddress?: string;
}

const ETHERSCAN_KEY = Deno.env.get('ETHERSCAN_API_KEY') || 'YourApiKeyToken';

const cache = new Map<
  string,
  { data: unknown; expiresAt: number; source: string; ttlSec: number; observedAt: number }
>();

const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  optimism: 10,
};

const KNOWN_SPENDER_LABELS: Record<string, string> = {
  '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch Router',
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap Universal Router',
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': '0x Exchange Proxy',
  '0x881d40237659c251811cec9c364ef91dc08d300c': 'MetaMask Swap Router',
};

const MIXER_ADDRESSES: Record<string, string[]> = {
  ethereum: [
    '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936',
    '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
    '0xa160cdab225685da1d56aa342ad8841c3b53f291',
    '0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a',
    '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3',
    '0x169ad27a470d064dede56a2d3ff727986b15d52b',
  ],
  base: [],
  arbitrum: [],
  polygon: [],
  optimism: [],
};

function chainToId(chain: string) {
  return CHAIN_ID_MAP[chain.toLowerCase()] || 1;
}

function getExplorerUrl(chain: string, params: URLSearchParams) {
  params.set('chainid', String(chainToId(chain)));
  params.set('apikey', ETHERSCAN_KEY);
  return `https://api.etherscan.io/v2/api?${params.toString()}`;
}

function getCached<T>(key: string): { data: T; ageSec: number; source: string; ttlSec: number } | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return {
    data: entry.data as T,
    ageSec: Math.floor((now - entry.observedAt) / 1000),
    source: entry.source,
    ttlSec: entry.ttlSec,
  };
}

function setCache(key: string, data: unknown, ttlSec: number, source: string) {
  const observedAt = Date.now();
  cache.set(key, {
    data,
    expiresAt: observedAt + ttlSec * 1000,
    source,
    ttlSec,
    observedAt,
  });
}

async function fetchExplorerTransactions(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ExplorerTransaction[]> {
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: '200',
    sort: 'desc',
  });

  const response = await fetch(getExplorerUrl(chain, params), { signal });
  if (!response.ok) {
    throw new Error(`Explorer transaction API error: ${response.status}`);
  }

  const data = await response.json();
  const result = Array.isArray(data.result) ? data.result : [];
  return result as ExplorerTransaction[];
}

function decodeApproveInput(input: string): { spender: string; allowance: string } | null {
  if (!input || !input.startsWith('0x095ea7b3') || input.length < 138) {
    return null;
  }

  const spenderChunk = input.slice(10, 74);
  const amountChunk = input.slice(74, 138);
  const spender = `0x${spenderChunk.slice(24)}`.toLowerCase();

  try {
    return {
      spender,
      allowance: BigInt(`0x${amountChunk}`).toString(10),
    };
  } catch {
    return null;
  }
}

function tokenSymbolFromAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function approvalCacheEvidence(source: string, ageSec: number, ttlSec: number): Evidence {
  return {
    source,
    observedAt: Date.now() - ageSec * 1000,
    ttl: ttlSec,
    cached: true,
    latencyMs: 0,
  };
}

export async function probeApprovals(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ProbeResult<ApprovalProbeRecord[]>> {
  const start = Date.now();
  const cacheKey = `guardian:approvals:${chain}:${address.toLowerCase()}`;
  const cached = getCached<ApprovalProbeRecord[]>(cacheKey);

  if (cached) {
    return {
      data: cached.data.map((item) => ({
        ...item,
        evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
      })),
      evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
    };
  }

  try {
    const transactions = await fetchExplorerTransactions(address, chain, signal);
    const approvals = new Map<string, ApprovalProbeRecord>();

    for (const tx of transactions) {
      if ((tx.isError || '0') !== '0') continue;
      if ((tx.from || '').toLowerCase() !== address.toLowerCase()) continue;

      const decoded = decodeApproveInput(tx.input);
      if (!decoded || decoded.allowance === '0') continue;

      const tokenAddress = (tx.to || '').toLowerCase();
      if (!tokenAddress) continue;

      const approvedAt = new Date(Number(tx.timeStamp) * 1000).toISOString();
      const evidence: Evidence = {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 1800,
        cached: false,
        latencyMs: Date.now() - start,
        details: {
          txHash: tx.hash,
          methodId: tx.methodId,
          functionName: tx.functionName,
        },
      };

      approvals.set(`${tokenAddress}:${decoded.spender}`, {
        id: `${tokenAddress}:${decoded.spender}`,
        token: tokenSymbolFromAddress(tokenAddress),
        tokenAddress,
        spender: decoded.spender,
        spenderName: KNOWN_SPENDER_LABELS[decoded.spender],
        allowance: decoded.allowance,
        isUnlimited: isUnlimitedAllowance(decoded.allowance),
        approvedAt,
        txHash: tx.hash,
        chainId: chainToId(chain),
        evidence,
      });
    }

    const data = Array.from(approvals.values()).sort((a, b) => {
      return new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
    });

    setCache(cacheKey, data, 1800, 'etherscan');

    return {
      data,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 1800,
        cached: false,
        latencyMs: Date.now() - start,
        details: {
          transactionsReviewed: transactions.length,
          approvalsFound: data.length,
        },
      },
    };
  } catch (error) {
    return {
      data: [],
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 0,
        cached: false,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function probeReputation(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ProbeResult<ReputationProbeResult>> {
  const start = Date.now();
  const cacheKey = `guardian:reputation:${chain}:${address.toLowerCase()}`;
  const cached = getCached<ReputationProbeResult>(cacheKey);

  if (cached) {
    return {
      data: cached.data,
      evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
    };
  }

  try {
    const transactions = await fetchExplorerTransactions(address, chain, signal);
    const txCount = transactions.length;
    const firstTx = transactions[transactions.length - 1];
    const walletAgeDays = firstTx
      ? Math.max(
          0,
          (Date.now() - Number(firstTx.timeStamp) * 1000) / (1000 * 60 * 60 * 24),
        )
      : 0;

    let level: ReputationProbeResult['level'] = 'neutral';
    let score = 55;
    const reasons: string[] = [];
    const labels: string[] = [];

    if (txCount === 0) {
      level = 'caution';
      score = 30;
      reasons.push('No explorer transaction history found for this wallet.');
    } else if (walletAgeDays > 180 && txCount > 25) {
      level = 'good';
      score = 78;
      reasons.push('Wallet has a long-lived and active onchain history.');
      labels.push('long-lived');
    } else if (walletAgeDays < 14) {
      level = 'caution';
      score = 42;
      reasons.push('Wallet is newly active and has limited history.');
      labels.push('new-wallet');
    } else {
      reasons.push('Wallet has a normal activity profile with no strong reputation flags.');
    }

    const data = { level, score, reasons, labels };
    setCache(cacheKey, data, 21600, 'etherscan');

    return {
      data,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 21600,
        cached: false,
        latencyMs: Date.now() - start,
        details: {
          txCount,
          walletAgeDays: Math.round(walletAgeDays),
        },
      },
    };
  } catch (error) {
    return {
      data: {
        level: 'caution',
        score: 35,
        reasons: ['Reputation probe failed.'],
        labels: [],
      },
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 0,
        cached: false,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function probeMixer(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ProbeResult<MixerProbeResult>> {
  const start = Date.now();
  const cacheKey = `guardian:mixer:${chain}:${address.toLowerCase()}`;
  const cached = getCached<MixerProbeResult>(cacheKey);

  if (cached) {
    return {
      data: cached.data,
      evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
    };
  }

  try {
    const transactions = await fetchExplorerTransactions(address, chain, signal);
    const mixers = new Set((MIXER_ADDRESSES[chain.toLowerCase()] || []).map((item) => item.toLowerCase()));
    let directInteractions = 0;
    let lastInteraction: number | null = null;
    const mixerAddresses = new Set<string>();

    for (const tx of transactions) {
      const to = (tx.to || '').toLowerCase();
      const from = (tx.from || '').toLowerCase();
      const ts = Number(tx.timeStamp);
      if (mixers.has(to) || mixers.has(from)) {
        directInteractions += 1;
        if (mixers.has(to)) mixerAddresses.add(to);
        if (mixers.has(from)) mixerAddresses.add(from);
        if (!lastInteraction || ts > lastInteraction) {
          lastInteraction = ts;
        }
      }
    }

    const oneHopInteractions = 0;
    const proximityScore = Math.min(
      100,
      directInteractions * 50 + oneHopInteractions * 10 + (lastInteraction ? 15 : 0),
    );

    const data = {
      proximityScore,
      directInteractions,
      oneHopInteractions,
      lastInteraction,
      mixerAddresses: Array.from(mixerAddresses),
    };
    setCache(cacheKey, data, 21600, 'etherscan');

    return {
      data,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 21600,
        cached: false,
        latencyMs: Date.now() - start,
        details: {
          transactionsReviewed: transactions.length,
          mixersConfigured: mixers.size,
        },
      },
    };
  } catch (error) {
    return {
      data: {
        proximityScore: 0,
        directInteractions: 0,
        oneHopInteractions: 0,
        lastInteraction: null,
        mixerAddresses: [],
      },
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 0,
        cached: false,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function probeWalletAgeDays(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ProbeResult<number | null>> {
  const start = Date.now();
  const cacheKey = `guardian:wallet-age:${chain}:${address.toLowerCase()}`;
  const cached = getCached<number | null>(cacheKey);

  if (cached) {
    return {
      data: cached.data,
      evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
    };
  }

  try {
    const transactions = await fetchExplorerTransactions(address, chain, signal);
    const oldest = transactions[transactions.length - 1];
    const ageDays = oldest
      ? Math.max(0, (Date.now() - Number(oldest.timeStamp) * 1000) / (1000 * 60 * 60 * 24))
      : null;

    setCache(cacheKey, ageDays, 21600, 'etherscan');

    return {
      data: ageDays,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 21600,
        cached: false,
        latencyMs: Date.now() - start,
      },
    };
  } catch (error) {
    return {
      data: null,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 0,
        cached: false,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function probeContractEvidence(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<ProbeResult<GuardianContractEvidence>> {
  const start = Date.now();
  const cacheKey = `guardian:contract:${chain}:${address.toLowerCase()}`;
  const cached = getCached<GuardianContractEvidence>(cacheKey);

  if (cached) {
    return {
      data: {
        ...cached.data,
        evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
      },
      evidence: approvalCacheEvidence(cached.source, cached.ageSec, cached.ttlSec),
    };
  }

  try {
    const sourceParams = new URLSearchParams({
      module: 'contract',
      action: 'getsourcecode',
      address,
    });
    const sourceResponse = await fetch(getExplorerUrl(chain, sourceParams), { signal });
    if (!sourceResponse.ok) {
      throw new Error(`Explorer source API error: ${sourceResponse.status}`);
    }

    const sourceData = await sourceResponse.json();
    const entry = Array.isArray(sourceData.result) ? sourceData.result[0] : null;
    const sourceCode = typeof entry?.SourceCode === 'string' ? entry.SourceCode : '';
    const contractName = typeof entry?.ContractName === 'string' ? entry.ContractName : '';
    const label = KNOWN_SPENDER_LABELS[address.toLowerCase()] || contractName || null;

    const txParams = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '1',
      sort: 'asc',
    });
    const txResponse = await fetch(getExplorerUrl(chain, txParams), { signal });
    const txData = txResponse.ok ? await txResponse.json() : { result: [] };
    const firstTx = Array.isArray(txData.result) ? txData.result[0] : null;
    const ageDays = firstTx
      ? Math.max(0, (Date.now() - Number(firstTx.timeStamp) * 1000) / (1000 * 60 * 60 * 24))
      : null;

    const result: GuardianContractEvidence = {
      address: address.toLowerCase(),
      isVerified: Boolean(sourceCode && sourceCode !== 'Contract source code not verified'),
      ageDays,
      label,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 86400,
        cached: false,
        latencyMs: Date.now() - start,
        details: {
          contractName,
        },
      },
    };

    setCache(cacheKey, result, 86400, 'etherscan');

    return {
      data: result,
      evidence: result.evidence,
    };
  } catch (error) {
    const evidence: Evidence = {
      source: 'etherscan',
      observedAt: Date.now(),
      ttl: 0,
      cached: false,
      latencyMs: Date.now() - start,
    };

    return {
      data: {
        address: address.toLowerCase(),
        isVerified: false,
        ageDays: null,
        label: KNOWN_SPENDER_LABELS[address.toLowerCase()] || null,
        evidence,
      },
      evidence,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function calculateConfidence(evidenceList: Evidence[]): number {
  if (evidenceList.length === 0) return 0.25;

  let totalWeight = 0;
  let weightedScore = 0;
  const now = Date.now();

  for (const evidence of evidenceList) {
    const ttlMs = Math.max(1000, evidence.ttl * 1000);
    const ageMs = Math.max(0, now - evidence.observedAt);
    const freshness = 1 - Math.min(ageMs / ttlMs, 1) * 0.4;
    const sourceWeight = evidence.cached ? 0.85 : 1;
    const latencyWeight = evidence.latencyMs && evidence.latencyMs > 5000 ? 0.95 : 1;
    const score = freshness * sourceWeight * latencyWeight;
    const weight = evidence.cached ? 0.8 : 1;
    weightedScore += score * weight;
    totalWeight += weight;
  }

  return Math.max(0.2, Math.min(0.98, weightedScore / totalWeight));
}
