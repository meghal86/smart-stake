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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Try different table names
    const tables = ['alerts', 'alert_events', 'whale_alerts', 'transactions'];
    const results: any = {};

    for (const table of tables) {
      try {
        const { data, error, count } = await supabaseClient
          .from(table)
          .select('*', { count: 'exact' })
          .limit(3);
        
        results[table] = {
          exists: !error,
          count: count || 0,
          sample: data?.slice(0, 2) || [],
          error: error?.message
        };
      } catch (e) {
        results[table] = { exists: false, error: e.message };
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});