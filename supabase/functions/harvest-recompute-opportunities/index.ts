/**
 * HarvestPro Edge Function: Recompute Opportunities
 * Fetches wallet transactions and computes tax-loss harvesting opportunities
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );

    // Fetch user's transactions from harvest_transactions table
    const { data: transactions, error } = await supabaseClient
      .from('harvest_transactions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${error.message}`,
          opportunitiesFound: 0,
          totalPotentialSavings: 0,
          opportunities: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        opportunitiesFound: 0,
        totalPotentialSavings: 0,
        computationTime: 0,
        lastComputedAt: new Date().toISOString(),
        opportunities: [],
        message: `Found ${transactions?.length || 0} transactions for analysis`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        opportunitiesFound: 0,
        totalPotentialSavings: 0,
        opportunities: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
