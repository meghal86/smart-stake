/**
 * Guardian Revoke v2 - Idempotent with Pre-Simulation
 * World-class revoke implementation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLogger, generateRequestId } from '../_lib/log.ts';
import { checkIdempotency, getIdempotency } from '../_lib/rate-limit.ts';
import { simulateTransaction, calculateRiskDelta } from '../_lib/simulate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevokeRequest {
  token: string;
  spender: string;
  user: string;
  chain: string;
  idempotencyKey: string;
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

  try {
    const body: RevokeRequest = await req.json();
    const { token, spender, user, chain, idempotencyKey } = body;

    logger.info('revoke_requested', { token, spender, user, chain, idempotencyKey });

    // Validate addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(token) || !addressRegex.test(spender) || !addressRegex.test(user)) {
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

    // Build transaction
    const tx = buildRevokeTx(token, spender);

    // Pre-simulate
    const chainIds: Record<string, number> = {
      ethereum: 1,
      base: 8453,
      arbitrum: 42161,
      polygon: 137,
    };
    const chainId = chainIds[chain.toLowerCase()] || 1;

    const simulation = await simulateTransaction(
      {
        from: user,
        to: tx.to,
        data: tx.data,
        value: tx.value,
      },
      chainId
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate risk delta (assuming 1 approval = 15 points back)
    const scoreDelta = calculateRiskDelta(1);

    // Store idempotency key (5 min TTL)
    await checkIdempotency(idempotencyKey, 300);

    logger.info('revoke_success', { gasEstimate: simulation.gasEstimate, scoreDelta });

    // Return unsigned transaction
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          to: tx.to,
          data: tx.data,
          value: tx.value,
          gasEstimate: simulation.gasEstimate,
          scoreDelta,
          simulation: {
            success: true,
          },
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

