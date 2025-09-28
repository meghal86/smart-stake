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

    // Get users with streaks (in a real implementation, you'd send actual notifications)
    const { data: users, error: fetchError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, streak_count')
      .gt('streak_count', 0)

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`)
    }

    // In a real implementation, you would:
    // 1. Send push notifications
    // 2. Send email notifications
    // 3. Update notification preferences
    // For now, we'll just log the notification

    console.log(`Notifying ${users.length} users about their streaks`)

    return new Response(
      JSON.stringify({
        success: true,
        usersNotified: users.length,
        message: 'Streak notifications sent (mock)'
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
