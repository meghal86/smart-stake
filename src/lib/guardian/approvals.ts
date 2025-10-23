/**
 * Token approval risk analysis
 */
import { Approval } from '../api/alchemy';

// Known scam/compromised spender addresses
export const KNOWN_SCAMS = [
  '0x0000000000000000000000000000000000000000',
  // Add more known scam addresses here
  // These would typically come from a maintained database
];

// High-risk protocols (past exploits, unverified, etc.)
export const HIGH_RISK_SPENDERS = [
  // Example addresses - in production, maintain a curated list
];

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const UNLIMITED_THRESHOLD = MAX_UINT256 - BigInt(1000); // Small buffer

/**
 * Check if an allowance is effectively unlimited
 */
export function isUnlimited(allowance: bigint): boolean {
  return allowance >= UNLIMITED_THRESHOLD;
}

/**
 * Calculate risk level for an approval
 */
export function calculateApprovalRisk(
  approval: Approval,
  usdValue?: number
): {
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
} {
  // Check for known scams
  if (KNOWN_SCAMS.includes(approval.spender.toLowerCase())) {
    return {
      riskLevel: 'high',
      reason: 'Approval granted to known scam address',
    };
  }

  // Check for unlimited approvals
  if (isUnlimited(approval.allowance)) {
    // High risk if high-value token
    if (usdValue && usdValue > 1000) {
      return {
        riskLevel: 'high',
        reason: `Unlimited approval to ${approval.symbol} (high value token)`,
      };
    }

    return {
      riskLevel: 'medium',
      reason: `Unlimited approval to ${approval.symbol}`,
    };
  }

  // Check for high-risk protocols
  if (HIGH_RISK_SPENDERS.includes(approval.spender.toLowerCase())) {
    return {
      riskLevel: 'medium',
      reason: 'Approval granted to high-risk protocol',
    };
  }

  // Limited approvals are generally low risk
  return {
    riskLevel: 'low',
    reason: `Limited approval (${approval.symbol})`,
  };
}

/**
 * Extended approval with risk assessment
 */
export interface ApprovalRisk extends Approval {
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  usdValue?: number;
}

/**
 * Get risky approvals for an address
 */
export async function getRiskyApprovals(
  address: string,
  chain: string,
  approvals: Approval[]
): Promise<ApprovalRisk[]> {
  const riskyApprovals: ApprovalRisk[] = [];

  for (const approval of approvals) {
    // Skip zero allowances
    if (approval.allowance === BigInt(0)) {
      continue;
    }

    // Calculate risk
    const risk = calculateApprovalRisk(approval);

    // Only include medium and high risk approvals
    if (risk.riskLevel === 'medium' || risk.riskLevel === 'high') {
      riskyApprovals.push({
        ...approval,
        ...risk,
      });
    }
  }

  return riskyApprovals;
}

/**
 * Format allowance for display
 */
export function formatAllowance(allowance: bigint, decimals: number): string {
  if (isUnlimited(allowance)) {
    return 'Unlimited';
  }

  const value = Number(allowance) / Math.pow(10, decimals);

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toFixed(2);
}

/**
 * Get approval summary statistics
 */
export function getApprovalStats(approvals: ApprovalRisk[]): {
  total: number;
  unlimited: number;
  high: number;
  medium: number;
  low: number;
} {
  return {
    total: approvals.length,
    unlimited: approvals.filter((a) => isUnlimited(a.allowance)).length,
    high: approvals.filter((a) => a.riskLevel === 'high').length,
    medium: approvals.filter((a) => a.riskLevel === 'medium').length,
    low: approvals.filter((a) => a.riskLevel === 'low').length,
  };
}

