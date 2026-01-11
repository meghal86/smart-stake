/**
 * Supabase Edge Function: alert-rules
 * 
 * Handles alert rules management for investment primitives
 * 
 * GET /functions/v1/alert-rules - Retrieve alert rules
 * POST /functions/v1/alert-rules - Create alert rule
 * PUT /functions/v1/alert-rules - Update alert rule
 * DELETE /functions/v1/alert-rules - Delete alert rule
 * 
 * Requirements: 12.3, 12.5, 12.6
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Input validation for creating alert rules
function validateAlertRuleData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!data.rule || typeof data.rule !== 'object' || Object.keys(data.rule).length === 0) {
    return { valid: false, error: 'rule must be a non-empty object' };
  }

  if (data.is_enabled !== undefined && typeof data.is_enabled !== 'boolean') {
    return { valid: false, error: 'is_enabled must be a boolean' };
  }

  return { valid: true };
}

// Input validation for updating alert rules
function validateUpdateData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!data.id || typeof data.id !== 'number' || data.id <= 0) {
    return { valid: false, error: 'id must be a positive integer' };
  }

  if (data.rule !== undefined && (typeof data.rule !== 'object' || data.rule === null)) {
    return { valid: false, error: 'rule must be an object if provided' };
  }

  if (data.is_enabled !== undefined && typeof data.is_enabled !== 'boolean') {
    return { valid: false, error: 'is_enabled must be a boolean if provided' };
  }

  // At least one field must be provided for update
  if (data.rule === undefined && data.is_enabled === undefined) {
    return { valid: false, error: 'At least one field (rule or is_enabled) must be provided for update' };
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

    if (method === 'GET') {
      // Retrieve alert rules
      const enabled_only = url.searchParams.get('enabled_only') === 'true';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

      let query = supabaseClient
        .from('cockpit_alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by enabled status if requested
      if (enabled_only) {
        query = query.eq('is_enabled', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching alert rules:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch alert rules',
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
            rules: data || [],
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

    } else if (method === 'POST') {
      // Create a new alert rule
      const body = await req.json();
      const validation = validateAlertRuleData(body);
      
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

      const { data, error } = await supabaseClient
        .from('cockpit_alert_rules')
        .insert({
          user_id: user.id,
          rule: body.rule,
          is_enabled: body.is_enabled ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating alert rule:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create alert rule',
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
            rule: data.rule,
            is_enabled: data.is_enabled,
            created_at: data.created_at,
          },
          error: null,
          meta: { ts: new Date().toISOString() },
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (method === 'PUT') {
      // Update an existing alert rule
      const body = await req.json();
      const validation = validateUpdateData(body);
      
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

      // Build update object (only include fields that were provided)
      const updateData: Record<string, any> = {};
      if (body.rule !== undefined) {
        updateData.rule = body.rule;
      }
      if (body.is_enabled !== undefined) {
        updateData.is_enabled = body.is_enabled;
      }

      const { data, error } = await supabaseClient
        .from('cockpit_alert_rules')
        .update(updateData)
        .eq('id', body.id)
        .eq('user_id', user.id) // Ensure user can only update their own rules
        .select()
        .single();

      if (error) {
        console.error('Database error updating alert rule:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update alert rule',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Alert rule not found or access denied',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            id: data.id,
            rule: data.rule,
            is_enabled: data.is_enabled,
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

    } else if (method === 'DELETE') {
      // Delete an alert rule
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'id query parameter is required',
            },
            meta: { ts: new Date().toISOString() },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const ruleId = parseInt(id);
      if (isNaN(ruleId) || ruleId <= 0) {
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'id must be a positive integer',
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
        .from('cockpit_alert_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id); // Ensure user can only delete their own rules

      if (error) {
        console.error('Database error deleting alert rule:', error);
        return new Response(
          JSON.stringify({
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete alert rule',
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
    console.error('Unexpected error in alert-rules function:', error);
    
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