/**
 * Approvals Module Tests
 */
import { describe, it, expect } from 'vitest';
import {
  isUnlimited,
  calculateApprovalRisk,
  formatAllowance,
  getApprovalStats,
  type Approval,
  type ApprovalRisk,
} from '@/lib/guardian/approvals';

describe('Unlimited Approval Detection', () => {
  it('should detect unlimited allowance', () => {
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    expect(isUnlimited(maxUint256)).toBe(true);
  });

  it('should detect near-unlimited allowance', () => {
    const nearMax = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe');
    expect(isUnlimited(nearMax)).toBe(true);
  });

  it('should not flag limited allowance', () => {
    const limited = BigInt('1000000000000000000'); // 1 ETH
    expect(isUnlimited(limited)).toBe(false);
  });
});

describe('Approval Risk Calculation', () => {
  const mockApproval: Approval = {
    token: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
    allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    symbol: 'USDT',
    decimals: 6,
  };

  it('should flag unlimited approvals as medium risk', () => {
    const result = calculateApprovalRisk(mockApproval);
    expect(result.riskLevel).toBe('medium');
    expect(result.reason).toContain('Unlimited');
  });

  it('should flag high-value unlimited approvals as high risk', () => {
    const result = calculateApprovalRisk(mockApproval, 10000); // $10k
    expect(result.riskLevel).toBe('high');
  });

  it('should flag limited approvals as low risk', () => {
    const limitedApproval = {
      ...mockApproval,
      allowance: BigInt('1000000'), // 1 USDT
    };
    const result = calculateApprovalRisk(limitedApproval);
    expect(result.riskLevel).toBe('low');
  });
});

describe('Allowance Formatting', () => {
  it('should format unlimited allowance', () => {
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    expect(formatAllowance(maxUint256, 18)).toBe('Unlimited');
  });

  it('should format large numbers with K suffix', () => {
    const amount = BigInt('5000000000000000000000'); // 5000 ETH
    expect(formatAllowance(amount, 18)).toBe('5.00K');
  });

  it('should format huge numbers with M suffix', () => {
    const amount = BigInt('2000000000000000000000000'); // 2M ETH
    expect(formatAllowance(amount, 18)).toBe('2.00M');
  });

  it('should format small numbers normally', () => {
    const amount = BigInt('100000000000000000'); // 0.1 ETH
    expect(formatAllowance(amount, 18)).toBe('0.10');
  });
});

describe('Approval Statistics', () => {
  const mockApprovals: ApprovalRisk[] = [
    {
      token: '0x1' as `0x${string}`,
      spender: '0xa' as `0x${string}`,
      allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      symbol: 'USDT',
      decimals: 6,
      riskLevel: 'high',
      reason: 'Unlimited',
    },
    {
      token: '0x2' as `0x${string}`,
      spender: '0xb' as `0x${string}`,
      allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      symbol: 'WETH',
      decimals: 18,
      riskLevel: 'medium',
      reason: 'Unlimited',
    },
    {
      token: '0x3' as `0x${string}`,
      spender: '0xc' as `0x${string}`,
      allowance: BigInt('1000000'),
      symbol: 'DAI',
      decimals: 18,
      riskLevel: 'low',
      reason: 'Limited',
    },
  ];

  it('should calculate correct statistics', () => {
    const stats = getApprovalStats(mockApprovals);
    expect(stats.total).toBe(3);
    expect(stats.unlimited).toBe(2);
    expect(stats.high).toBe(1);
    expect(stats.medium).toBe(1);
    expect(stats.low).toBe(1);
  });

  it('should handle empty approvals', () => {
    const stats = getApprovalStats([]);
    expect(stats.total).toBe(0);
    expect(stats.unlimited).toBe(0);
  });
});

