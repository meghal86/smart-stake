interface ApprovalRisk {
  token: string;
  spender: string;
  allowance: string;
  isUnlimited: boolean;
  riskLevel: 'high' | 'medium' | 'low';
}

interface MixerExposure {
  level: number; // 0-100
  interactions: number;
  lastInteraction?: string;
}

interface ReputationScore {
  score: number; // 0-100
  flags: string[];
}

interface TrustScoreInputs {
  approvals: ApprovalRisk[];
  mixers: MixerExposure;
  reputation: ReputationScore;
}

const RISK_WEIGHTS = {
  approvals: 0.4,
  mixers: 0.3,
  reputation: 0.3,
};

const KNOWN_RISKY_CONTRACTS = new Set([
  '0x1234567890123456789012345678901234567890', // Example risky contract
  // Add more known risky contracts
]);

export function computeTrustScore({ approvals, mixers, reputation }: TrustScoreInputs): number {
  // Calculate approval risk (0-100, higher = more risky)
  const approvalRisk = calculateApprovalRisk(approvals);
  
  // Mixer risk is already 0-100
  const mixerRisk = mixers.level;
  
  // Reputation risk (invert score so higher = more risky)
  const reputationRisk = 100 - reputation.score;
  
  // Weighted risk score
  const totalRisk = (
    approvalRisk * RISK_WEIGHTS.approvals +
    mixerRisk * RISK_WEIGHTS.mixers +
    reputationRisk * RISK_WEIGHTS.reputation
  );
  
  // Convert to trust score (100 - risk)
  return Math.max(0, Math.min(100, Math.round(100 - totalRisk)));
}

function calculateApprovalRisk(approvals: ApprovalRisk[]): number {
  if (approvals.length === 0) return 0;
  
  let riskScore = 0;
  const totalApprovals = approvals.length;
  
  for (const approval of approvals) {
    let approvalRisk = 0;
    
    // Unlimited approvals are riskier
    if (approval.isUnlimited) {
      approvalRisk += 30;
    }
    
    // Known risky contracts
    if (KNOWN_RISKY_CONTRACTS.has(approval.spender.toLowerCase())) {
      approvalRisk += 50;
    }
    
    // Risk level from external analysis
    switch (approval.riskLevel) {
      case 'high':
        approvalRisk += 40;
        break;
      case 'medium':
        approvalRisk += 20;
        break;
      case 'low':
        approvalRisk += 5;
        break;
    }
    
    riskScore += Math.min(100, approvalRisk);
  }
  
  return Math.min(100, riskScore / totalApprovals);
}

export function categorizeRisk(trustScore: number): {
  level: 'low' | 'medium' | 'high';
  label: string;
  color: string;
} {
  if (trustScore >= 80) {
    return {
      level: 'low',
      label: 'Excellent Security',
      color: 'text-emerald-400',
    };
  } else if (trustScore >= 60) {
    return {
      level: 'medium',
      label: 'Moderate Risk',
      color: 'text-yellow-400',
    };
  } else {
    return {
      level: 'high',
      label: 'Action Required',
      color: 'text-red-400',
    };
  }
}

export function generateRiskSummary(inputs: TrustScoreInputs): string {
  const { approvals, mixers, reputation } = inputs;
  const riskyApprovals = approvals.filter(a => a.riskLevel === 'high' || a.isUnlimited);
  
  if (riskyApprovals.length === 0 && mixers.level < 20 && reputation.score > 80) {
    return 'No active security flags detected.';
  }
  
  const issues = [];
  
  if (riskyApprovals.length > 0) {
    issues.push(`${riskyApprovals.length} risky approval${riskyApprovals.length > 1 ? 's' : ''}`);
  }
  
  if (mixers.level > 50) {
    issues.push('high mixer exposure');
  }
  
  if (reputation.score < 60) {
    issues.push('reputation concerns');
  }
  
  return `Detected ${issues.length} issue${issues.length > 1 ? 's' : ''}: ${issues.join(', ')}.`;
}