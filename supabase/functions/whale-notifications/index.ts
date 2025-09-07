import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...data } = await req.json()

    switch (action) {
      case 'create_alert':
        const { error: alertError } = await supabaseClient
          .from('whale_alerts')
          .insert({
            user_id: data.userId,
            whale_address: data.whaleAddress,
            alert_type: data.alertType,
            threshold_amount: data.thresholdAmount,
            notification_method: data.notificationMethod
          })

        if (alertError) throw alertError

        return new Response(
          JSON.stringify({ success: true, message: 'Alert created successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'toggle_watchlist':
        const { data: existing } = await supabaseClient
          .from('user_watchlists')
          .select('id')
          .eq('user_id', data.userId)
          .eq('whale_address', data.whaleAddress)
          .single()

        if (existing) {
          await supabaseClient
            .from('user_watchlists')
            .delete()
            .eq('id', existing.id)
        } else {
          await supabaseClient
            .from('user_watchlists')
            .insert({
              user_id: data.userId,
              whale_address: data.whaleAddress,
              whale_label: data.whaleLabel
            })
        }

        return new Response(
          JSON.stringify({ success: true, isWatched: !existing }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_user_data':
        const [watchlistData, alertsData] = await Promise.all([
          supabaseClient
            .from('user_watchlists')
            .select('whale_address')
            .eq('user_id', data.userId),
          supabaseClient
            .from('whale_alerts')
            .select('*')
            .eq('user_id', data.userId)
            .eq('is_active', true)
        ])

        return new Response(
          JSON.stringify({
            success: true,
            watchedAddresses: watchlistData.data?.map(w => w.whale_address) || [],
            alerts: alertsData.data || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})