import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get digest events from last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: digestEvents, error: digestError } = await supabaseClient
      .from('whale_digest')
      .select('severity')
      .gte('event_time', yesterday.toISOString())

    if (digestError) {
      throw new Error(`Failed to fetch digest events: ${digestError.message}`)
    }

    // Calculate whale index score based on severity
    let totalScore = 0
    const eventCount = digestEvents.length

    if (eventCount === 0) {
      totalScore = 50 // Neutral score for no events
    } else {
      const avgSeverity = digestEvents.reduce((sum, event) => sum + event.severity, 0) / eventCount
      totalScore = Math.min(100, Math.max(0, avgSeverity * 20)) // Scale severity to 0-100
    }

    // Determine label based on score
    let label = 'Calm'
    if (totalScore >= 80) label = 'Hot'
    else if (totalScore >= 60) label = 'Elevated'
    else if (totalScore >= 40) label = 'Moderate'

    const today = new Date().toISOString().split('T')[0]

    // Upsert whale index for today
    const { error: upsertError } = await supabaseClient
      .from('whale_index')
      .upsert({
        date: today,
        score: Math.round(totalScore),
        label
      }, {
        onConflict: 'date'
      })

    if (upsertError) {
      throw new Error(`Failed to upsert whale index: ${upsertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(totalScore),
        label,
        eventCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
