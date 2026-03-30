/**
 * Guardian Revoke v2 - Idempotent with Pre-Simulation
 * World-class revoke implementation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger, generateRequestId } from '../_lib/log.ts';
import { checkIdempotency, getIdempotency } from '../_lib/rate-limit.ts';
import { simulateTransaction, calculateRiskDelta } from '../_lib/simulate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevokeRequest {
  token?: string;
  spender?: string;
  user: string;
  chain: string;
  idempotencyKey: string;
  dryRun?: boolean;
  approvals?: Array<{
    token: string;
    spender: string;
  }>;
}

function buildRevokeTx(token: string, spender: string): {
  to: string;
  data: string;
  value: string;
} {
  // ERC20 approve(address spender, uint256 amount) = 0x095ea7b3
  const selector = '0x095ea7b3';
  const spenderParam = spender.slice(2).padStart(64, '0');
  const amountParam = '0'.padStart(64, '0'); // Revoke = 0

  return {
    to: token,
    data: `${selector}${spenderParam}${amountParam}`,
    value: '0x0',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const logger = createLogger(requestId);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    const body: RevokeRequest = await req.json();
    const { token, spender, user, chain, idempotencyKey, dryRun = false } = body;
    const approvals = Array.isArray(body.approvals) && body.approvals.length > 0
      ? body.approvals
      : token && spender
        ? [{ token, spender }]
        : [];

    logger.info('revoke_requested', { approvals, user, chain, idempotencyKey, dryRun });

    // Validate addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(user) || approvals.length === 0 || approvals.some((item) => !addressRegex.test(item.token) || !addressRegex.test(item.spender))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid address format' },
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'idempotencyKey required' },
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });
      const { data } = await authClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check idempotency
    const exists = await getIdempotency(idempotencyKey);
    if (exists) {
      logger.warn('duplicate_request', { idempotencyKey });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DUPLICATE_REQUEST',
            message: 'This revoke request was already processed',
          },
          requestId,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chainIds: Record<string, number> = {
      ethereum: 1,
      base: 8453,
      arbitrum: 42161,
      polygon: 137,
    };
    const chainId = chainIds[chain.toLowerCase()] || 1;
    const simulations = [];
    let totalGasEstimate = 0n;

    for (const approval of approvals) {
      const tx = buildRevokeTx(approval.token, approval.spender);
      const simulation = await simulateTransaction(
        {
          from: user,
          to: tx.to,
          data: tx.data,
          value: tx.value,
        },
        chainId,
      );

      if (!simulation.success) {
        logger.error('simulation_failed', new Error(simulation.reason));
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'SIMULATION_FAILED',
              message: `Transaction will fail: ${simulation.reason}`,
            },
            requestId,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const gasEstimate = BigInt(simulation.gasEstimate || '0');
      totalGasEstimate += gasEstimate;
      simulations.push({
        approval,
        tx,
        gasEstimate,
        simulation,
      });
    }

    const scoreDelta = calculateRiskDelta(approvals.length);

    // Store idempotency key (5 min TTL)
    await checkIdempotency(idempotencyKey, 300);

    let operationId: string | undefined;
    if (userId) {
      const operationInsert = await serviceSupabase
        .from('guardian_remediation_operations')
        .insert({
          user_id: userId,
          wallet_address: user,
          wallet_address_lc: user.toLowerCase(),
          operation_type: approvals.length > 1 ? 'batch_revoke' : 'revoke',
          network: chain,
          token_address: approvals[0].token,
          spender: approvals[0].spender,
          status: dryRun ? 'prepared' : 'requested',
          idempotency_key: idempotencyKey,
          gas_estimate: totalGasEstimate.toString(),
          score_delta_min: scoreDelta.min,
          score_delta_max: scoreDelta.max,
          simulation: {
            dryRun,
            approvals,
            steps: simulations.map((item) => ({
              token: item.approval.token,
              spender: item.approval.spender,
              gasEstimate: item.gasEstimate.toString(),
              simulation: item.simulation,
            })),
          },
        })
        .select('id')
        .single();

      if (!operationInsert.error) {
        operationId = operationInsert.data?.id;
      }
    }

    logger.info('revoke_success', { gasEstimate: totalGasEstimate.toString(), scoreDelta, operationId });

    // Return unsigned transaction
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          to: simulations[0].tx.to,
          data: simulations[0].tx.data,
          value: simulations[0].tx.value,
          gasEstimate: totalGasEstimate.toString(),
          scoreDelta,
          simulation: {
            success: true,
            steps: simulations.map((item) => ({
              token: item.approval.token,
              spender: item.approval.spender,
              gasEstimate: item.gasEstimate.toString(),
            })),
          },
          operationId,
        },
        requestId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      }
    );
  } catch (error) {
    logger.error('revoke_error', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      }
    );
  }
});
