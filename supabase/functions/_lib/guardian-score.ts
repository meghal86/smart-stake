export interface GuardianEvidence {
  source: string;
  observedAt: number;
  ttl: number;
  cached?: boolean;
  latencyMs?: number;
  details?: Record<string, unknown>;
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
  valueUsd?: number;
  evidence?: GuardianEvidence;
  metadata?: Record<string, unknown>;
}

export interface GuardianFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  description: string;
  recommendation?: string;
  evidence?: GuardianEvidence;
  contractAddress?: string;
  txHash?: string;
  metadata?: Record<string, unknown>;
}

export interface GuardianRecommendedAction {
  id: string;
  kind: 'review_risks' | 'review_approvals' | 'rescan';
  label: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GuardianContractEvidence {
  address: string;
  isVerified: boolean;
  ageDays?: number | null;
  label?: string | null;
  evidence: GuardianEvidence;
}

export interface GuardianReputation {
  level: 'good' | 'neutral' | 'caution' | 'bad';
  score: number;
  reasons: string[];
  labels: string[];
  evidence: GuardianEvidence;
}

export interface GuardianMixerExposure {
  proximityScore: number;
  directInteractions: number;
  oneHopInteractions: number;
  lastInteraction: number | null;
  mixerAddresses: string[];
  evidence: GuardianEvidence;
}

export interface GuardianScoreFactor {
  category: string;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  description: string;
  evidence?: GuardianEvidence;
  metadata?: Record<string, unknown>;
}

export interface GuardianScoreInput {
  approvals: GuardianApproval[];
  reputation: GuardianReputation;
  mixer: GuardianMixerExposure;
  walletAgeDays?: number | null;
  contractEvidence: GuardianContractEvidence[];
}

export interface GuardianScoreOutput {
  trustScorePercent: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  statusLabel: string;
  statusTone: 'trusted' | 'warning' | 'danger';
  confidence: number;
  findings: GuardianFinding[];
  approvals: GuardianApproval[];
  recommendedActions: GuardianRecommendedAction[];
  factors: GuardianScoreFactor[];
  evidenceSummary: {
    sources: string[];
    contractsReviewed: number;
    directMixerInteractions: number;
    oneHopMixerInteractions: number;
    walletAgeDays?: number | null;
  };
}

const MAX_UINT256 = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);
const UNLIMITED_THRESHOLD = MAX_UINT256 - BigInt(1000);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function gradeRiskLevel(
  riskScore: number,
): Pick<GuardianScoreOutput, 'riskLevel' | 'statusLabel' | 'statusTone'> {
  if (riskScore > 7) {
    return {
      riskLevel: 'Critical',
      statusLabel: 'Critical risk',
      statusTone: 'danger',
    };
  }

  if (riskScore > 5) {
    return {
      riskLevel: 'High',
      statusLabel: 'High risk',
      statusTone: 'danger',
    };
  }

  if (riskScore > 3) {
    return {
      riskLevel: 'Medium',
      statusLabel: 'Needs attention',
      statusTone: 'warning',
    };
  }

  return {
    riskLevel: 'Low',
    statusLabel: 'Steady',
    statusTone: 'trusted',
  };
}

function scoreApproval(approval: GuardianApproval) {
  if (approval.riskLevel === 'critical') return 35;
  if (approval.riskLevel === 'high') return 22;
  if (approval.riskLevel === 'medium') return 10;
  return 0;
}

function summarizeApprovalFinding(approval: GuardianApproval): GuardianFinding {
  return {
    type: 'APPROVAL',
    severity: approval.riskLevel,
    description: approval.isUnlimited
      ? `${approval.spenderName || approval.spender} can still move ${approval.token} with unlimited access.`
      : `${approval.spenderName || approval.spender} still has an active ${approval.token} approval.`,
    recommendation: 'Review whether this token approval is still needed.',
    evidence: approval.evidence,
    contractAddress: approval.tokenAddress,
    metadata: approval.metadata,
  };
}

function buildRecommendedActions(
  findings: GuardianFinding[],
  approvals: GuardianApproval[],
): GuardianRecommendedAction[] {
  const actions: GuardianRecommendedAction[] = [];

  if (findings.some((finding) => ['critical', 'high'].includes(finding.severity))) {
    actions.push({
      id: 'review-risks',
      kind: 'review_risks',
      label: 'Review risks',
      description: 'Start with the highest-severity issue first.',
      priority: 'high',
    });
  }

  if (approvals.some((approval) => ['critical', 'high'].includes(approval.riskLevel))) {
    actions.push({
      id: 'review-approvals',
      kind: 'review_approvals',
      label: 'Review approvals',
      description: 'Check which apps can still move tokens on your behalf.',
      priority: 'high',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'rescan',
      kind: 'rescan',
      label: 'Rescan wallet',
      description: 'Confirm that the latest posture has not changed.',
      priority: 'low',
    });
  }

  return actions;
}

export function calculateEvidenceConfidence(evidence: GuardianEvidence[]): number {
  if (evidence.length === 0) {
    return 0.25;
  }

  let totalWeight = 0;
  let weightedConfidence = 0;
  const now = Date.now();

  for (const item of evidence) {
    const ageMs = Math.max(0, now - item.observedAt);
    const ttlMs = Math.max(item.ttl * 1000, 1);
    const freshness = 1 - Math.min(ageMs / ttlMs, 1) * 0.4;
    const sourceWeight = item.cached ? 0.9 : 1;
    const latencyPenalty = item.latencyMs && item.latencyMs > 5000 ? 0.95 : 1;
    const score = freshness * sourceWeight * latencyPenalty;
    const weight = item.cached ? 0.8 : 1;

    weightedConfidence += score * weight;
    totalWeight += weight;
  }

  return clamp(weightedConfidence / totalWeight, 0.2, 0.98);
}

export function calculateGuardianScore(input: GuardianScoreInput): GuardianScoreOutput {
  let score = 100;
  const factors: GuardianScoreFactor[] = [];
  const findings: GuardianFinding[] = [];
  const evidence: GuardianEvidence[] = [input.reputation.evidence, input.mixer.evidence];

  for (const approval of input.approvals) {
    if (approval.evidence) {
      evidence.push(approval.evidence);
    }

    const deduction = scoreApproval(approval);
    if (deduction > 0) {
      score -= deduction;
      factors.push({
        category: 'Approvals',
        impact: -deduction,
        severity: approval.riskLevel,
        description: approval.isUnlimited
          ? `${approval.token} has an unlimited approval`
          : `${approval.token} has an elevated-risk approval`,
        evidence: approval.evidence,
        metadata: {
          spender: approval.spender,
          token: approval.tokenAddress,
        },
      });
      findings.push(summarizeApprovalFinding(approval));
    }
  }

  if (input.mixer.directInteractions > 0) {
    score -= 40;
    factors.push({
      category: 'Mixer',
      impact: -40,
      severity: 'high',
      description: `Direct mixer interactions detected (${input.mixer.directInteractions})`,
      evidence: input.mixer.evidence,
      metadata: {
        mixerAddresses: input.mixer.mixerAddresses,
      },
    });
    findings.push({
      type: 'MIXER_EXPOSURE',
      severity: 'high',
      description: 'This wallet has direct interaction history with mixer infrastructure.',
      recommendation: 'Review whether those transactions were expected and document the source of funds.',
      evidence: input.mixer.evidence,
      metadata: {
        mixerAddresses: input.mixer.mixerAddresses,
      },
    });
  } else if (input.mixer.oneHopInteractions > 0) {
    score -= 15;
    factors.push({
      category: 'Mixer',
      impact: -15,
      severity: 'medium',
      description: `Indirect mixer exposure detected (${input.mixer.oneHopInteractions} one-hop interactions)`,
      evidence: input.mixer.evidence,
    });
    findings.push({
      type: 'MIXER_PROXIMITY',
      severity: 'medium',
      description: 'This wallet is one hop away from addresses that interacted with mixers.',
      recommendation: 'Review counterparties and large inbound transfers.',
      evidence: input.mixer.evidence,
    });
  }

  if (input.reputation.level === 'bad') {
    score -= 35;
    factors.push({
      category: 'Reputation',
      impact: -35,
      severity: 'high',
      description: 'Negative reputation indicators were found for this wallet.',
      evidence: input.reputation.evidence,
      metadata: {
        reasons: input.reputation.reasons,
        labels: input.reputation.labels,
      },
    });
    findings.push({
      type: 'REPUTATION',
      severity: 'high',
      description: input.reputation.reasons.join(' ') || 'Negative reputation indicators were found.',
      recommendation: 'Review recent transfers and counterparties before interacting further.',
      evidence: input.reputation.evidence,
      metadata: {
        labels: input.reputation.labels,
      },
    });
  } else if (input.reputation.level === 'caution') {
    score -= 8;
    factors.push({
      category: 'Reputation',
      impact: -8,
      severity: 'medium',
      description: 'Reputation evidence is limited or mixed.',
      evidence: input.reputation.evidence,
      metadata: {
        reasons: input.reputation.reasons,
      },
    });
  } else if (input.reputation.level === 'good') {
    score += 6;
    factors.push({
      category: 'Reputation',
      impact: 6,
      severity: 'low',
      description: 'Positive reputation indicators are present.',
      evidence: input.reputation.evidence,
      metadata: {
        reasons: input.reputation.reasons,
      },
    });
  }

  if (typeof input.walletAgeDays === 'number' && input.walletAgeDays < 30) {
    score -= 10;
    factors.push({
      category: 'Age',
      impact: -10,
      severity: 'medium',
      description: `Wallet is newly active (${Math.floor(input.walletAgeDays)} days old).`,
      metadata: {
        walletAgeDays: input.walletAgeDays,
      },
    });
    findings.push({
      type: 'NEW_WALLET',
      severity: 'medium',
      description: 'This wallet has a short onchain history, which lowers confidence.',
      recommendation: 'Keep approvals tight until the activity pattern is established.',
      metadata: {
        walletAgeDays: input.walletAgeDays,
      },
    });
  }

  for (const contract of input.contractEvidence) {
    evidence.push(contract.evidence);

    if (!contract.isVerified) {
      score -= 12;
      factors.push({
        category: 'Contract',
        impact: -12,
        severity: 'medium',
        description: 'A spender contract is not verified on the explorer.',
        evidence: contract.evidence,
        metadata: {
          contractAddress: contract.address,
          label: contract.label,
        },
      });
      findings.push({
        type: 'UNVERIFIED_CONTRACT',
        severity: 'medium',
        description: `${contract.label || contract.address} is not verified on the block explorer.`,
        recommendation: 'Be cautious with approvals to contracts whose code cannot be inspected.',
        evidence: contract.evidence,
        contractAddress: contract.address,
      });
    } else if (typeof contract.ageDays === 'number' && contract.ageDays < 14) {
      score -= 6;
      factors.push({
        category: 'Contract',
        impact: -6,
        severity: 'low',
        description: 'A spender contract is recently deployed.',
        evidence: contract.evidence,
        metadata: {
          contractAddress: contract.address,
          ageDays: contract.ageDays,
          label: contract.label,
        },
      });
    }
  }

  const trustScorePercent = clamp(Math.round(score), 0, 100);
  const riskScore = clamp(Number(((100 - trustScorePercent) / 10).toFixed(1)), 0, 10);
  const posture = gradeRiskLevel(riskScore);
  const confidence = calculateEvidenceConfidence(evidence);
  const recommendedActions = buildRecommendedActions(findings, input.approvals);

  return {
    trustScorePercent,
    riskScore,
    riskLevel: posture.riskLevel,
    statusLabel: posture.statusLabel,
    statusTone: posture.statusTone,
    confidence,
    findings,
    approvals: input.approvals,
    recommendedActions,
    factors,
    evidenceSummary: {
      sources: Array.from(new Set(evidence.map((item) => item.source))),
      contractsReviewed: input.contractEvidence.length,
      directMixerInteractions: input.mixer.directInteractions,
      oneHopMixerInteractions: input.mixer.oneHopInteractions,
      walletAgeDays: input.walletAgeDays,
    },
  };
}

export function isUnlimitedAllowance(rawAmount: string) {
  try {
    return BigInt(rawAmount) >= UNLIMITED_THRESHOLD;
  } catch {
    return false;
  }
}
