/**
 * Guardian Adapter Layer for HarvestPro (Edge Functions)
 * Provides Guardian security scoring with mock fallback for development
 * 
 * Migrated from: src/lib/harvestpro/guardian-adapter.ts
 * Migration Date: 2025-01-24
 */

import type { RiskLevel } from './types.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface GuardianScore {
  token: string;
  score: number; // 0-10 scale
  riskLevel: RiskLevel;
  lastUpdated: Date;
  source: 'guardian' | 'mock' | 'cache';
}

export interface GuardianScanResult {
  token: string;
  score: number;
  riskFactors: string[];
  recommendations: string[];
  timestamp: string;
}

// ============================================================================
// CACHE
// ============================================================================

const guardianCache = new Map<string, { score: GuardianScore; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get cached Guardian score if available and not expired
 */
function getCachedScore(token: string): GuardianScore | null {
  const cached = guardianCache.get(token.toUpperCase());
  
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    guardianCache.delete(token.toUpperCase());
    return null;
  }
  
  // Return cached score with source updated to 'cache'
  return {
    ...cached.score,
    source: 'cache',
  };
}

/**
 * Cache Guardian score
 */
function cacheScore(score: GuardianScore): void {
  guardianCache.set(score.token.toUpperCase(), {
    score,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ============================================================================
// MOCK GUARDIAN SERVICE (for development)
// ============================================================================

/**
 * Generate mock Guardian score based on token characteristics
 * 
 * This is used for development/testing when Guardian API is unavailable
 */
function generateMockScore(token: string): GuardianScore {
  // Deterministic scoring based on token name
  const hash = token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 3 + (hash % 8); // Score between 3-10
  
  let riskLevel: RiskLevel;
  if (score <= 3) riskLevel = 'HIGH';
  else if (score <= 6) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  return {
    token: token.toUpperCase(),
    score,
    riskLevel,
    lastUpdated: new Date(),
    source: 'mock',
  };
}

// ============================================================================
// GUARDIAN API INTEGRATION
// ============================================================================

/**
 * Fetch Guardian score from API
 * 
 * Requirements 15.1-15.4: Integrate with Guardian for risk scoring
 */
async function fetchGuardianScore(token: string): Promise<GuardianScore> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const GUARDIAN_API_KEY = Deno.env.get('GUARDIAN_API_KEY');
  
  if (!SUPABASE_URL || !GUARDIAN_API_KEY) {
    console.warn('Guardian API not configured, using mock scores');
    return generateMockScore(token);
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardian-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GUARDIAN_API_KEY}`,
      },
      body: JSON.stringify({
        token: token.toUpperCase(),
        scan_type: 'token',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Guardian API error: ${response.status}`);
    }
    
    const result: GuardianScanResult = await response.json();
    
    // Map Guardian score to risk level
    let riskLevel: RiskLevel;
    if (result.score <= 3) riskLevel = 'HIGH';
    else if (result.score <= 6) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
    
    return {
      token: token.toUpperCase(),
      score: result.score,
      riskLevel,
      lastUpdated: new Date(result.timestamp),
      source: 'guardian',
    };
  } catch (error) {
    console.warn(`Guardian API unavailable for ${token}, using mock score:`, error);
    return generateMockScore(token);
  }
}


// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get Guardian score for a token with caching and fallback
 * 
 * Flow:
 * 1. Check cache (1 hour TTL)
 * 2. Try Guardian API
 * 3. Fallback to mock if API unavailable
 * 
 * @param token - Token symbol (e.g., "ETH", "BTC")
 * @param forceRefresh - Skip cache and fetch fresh score
 * @returns Guardian score with risk level
 */
export async function getGuardianScore(
  token: string,
  forceRefresh: boolean = false
): Promise<GuardianScore> {
  const normalizedToken = token.toUpperCase();
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedScore(normalizedToken);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch from Guardian API (with mock fallback)
  const score = await fetchGuardianScore(normalizedToken);
  
  // Cache the result
  cacheScore(score);
  
  return score;
}

/**
 * Get Guardian scores for multiple tokens in batch
 * 
 * @param tokens - Array of token symbols
 * @param forceRefresh - Skip cache and fetch fresh scores
 * @returns Map of token to Guardian score
 */
export async function getGuardianScores(
  tokens: string[],
  forceRefresh: boolean = false
): Promise<Map<string, GuardianScore>> {
  const scores = new Map<string, GuardianScore>();
  
  // Fetch scores in parallel
  const promises = tokens.map(async (token) => {
    const score = await getGuardianScore(token, forceRefresh);
    scores.set(token.toUpperCase(), score);
  });
  
  await Promise.all(promises);
  
  return scores;
}

/**
 * Check if Guardian API is available
 * 
 * @returns True if Guardian API is responding
 */
export async function isGuardianAvailable(): Promise<boolean> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const GUARDIAN_API_KEY = Deno.env.get('GUARDIAN_API_KEY');
  
  if (!SUPABASE_URL || !GUARDIAN_API_KEY) {
    return false;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardian-healthz`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GUARDIAN_API_KEY}`,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear Guardian score cache
 * 
 * @param token - Optional token to clear, or clear all if not specified
 */
export function clearGuardianCache(token?: string): void {
  if (token) {
    guardianCache.delete(token.toUpperCase());
  } else {
    guardianCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getGuardianCacheStats(): {
  size: number;
  tokens: string[];
} {
  return {
    size: guardianCache.size,
    tokens: Array.from(guardianCache.keys()),
  };
}

// ============================================================================
// RISK CLASSIFICATION (from opportunity-detection.ts)
// ============================================================================

/**
 * Classify risk level based on Guardian score
 * 
 * Requirements 15.1-15.3:
 * - Score <= 3: HIGH RISK
 * - Score 4-6: MEDIUM RISK
 * - Score >= 7: LOW RISK
 * 
 * @param guardianScore - Guardian score (0-10)
 * @returns Risk level classification
 */
export function classifyRiskFromScore(guardianScore: number): RiskLevel {
  if (guardianScore <= 3) {
    return 'HIGH';
  } else if (guardianScore >= 4 && guardianScore <= 6) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Get risk color for UI display
 * 
 * @param riskLevel - Risk level
 * @returns CSS color variable
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'var(--harvest-risk-low)';
    case 'MEDIUM':
      return 'var(--harvest-risk-medium)';
    case 'HIGH':
      return 'var(--harvest-risk-high)';
  }
}

/**
 * Get risk label for UI display
 * 
 * @param riskLevel - Risk level
 * @returns Human-readable label
 */
export function getRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'Low Risk';
    case 'MEDIUM':
      return 'Medium Risk';
    case 'HIGH':
      return 'High Risk';
  }
}

/**
 * Get risk description
 * 
 * @param riskLevel - Risk level
 * @returns Description of risk level
 */
export function getRiskDescription(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'This token has a strong security profile with minimal risk factors.';
    case 'MEDIUM':
      return 'This token has some risk factors that should be considered before harvesting.';
    case 'HIGH':
      return 'This token has significant risk factors. Proceed with caution.';
  }
}
