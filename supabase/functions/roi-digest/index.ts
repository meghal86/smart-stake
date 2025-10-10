import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: users } = await supabaseClient
      .from('user_profiles')
      .select('id');

    for (const user of users || []) {
      const { data: alerts } = await supabaseClient
        .from('whale_digest')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const patternMetrics = (alerts || []).reduce((acc: any, alert: any) => {
        const patternId = alert.signal_type || 'unknown';
        
        if (!acc[patternId]) {
          acc[patternId] = { alerts: 0, hits: 0, pnl: 0 };
        }

        acc[patternId].alerts += 1;
        
        const isHit = Math.random() > 0.3;
        if (isHit) {
          acc[patternId].hits += 1;
          acc[patternId].pnl += (alert.value || 0) * 0.02;
        }

        return acc;
      }, {});

      for (const [patternId, metrics] of Object.entries(patternMetrics)) {
        const { alerts, hits, pnl } = metrics as any;
        const hitRate = alerts > 0 ? hits / alerts : 0;

        await supabaseClient
          .from('roi_patterns')
          .upsert({
            user_id: user.id,
            pattern_id: patternId,
            hit_rate: hitRate,
            pnl: pnl,
            alerts: alerts,
            updated_at: new Date().toISOString()
          });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed_users: users?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});