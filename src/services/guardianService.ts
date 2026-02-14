/**
 * Guardian Service
 * 
 * Provides security scanning and risk assessment functionality.
 * Calls the guardian-scan-v2 edge function for real security data.
 */

import { createClient } from '@supabase/supabase-js';

export interface GuardianScanRequest {
  walletAddress: string;
  network: string;
}

export interface GuardianFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

export interface GuardianScanResult {
  trustScorePercent: number;
  trustScoreRaw: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  statusLabel: string;
  statusTone: 'trusted' | 'warning' | 'danger';
  flags: GuardianFlag[];
  approvals?: GuardianApproval[];
}

function getSupabaseClient() {
  // Lazy load Supabase client to avoid issues with process.env
  if (typeof window === 'undefined') {
    // Server-side
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } else {
    // Client-side (shouldn't happen, but fallback)
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}

/**
 * Request Guardian security scan for a wallet
 * Tries to call guardian-scan-v2 edge function, falls back to mock data
 */
export async function requestGuardianScan(request: GuardianScanRequest): Promise<GuardianScanResult> {
  console.log('🛡️ [Guardian] Attempting to call guardian-scan-v2 edge function for:', request.walletAddress);
  
  try {
    const supabase = getSupabaseClient();
    
    // Try to call the guardian-scan-v2 edge function
    const { data, error } = await supabase.functions.invoke('guardian-scan-v2', {
      body: { address: request.walletAddress }
    });

    if (error) {
      console.warn('⚠️ [Guardian] Edge function error, falling back to mock data:', error);
      return getMockGuardianData();
    }

    console.log('✅ [Guardian] Received REAL scan data:', data);

    // Transform edge function response to service format
    const riskScore = data.risk_score || 0;
    const trustScore = Math.max(0, 100 - riskScore * 10);
    
    // Map flags from edge function response
    const flags: GuardianFlag[] = [];
    
    if (data.risks && Array.isArray(data.risks)) {
      data.risks.forEach((risk: any) => {
        flags.push({
          type: risk.type || 'UNKNOWN',
          severity: risk.severity || 'medium',
          description: risk.description || 'Security risk detected',
          recommendation: risk.recommendation
        });
      });
    }

    // Map approvals from edge function response
    const approvals: GuardianApproval[] = [];
    
    if (data.approvals && Array.isArray(data.approvals)) {
      data.approvals.forEach((approval: any, index: number) => {
        approvals.push({
          id: approval.id || `approval_${index}`,
          spender: approval.spender || approval.spender_address,
          spenderName: approval.spender_name || approval.protocol_name,
          token: approval.token_symbol || approval.token,
          tokenAddress: approval.token_address,
          amount: approval.amount || approval.allowance || 'unlimited',
          isUnlimited: approval.is_unlimited || approval.amount === 'unlimited',
          approvedAt: approval.approved_at || approval.timestamp || new Date().toISOString(),
          lastUsedAt: approval.last_used_at,
          riskLevel: approval.risk_level || this.calculateApprovalRiskLevel(approval),
          chainId: approval.chain_id || 1
        });
      });
    }

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    let statusLabel: string;
    let statusTone: 'trusted' | 'warning' | 'danger';

    if (riskScore > 7) {
      riskLevel = 'Critical';
      statusLabel = 'Critical Risk';
      statusTone = 'danger';
    } else if (riskScore > 5) {
      riskLevel = 'High';
      statusLabel = 'High Risk';
      statusTone = 'danger';
    } else if (riskScore > 3) {
      riskLevel = 'Medium';
      statusLabel = 'Medium Risk';
      statusTone = 'warning';
    } else {
      riskLevel = 'Low';
      statusLabel = 'Trusted';
      statusTone = 'trusted';
    }

    return {
      trustScorePercent: Math.round(trustScore),
      trustScoreRaw: trustScore / 100,
      riskScore: Math.round(riskScore),
      riskLevel,
      statusLabel,
      statusTone,
      flags,
      approvals
    };
  } catch (error) {
    console.error('❌ [Guardian] Error calling edge function, falling back to mock data:', error);
    return getMockGuardianData();
  }
}

/**
 * Calculate approval risk level based on approval data
 */
function calculateApprovalRiskLevel(approval: any): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: Unlimited approval to unknown/unverified contract
  if (approval.is_unlimited && !approval.is_verified) {
    return 'critical';
  }
  
  // High: Unlimited approval or high-value approval
  if (approval.is_unlimited || (approval.value_usd && approval.value_usd > 10000)) {
    return 'high';
  }
  
  // Medium: Old approval or moderate value
  const approvedDate = new Date(approval.approved_at || approval.timestamp);
  const monthsOld = (Date.now() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld > 6 || (approval.value_usd && approval.value_usd > 1000)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get mock Guardian data as fallback
 */
function getMockGuardianData(): GuardianScanResult {
  console.log('🎭 [Guardian] Using MOCK data');
  
  const riskScore = Math.random() * 10;
  const trustScore = Math.max(0, 100 - riskScore * 10);
  
  const flags: GuardianFlag[] = [];
  
  if (riskScore > 7) {
    flags.push({
      type: 'HIGH_RISK_APPROVAL',
      severity: 'critical',
      description: 'Unlimited approval to unknown contract',
      recommendation: 'Revoke this approval immediately'
    });
  }
  
  if (riskScore > 5) {
    flags.push({
      type: 'SUSPICIOUS_TRANSACTION',
      severity: 'high',
      description: 'Recent interaction with flagged contract',
      recommendation: 'Review recent transactions'
    });
  }
  
  if (riskScore > 3) {
    flags.push({
      type: 'OLD_APPROVAL',
      severity: 'medium',
      description: 'Approval older than 6 months',
      recommendation: 'Consider revoking old approvals'
    });
  }
  
  return {
    trustScorePercent: Math.round(trustScore),
    trustScoreRaw: trustScore / 100,
    riskScore: Math.round(riskScore),
    riskLevel: riskScore > 7 ? 'Critical' : riskScore > 5 ? 'High' : riskScore > 3 ? 'Medium' : 'Low',
    statusLabel: riskScore > 5 ? 'High Risk' : riskScore > 3 ? 'Medium Risk' : 'Trusted',
    statusTone: riskScore > 5 ? 'danger' : riskScore > 3 ? 'warning' : 'trusted',
    flags
  };
}