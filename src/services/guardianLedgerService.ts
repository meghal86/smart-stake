import { supabase } from '@/integrations/supabase/client';

export interface GuardianStoredScan {
  id: string;
  wallet_address: string;
  network: string;
  trust_score: number;
  risk_score: number;
  risk_level: string;
  confidence: number;
  findings_count: number;
  approvals_count: number;
  scanned_at: string;
  status_label: string;
}

export interface GuardianStoredAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  body: string;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface GuardianOrgPosture {
  user_id: string;
  wallet_count: number;
  average_trust_score: number;
  average_risk_score: number;
  last_scanned_at: string | null;
  high_risk_wallets: number;
  total_findings: number;
  total_approvals: number;
}

export interface GuardianRemediationOperation {
  id: string;
  wallet_address: string;
  operation_type: 'revoke' | 'batch_revoke' | 'review';
  network: string;
  token_address: string | null;
  spender: string | null;
  status: 'prepared' | 'requested' | 'broadcast' | 'confirmed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  gas_estimate: string | null;
  score_delta_min: number | null;
  score_delta_max: number | null;
  simulation: Record<string, unknown>;
  receipt: Record<string, unknown>;
  error_message: string | null;
  requested_at: string;
  confirmed_at: string | null;
  updated_at: string;
}

export async function fetchGuardianScanHistory(walletAddress?: string) {
  if (!walletAddress) return [];

  const { data, error } = await supabase
    .from('guardian_wallet_scans')
    .select('id, wallet_address, network, trust_score, risk_score, risk_level, confidence, findings_count, approvals_count, scanned_at, status_label')
    .eq('wallet_address_lc', walletAddress.toLowerCase())
    .order('scanned_at', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data || []) as GuardianStoredScan[];
}

export async function fetchGuardianAlerts(walletAddress?: string) {
  if (!walletAddress) return [];

  const { data, error } = await supabase
    .from('guardian_alert_events')
    .select('id, alert_type, severity, title, body, status, created_at')
    .eq('wallet_address_lc', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data || []) as GuardianStoredAlert[];
}

export async function fetchGuardianOrgPosture() {
  const { data, error } = await supabase
    .from('guardian_org_posture')
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data || null) as GuardianOrgPosture | null;
}

export async function fetchGuardianRemediationOperations(walletAddress?: string) {
  const client = supabase as any;
  let query = client
    .from('guardian_remediation_operations')
    .select('id, wallet_address, operation_type, network, token_address, spender, status, tx_hash, gas_estimate, score_delta_min, score_delta_max, simulation, receipt, error_message, requested_at, confirmed_at, updated_at')
    .order('requested_at', { ascending: false })
    .limit(20);

  if (walletAddress) {
    query = query.eq('wallet_address_lc', walletAddress.toLowerCase());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as GuardianRemediationOperation[];
}

export async function updateGuardianRemediationOperation(
  operationId: string,
  patch: Partial<GuardianRemediationOperation> & {
    receipt?: Record<string, unknown>;
    simulation?: Record<string, unknown>;
  }
) {
  const client = supabase as any;
  const { data, error } = await client
    .from('guardian_remediation_operations')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operationId)
    .select('id, wallet_address, operation_type, network, token_address, spender, status, tx_hash, gas_estimate, score_delta_min, score_delta_max, simulation, receipt, error_message, requested_at, confirmed_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data as GuardianRemediationOperation;
}
