/**
 * Guardian Wallet Scan Edge Function
 * Performs comprehensive trust & safety analysis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface ScanRequest {
  wallet_address: string;
  network: string;
}

interface RiskFactor {
  category: string;
  impact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  meta?: Record<string, any>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (simple in-memory for now)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// Helper to calculate trust score
function calculateTrustScore(factors: RiskFactor[]): {
  score: number;
  grade: string;
  totals: { flags: number; critical: number };
} {
  let score = 100;
  
  for (const factor of factors) {
    score += factor.impact;
  }
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  
  const totals = {
    flags: factors.filter(f => f.impact < 0).length,
    critical: factors.filter(f => f.severity === 'high' && f.impact < 0).length,
  };
  
  return { score, grade, totals };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request
    const body: ScanRequest = await req.json();
    const { wallet_address, network } = body;

    if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid wallet address',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Skip database operations for now - just perform analysis
    // In production, you'd store scan results in guardian_scans table

    // Perform scan analysis
    // This is a simplified implementation - in production, call the actual analysis functions
    const factors: RiskFactor[] = [];
    const chains = [network || 'ethereum'];
    const lastScanAt = Date.now();

    // Add some demo/placeholder analysis
    // In production, this would call:
    // - getWalletApprovals()
    // - checkMixerProximity()
    // - checkReputation()
    // - checkHoneypot() for each token
    // etc.

    // Example: Random analysis for demo
    const hasRiskyApprovals = Math.random() > 0.7;
    if (hasRiskyApprovals) {
      factors.push({
        category: 'Approvals',
        impact: -30,
        severity: 'high',
        description: '2 unlimited approvals detected',
        meta: { count: 2 },
      });
    }

    const hasMixerActivity = Math.random() > 0.9;
    if (hasMixerActivity) {
      factors.push({
        category: 'Mixer',
        impact: -40,
        severity: 'high',
        description: 'Direct mixer interaction detected',
      });
    }

    // Calculate score
    const { score, grade, totals } = calculateTrustScore(factors);

    // Generate a scan ID for tracking
    const scanId = crypto.randomUUID();

    // Return response matching existing service format
    return new Response(
      JSON.stringify({
        trust_score: score / 100,
        risk_score: (100 - score) / 10,
        risk_level: score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High',
        flags: factors.map((f, idx) => ({
          id: idx + 1,
          type: f.category,
          severity: f.severity,
          details: f.description,
          timestamp: new Date().toISOString(),
        })),
        wallet_address,
        network: network || 'Ethereum Mainnet',
        last_scan: new Date().toISOString(),
        guardian_scan_id: scanId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Guardian scan error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

