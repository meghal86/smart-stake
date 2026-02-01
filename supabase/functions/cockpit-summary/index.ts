/**
 * Supabase Edge Function: cockpit-summary
 * 
 * GET /functions/v1/cockpit-summary
 * 
 * Returns the cockpit summary including Today Card state, action preview,
 * counters, and provider status with degraded mode detection.
 * 
 * Requirements: 3.3, 3.4, 6.1, 6.9, 16.1, 16.2, 15.1, 15.2, 15.4
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface ProviderStatus {
  state: 'online' | 'degraded' | 'offline';
  detail: string | null;
}

interface ProviderHealthCheck {
  provider: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime?: number;
}

/**
 * Determines provider status and degraded mode
 */
async function determineProviderStatus(walletScope: 'active' | 'all'): Promise<{
  provider_status: ProviderStatus;
  degraded_mode: boolean;
}> {
  try {
    // Simulate provider health checks
    const healthChecks = await Promise.allSettled([
      checkRPCHealth('ethereum'),
      checkRPCHealth('base'), 
      checkRPCHealth('arbitrum'),
      checkIndexerHealth('guardian'),
      checkIndexerHealth('hunter'),
    ]);

    let worstStatus: 'online' | 'degraded' | 'offline' = 'online';
    const issues: string[] = [];

    healthChecks.forEach((result, index) => {
      if (result.status === 'rejected') {
        issues.push(`Health check ${index} failed`);
        worstStatus = 'offline';
      } else {
        const health = result.value;
        if (health.status === 'offline') {
          issues.push(`${health.provider} is offline`);
          worstStatus = 'offline';
        } else if (health.status === 'degraded' && worstStatus !== 'offline') {
          issues.push(`${health.provider} is degraded`);
          worstStatus = 'degraded';
        }
      }
    });

    const degraded_mode = worstStatus !== 'online';

    return {
      provider_status: {
        state: worstStatus,
        detail: issues.length > 0 ? issues.join('; ') : null,
      },
      degraded_mode,
    };
  } catch (error) {
    console.error('Error determining provider status:', error);
    
    return {
      provider_status: {
        state: 'degraded',
        detail: 'Health check system error',
      },
      degraded_mode: true,
    };
  }
}

/**
 * Simulate RPC health check
 */
async function checkRPCHealth(chain: string): Promise<ProviderHealthCheck> {
  const startTime = Date.now();
  
  // Simulate network delay
  const delay = Math.random() * 2000; // 0-2 seconds
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const responseTime = Date.now() - startTime;
  
  // Simulate occasional failures
  if (Math.random() < 0.05) { // 5% failure rate
    throw new Error(`RPC call failed for ${chain}`);
  }
  
  let status: 'online' | 'degraded' | 'offline' = 'online';
  if (responseTime > 10000) {
    status = 'offline';
  } else if (responseTime > 1200) {
    status = 'degraded';
  }

  return {
    provider: `rpc_${chain}`,
    status,
    responseTime,
  };
}

/**
 * Simulate indexer health check
 */
async function checkIndexerHealth(service: string): Promise<ProviderHealthCheck> {
  const startTime = Date.now();
  
  // Simulate network delay
  const delay = Math.random() * 1500; // 0-1.5 seconds
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const responseTime = Date.now() - startTime;
  
  // Simulate occasional failures
  if (Math.random() < 0.03) { // 3% failure rate
    throw new Error(`Indexer call failed for ${service}`);
  }
  
  let status: 'online' | 'degraded' | 'offline' = 'online';
  if (responseTime > 10000) {
    status = 'offline';
  } else if (responseTime > 1200) {
    status = 'degraded';
  }

  return {
    provider: `indexer_${service}`,
    status,
    responseTime,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const walletScope = (url.searchParams.get('wallet_scope') || 'active') as 'active' | 'all';
    
    if (walletScope !== 'active' && walletScope !== 'all') {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'wallet_scope must be "active" or "all"' },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowIso = new Date().toISOString();

    // Determine provider status and degraded mode
    const { provider_status, degraded_mode } = await determineProviderStatus(walletScope);

    // Mock data for now - in production this would fetch real data
    const mockSummary = {
      wallet_scope: walletScope,
      today_card: {
        kind: 'daily_pulse' as const,
        anchor_metric: '3 new · 2 expiring',
        context_line: 'Since your last open',
        primary_cta: { label: 'Open today\'s pulse', href: '/cockpit#pulse' },
        secondary_cta: { label: 'Explore Hunter', href: '/hunter' },
      },
      action_preview: [
        {
          id: 'act_123',
          lane: 'Protect' as const,
          title: 'Revoke unused approval: Uniswap Router',
          severity: 'high' as const,
          provenance: 'simulated' as const,
          is_executable: !degraded_mode, // Disable in degraded mode
          cta: { 
            kind: degraded_mode ? 'Review' as const : 'Fix' as const, 
            href: '/action-center?intent=act_123' 
          },
          impact_chips: [
            { kind: 'gas_est_usd', value: 0.42 },
            { kind: 'risk_delta', value: -12 }
          ],
          event_time: '2026-01-09T15:22:00Z',
          expires_at: '2026-01-10T03:00:00Z',
          freshness: 'updated' as const,
          urgency_score: 92,
          relevance_score: 15,
          score: 262,
          source: { kind: 'guardian', ref_id: 'finding_123' },
        }
      ],
      counters: {
        new_since_last: 7,
        expiring_soon: 2,
        critical_risk: 0,
        pending_actions: 1,
      },
      provider_status,
      degraded_mode,
    };

    // Build response
    const response = {
      data: mockSummary,
      error: null,
      meta: { ts: nowIso },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cockpit summary error:', error);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        meta: { ts: new Date().toISOString() },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});