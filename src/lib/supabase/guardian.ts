/**
 * Guardian-specific Supabase client utilities
 */
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  wallet_address: string;
  tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  scan_type: 'wallet' | 'contract';
  target_address: string;
  trust_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  risk_factors: RiskFactor[];
  meta: ScanMeta;
  created_at: string;
}

export interface RiskFactor {
  category: 'Approvals' | 'Honeypot' | 'Hidden Mint' | 'Reputation' | 'Mixer' | 'Age' | 'Liquidity' | 'Taxes' | 'Contract';
  impact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  meta?: Record<string, unknown>;
}

export interface ScanMeta {
  chains: string[];
  lastScanAt: number;
  totals: {
    flags: number;
    critical: number;
  };
  versions?: Record<string, string>;
  timings?: Record<string, number>;
}

/**
 * Get or create a user by wallet address
 * Uses service role for upsert operations
 */
export async function getOrCreateUserByWallet(
  walletAddress: string
): Promise<{ id: string; tier: 'free' | 'pro' | 'enterprise' }> {
  // First try to get existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, tier')
    .eq('wallet_address', walletAddress.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    return {
      id: existingUser.id,
      tier: (existingUser.tier as 'free' | 'pro' | 'enterprise') || 'free',
    };
  }

  // Create new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      tier: 'free',
    })
    .select('id, tier')
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }

  return {
    id: newUser.id,
    tier: (newUser.tier as 'free' | 'pro' | 'enterprise') || 'free',
  };
}

/**
 * Insert a scan record
 */
export async function insertScan(scan: Omit<Scan, 'id' | 'created_at'>): Promise<Scan> {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: scan.user_id,
      scan_type: scan.scan_type,
      target_address: scan.target_address.toLowerCase(),
      trust_score: scan.trust_score,
      grade: scan.grade,
      risk_factors: scan.risk_factors as unknown,
      meta: scan.meta as unknown,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting scan:', error);
    throw new Error('Failed to insert scan');
  }

  return data as Scan;
}

/**
 * Get recent scans for a user
 */
export async function getUserScans(
  userId: string,
  limit = 10
): Promise<Scan[]> {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user scans:', error);
    return [];
  }

  return (data || []) as Scan[];
}

/**
 * Get the most recent scan for a specific address
 */
export async function getLatestScanForAddress(
  targetAddress: string
): Promise<Scan | null> {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('target_address', targetAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest scan:', error);
    return null;
  }

  return data as Scan | null;
}

/**
 * Count scans in the last 24 hours (for health checks)
 */
export async function countRecentScans(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo);

  if (error) {
    console.error('Error counting scans:', error);
    return 0;
  }

  return count || 0;
}

