/**
 * Supabase Edge Function: investments-save
 * 
 * Handles save/bookmark functionality for investment primitives
 * 
 * POST /functions/v1/investments-save - Save/bookmark an item
 * GET /functions/v1/investments-save - Retrieve saved items
 * DELETE /functions/v1/investments-save - Remove saved items
 * 
 * Requirements: 12.1, 12.4, 12.6
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// Input validation
function validateInvestmentData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!data.kind || !['save', 'bookmark', 'wallet_role'].includes(data.kind)) {
    return { valid: false, error: 'kind must be one of: save, bookmark, wallet_role' };
  }

  if (!data.ref_id || typeof data.ref_id !== 'string' || data.ref_id.trim().length === 0) {
    return { valid: false, error: 'ref_id is required and must be a non-empty string' };
  }

  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const method = req.method;
    const url = new URL(req.url);

    if (method === 'POST') {
      // Save/bookmark an investment
      const body = await req.json();
      const validation = validateInvestmentData(body);
      
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error,
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Upsert the investment
      const { data, error } = await supabaseClient
        .from('user_investments')
        .upsert(
          {
            user_id: user.id,
            kind: body.kind,
            ref_id: body.ref_id,
            payload: body.payload || null,
          },
          {
            onConflict: 'user_id,kind,ref_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Database error saving investment:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to save investment',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            id: data.id,
            kind: data.kind,
            ref_id: data.ref_id,
            payload: data.payload,
            created_at: data.created_at,
          },
          error: null,
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (method === 'GET') {
      // Retrieve saved investments
      const kind = url.searchParams.get('kind');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

      let query = supabaseClient
        .from('user_investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by kind if specified
      if (kind && ['save', 'bookmark', 'wallet_role'].includes(kind)) {
        query = query.eq('kind', kind);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching investments:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch investments',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            items: data || [],
            count: data?.length || 0,
          },
          error: null,
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (method === 'DELETE') {
      // Remove a saved investment
      const kind = url.searchParams.get('kind');
      const ref_id = url.searchParams.get('ref_id');

      if (!kind || !ref_id) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Both kind and ref_id query parameters are required',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!['save', 'bookmark', 'wallet_role'].includes(kind)) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid kind parameter',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabaseClient
        .from('user_investments')
        .delete()
        .eq('user_id', user.id)
        .eq('kind', kind)
        .eq('ref_id', ref_id);

      if (error) {
        console.error('Database error deleting investment:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete investment',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          data: { ok: true },
          error: null,
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed',
          },
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in investments-save function:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});