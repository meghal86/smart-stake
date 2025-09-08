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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { whale_address, alert_type, severity, message, channels } = await req.json()
    
    // Store alert notification
    const { data: notification, error } = await supabaseClient
      .from('alert_notifications')
      .insert({
        whale_address,
        alert_type,
        severity,
        message,
        channels,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Send notifications (mock implementation)
    const results = channels.map((channel: string) => ({
      channel,
      status: 'sent',
      message: `${channel.toUpperCase()}: ${message}`
    }))

    return new Response(
      JSON.stringify({ 
        success: true,
        notification_id: notification.id,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})