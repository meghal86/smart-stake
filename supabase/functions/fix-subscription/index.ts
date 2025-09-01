import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const diagnostics = {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      checks: {},
      fixes_applied: []
    };

    // 1. Check auth.users
    const { data: authUser, error: authError } = await supabaseClient
      .from('auth.users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    diagnostics.checks.auth_user = {
      exists: !authError,
      data: authUser,
      error: authError?.message
    };

    // 2. Check public.users
    const { data: publicUser, error: publicUserError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    diagnostics.checks.public_user = {
      exists: !publicUserError,
      data: publicUser,
      error: publicUserError?.message
    };

    // 3. Check users_metadata
    const { data: userMetadata, error: metadataError } = await supabaseClient
      .from('users_metadata')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    diagnostics.checks.user_metadata = {
      exists: !metadataError,
      data: userMetadata,
      error: metadataError?.message
    };

    // 4. Check subscriptions table
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    diagnostics.checks.subscriptions = {
      exists: !subscriptionsError && subscriptions && subscriptions.length > 0,
      data: subscriptions,
      error: subscriptionsError?.message
    };

    // 5. Apply fixes if needed
    const { action } = await req.json().catch(() => ({ action: 'diagnose' }));

    if (action === 'fix') {
      // Fix 1: Ensure user record exists with Pro plan
      const { error: upsertError } = await supabaseClient
        .from('users')
        .upsert({
          user_id: user.id,
          email: user.email,
          plan: 'pro',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        // Try update instead
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({
            plan: 'pro',
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          diagnostics.fixes_applied.push({
            fix: 'update_user_plan',
            success: false,
            error: updateError.message
          });
        } else {
          diagnostics.fixes_applied.push({
            fix: 'update_user_plan',
            success: true
          });
        }
      } else {
        diagnostics.fixes_applied.push({
          fix: 'upsert_user_plan',
          success: true
        });
      }

      // Fix 2: Create/update metadata if needed
      const { error: metadataUpsertError } = await supabaseClient
        .from('users_metadata')
        .upsert({
          user_id: user.id,
          preferences: {
            notifications: true,
            email_updates: true,
            marketing: false,
            favorite_chains: [],
            favorite_tokens: [],
            min_whale_threshold: 1000000,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      diagnostics.fixes_applied.push({
        fix: 'upsert_metadata',
        success: !metadataUpsertError,
        error: metadataUpsertError?.message
      });

      // Re-check after fixes
      const { data: updatedUser, error: updatedUserError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      diagnostics.checks.updated_user = {
        exists: !updatedUserError,
        data: updatedUser,
        error: updatedUserError?.message
      };
    }

    return new Response(
      JSON.stringify(diagnostics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fix-subscription function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});