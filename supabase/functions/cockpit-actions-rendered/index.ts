/**
 * Supabase Edge Function: cockpit-actions-rendered
 * 
 * POST /functions/v1/cockpit-actions-rendered
 * 
 * Records which actions were rendered in the Action Preview.
 * Used for duplicate detection - actions shown recently get a -30 penalty.
 * 
 * Body: { dedupe_keys: string[] } (max 3)
 * 
 * Rules:
 * - MUST be called only after ActionPreview actually renders
 * - Uses ON CONFLICT DO UPDATE to refresh shown_at (upsert with refresh)
 * - Guards against re-render spam: only update if shown_at < now() - 30 seconds
 * 
 * Requirements: Duplicate Detection (Locked)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Minimum time between updates for the same dedupe_key (30 seconds)
 * Guards against re-render spam
 */
const SPAM_GUARD_MS = 30 * 1000;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is allowed' },
        meta: { ts: new Date().toISOString() },
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dedupe_keys
    const { dedupe_keys } = body;
    
    if (!Array.isArray(dedupe_keys)) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'dedupe_keys must be an array' },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dedupe_keys.length === 0 || dedupe_keys.length > 3) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'dedupe_keys must have 1-3 items' },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each key is a string
    for (const key of dedupe_keys) {
      if (typeof key !== 'string' || key.length === 0) {
        return new Response(
          JSON.stringify({
            data: null,
            error: { code: 'VALIDATION_ERROR', message: 'Each dedupe_key must be a non-empty string' },
            meta: { ts: new Date().toISOString() },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const results: { key: string; updated: boolean }[] = [];

    // Process each dedupe_key
    for (const dedupeKey of dedupe_keys) {
      // First, try to get existing record
      const { data: existing } = await supabase
        .from('shown_actions')
        .select('shown_at')
        .eq('user_id', user.id)
        .eq('dedupe_key', dedupeKey)
        .single();

      if (existing) {
        // Check spam guard - only update if shown_at is old enough
        const shownAtMs = new Date(existing.shown_at).getTime();
        const timeSinceShown = nowMs - shownAtMs;
        
        if (timeSinceShown >= SPAM_GUARD_MS) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('shown_actions')
            .update({ shown_at: nowIso })
            .eq('user_id', user.id)
            .eq('dedupe_key', dedupeKey);

          if (updateError) {
            console.error('Error updating shown_actions:', updateError);
            results.push({ key: dedupeKey, updated: false });
          } else {
            results.push({ key: dedupeKey, updated: true });
          }
        } else {
          // Spam guard triggered - skip update
          results.push({ key: dedupeKey, updated: false });
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shown_actions')
          .insert({
            user_id: user.id,
            dedupe_key: dedupeKey,
            shown_at: nowIso,
          });

        if (insertError) {
          // Handle unique constraint violation (race condition)
          if (insertError.code === '23505') {
            // Another request inserted the row, try to update
            const { error: retryError } = await supabase
              .from('shown_actions')
              .update({ shown_at: nowIso })
              .eq('user_id', user.id)
              .eq('dedupe_key', dedupeKey);

            if (retryError) {
              console.error('Error retrying shown_actions update:', retryError);
              results.push({ key: dedupeKey, updated: false });
            } else {
              results.push({ key: dedupeKey, updated: true });
            }
          } else {
            console.error('Error inserting shown_actions:', insertError);
            results.push({ key: dedupeKey, updated: false });
          }
        } else {
          results.push({ key: dedupeKey, updated: true });
        }
      }
    }

    const updatedCount = results.filter(r => r.updated).length;

    return new Response(
      JSON.stringify({
        data: {
          ok: true,
          updated_count: updatedCount,
          total_count: dedupe_keys.length,
        },
        error: null,
        meta: { ts: nowIso },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cockpit actions-rendered error:', error);
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
