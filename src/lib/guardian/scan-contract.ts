export type GuardianStatusTone = 'trusted' | 'warning' | 'danger';
export type GuardianRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type GuardianFindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GuardianScanRequestContext {
  walletAddress: string;
  network: string;
  dataSource: 'live' | 'demo';
}

export interface GuardianFinding {
  type: string;
  severity: GuardianFindingSeverity;
  description: string;
  recommendation?: string;
}

export interface GuardianApproval {
  id: string;
  spender: string;
  spenderName?: string;
  token: string;
  tokenAddress: string;
  amount: string;
  isUnlimited: boolean;
  approvedAt: string;
  lastUsedAt?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  chainId: number;
}

export interface GuardianRecommendedAction {
  id: string;
  kind: 'review_risks' | 'review_approvals' | 'rescan';
  label: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GuardianNormalizedScanResult {
  walletAddress: string;
  network: string;
  dataSource: 'live' | 'demo';
  scanId?: string;
  trustScore: {
    score: number;
    normalized: number;
    confidence?: number;
  };
  posture: {
    riskScore: number;
    riskLevel: GuardianRiskLevel;
    statusLabel: string;
    statusTone: GuardianStatusTone;
  };
  findings: GuardianFinding[];
  approvals: GuardianApproval[];
  freshness: {
    scannedAt: string;
  };
  recommendedActions: GuardianRecommendedAction[];

  // Compatibility fields for existing screens while the UI migrates.
  trustScorePercent: number;
  trustScoreRaw: number;
  riskScore: number;
  riskLevel: GuardianRiskLevel;
  statusLabel: string;
  statusTone: GuardianStatusTone;
  flags: GuardianFinding[];
  scannedAt: string;
  confidence?: number;
}

export interface GuardianRawRisk {
  type?: string;
  severity?: GuardianFindingSeverity;
  description?: string;
  recommendation?: string;
}

export interface GuardianRawApproval {
  id?: string;
  spender?: string;
  spender_address?: string;
  spender_name?: string;
  protocol_name?: string;
  token_symbol?: string;
  token?: string;
  token_address?: string;
  amount?: string;
  allowance?: string;
  is_unlimited?: boolean;
  approved_at?: string;
  timestamp?: string;
  last_used_at?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  chain_id?: number;
  is_verified?: boolean;
  value_usd?: number;
}

export interface GuardianRawScanPayload {
  trust_score_percent?: number;
  risk_score?: number;
  risks?: GuardianRawRisk[];
  approvals?: GuardianRawApproval[];
  scanned_at?: string;
  updated_at?: string;
  confidence?: number;
  scan_id?: string;
  guardian_scan_id?: string;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveRiskLevel(riskScore: number): GuardianNormalizedScanResult['posture'] {
  if (riskScore > 7) {
    return {
      riskScore,
      riskLevel: 'Critical',
      statusLabel: 'Critical Risk',
      statusTone: 'danger',
    };
  }

  if (riskScore > 5) {
    return {
      riskScore,
      riskLevel: 'High',
      statusLabel: 'High Risk',
      statusTone: 'danger',
    };
  }

  if (riskScore > 3) {
    return {
      riskScore,
      riskLevel: 'Medium',
      statusLabel: 'Medium Risk',
      statusTone: 'warning',
    };
  }

  return {
    riskScore,
    riskLevel: 'Low',
    statusLabel: 'Trusted',
    statusTone: 'trusted',
  };
}

export function calculateApprovalRiskLevel(approval: GuardianRawApproval): GuardianApproval['riskLevel'] {
  if (approval.is_unlimited && !approval.is_verified) {
    return 'critical';
  }

  if (approval.is_unlimited || (approval.value_usd && approval.value_usd > 10000)) {
    return 'high';
  }

  const approvedDate = new Date(approval.approved_at || approval.timestamp || Date.now());
  const monthsOld = (Date.now() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsOld > 6 || (approval.value_usd && approval.value_usd > 1000)) {
    return 'medium';
  }

  return 'low';
}

function normalizeApprovals(approvals: GuardianRawApproval[] | undefined): GuardianApproval[] {
  if (!Array.isArray(approvals)) {
    return [];
  }

  return approvals.map((approval, index) => ({
    id: approval.id || `approval_${index}`,
    spender: approval.spender || approval.spender_address || '',
    spenderName: approval.spender_name || approval.protocol_name,
    token: approval.token_symbol || approval.token || 'Unknown',
    tokenAddress: approval.token_address || '',
    amount: approval.amount || approval.allowance || 'unlimited',
    isUnlimited: approval.is_unlimited || approval.amount === 'unlimited' || approval.allowance === 'unlimited',
    approvedAt: approval.approved_at || approval.timestamp || new Date().toISOString(),
    lastUsedAt: approval.last_used_at,
    riskLevel: approval.risk_level || calculateApprovalRiskLevel(approval),
    chainId: approval.chain_id || 1,
  }));
}

function normalizeFindings(risks: GuardianRawRisk[] | undefined): GuardianFinding[] {
  if (!Array.isArray(risks)) {
    return [];
  }

  return risks.map((risk) => ({
    type: risk.type || 'UNKNOWN',
    severity: risk.severity || 'medium',
    description: risk.description || 'Security risk detected',
    recommendation: risk.recommendation,
  }));
}

function deriveRecommendedActions(
  findings: GuardianFinding[],
  approvals: GuardianApproval[]
): GuardianRecommendedAction[] {
  const actions: GuardianRecommendedAction[] = [];

  if (findings.length > 0) {
    actions.push({
      id: 'review-risks',
      kind: 'review_risks',
      label: 'Review Risks',
      description: `${findings.length} ${findings.length === 1 ? 'risk requires' : 'risks require'} attention.`,
      priority: findings.some((finding) => finding.severity === 'critical' || finding.severity === 'high')
        ? 'high'
        : 'medium',
    });
  }

  if (approvals.length > 0) {
    actions.push({
      id: 'review-approvals',
      kind: 'review_approvals',
      label: 'Review Approvals',
      description: `${approvals.length} token ${approvals.length === 1 ? 'approval is' : 'approvals are'} active.`,
      priority: approvals.some((approval) => approval.riskLevel === 'critical' || approval.riskLevel === 'high')
        ? 'high'
        : 'medium',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'rescan',
      kind: 'rescan',
      label: 'Rescan Wallet',
      description: 'Run another scan to confirm the latest wallet posture.',
      priority: 'low',
    });
  }

  return actions;
}

export function normalizeGuardianScanPayload(
  payload: GuardianRawScanPayload,
  context: GuardianScanRequestContext
): GuardianNormalizedScanResult {
  const explicitTrustScore = typeof payload.trust_score_percent === 'number'
    ? payload.trust_score_percent
    : null;
  const rawRiskScore = typeof payload.risk_score === 'number'
    ? payload.risk_score
    : null;

  if (explicitTrustScore === null && rawRiskScore === null) {
    throw new Error('Guardian scan returned no trust score.');
  }

  const trustScorePercent = clampScore(
    explicitTrustScore ?? Math.max(0, 100 - rawRiskScore! * 10)
  );
  const riskScore = rawRiskScore ?? Math.max(0, Math.round((100 - trustScorePercent) / 10));
  const findings = normalizeFindings(payload.risks);
  const approvals = normalizeApprovals(payload.approvals);
  const posture = deriveRiskLevel(riskScore);
  const scannedAt = payload.scanned_at || payload.updated_at || new Date().toISOString();
  const confidence = typeof payload.confidence === 'number' ? payload.confidence : undefined;

  return {
    walletAddress: context.walletAddress,
    network: context.network,
    dataSource: context.dataSource,
    scanId: payload.scan_id || payload.guardian_scan_id,
    trustScore: {
      score: trustScorePercent,
      normalized: trustScorePercent / 100,
      confidence,
    },
    posture,
    findings,
    approvals,
    freshness: {
      scannedAt,
    },
    recommendedActions: deriveRecommendedActions(findings, approvals),

    trustScorePercent,
    trustScoreRaw: trustScorePercent / 100,
    riskScore,
    riskLevel: posture.riskLevel,
    statusLabel: posture.statusLabel,
    statusTone: posture.statusTone,
    flags: findings,
    scannedAt,
    confidence,
  };
}

export function buildDemoGuardianPayload(walletAddress: string): GuardianRawScanPayload {
  return {
    trust_score_percent: 78,
    risk_score: 4,
    risks: [
      {
        type: 'UNLIMITED_APPROVAL',
        severity: 'high',
        description: 'Unlimited USDC approval remains active on a router contract.',
        recommendation: 'Review whether this approval is still needed and revoke if dormant.',
      },
      {
        type: 'STALE_APPROVAL',
        severity: 'medium',
        description: 'At least one approval has not been used for more than 90 days.',
        recommendation: 'Tighten old allowances to reduce drain risk.',
      },
    ],
    approvals: [
      {
        id: `${walletAddress}-demo-approval`,
        spender_address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        spender_name: '1inch Router',
        token_symbol: 'USDC',
        token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: 'unlimited',
        is_unlimited: true,
        approved_at: '2026-02-21T16:00:00.000Z',
        risk_level: 'high',
        chain_id: 1,
      },
    ],
    scanned_at: '2026-03-01T15:00:00.000Z',
    confidence: 0.86,
    scan_id: `demo-${walletAddress.slice(2, 10)}`,
  };
}
