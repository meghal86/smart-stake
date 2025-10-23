/**
 * Guardian Revoke Approval Edge Function
 * Generates unsigned transaction data for revoking token approvals
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RevokeRequest {
  token: string;
  spender: string;
  user: string;
  chain: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildRevokeTx(token: string, spender: string) {
  // ERC20 approve(address spender, uint256 amount) function selector
  const selector = '0x095ea7b3';
  
  // Encode spender address (32 bytes, padded)
  const spenderParam = spender.slice(2).padStart(64, '0');
  
  // Encode amount = 0 (32 bytes)
  const amountParam = '0'.padStart(64, '0');
  
  const data = `${selector}${spenderParam}${amountParam}`;
  
  return {
    to: token,
    data,
    value: '0x0',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RevokeRequest = await req.json();
    const { token, spender, user, chain } = body;

    // Validate addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(token)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid token address' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!addressRegex.test(spender)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid spender address' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build transaction
    const tx = buildRevokeTx(token, spender);

    return new Response(
      JSON.stringify({
        success: true,
        data: tx,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Revoke error:', error);
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

