import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Also initialize with anon key (same as app uses)
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Test 1: Query with service role (admin access)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', user.id);

    // Test 2: Query with anon key (same as app)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('users')
      .select('*')
      .eq('user_id', user.id);

    // Test 3: Raw SQL query
    const { data: rawData, error: rawError } = await supabaseAdmin
      .rpc('get_user_plan', { target_user_id: user.id });

    const result = {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      tests: {
        admin_query: {
          success: !adminError,
          data: adminData,
          error: adminError?.message
        },
        anon_query: {
          success: !anonError,
          data: anonData,
          error: anonError?.message
        },
        raw_query: {
          success: !rawError,
          data: rawData,
          error: rawError?.message
        }
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test-user-plan:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});