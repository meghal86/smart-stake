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

    // Mock upcoming token unlocks (in a real implementation, this would fetch from TokenUnlocks API)
    const mockUnlocks = [
      {
        token: 'ARB',
        chain: 'Arbitrum',
        unlock_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        amount_usd: 120000000,
        source: 'TokenUnlocks'
      },
      {
        token: 'OP',
        chain: 'Optimism',
        unlock_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        amount_usd: 45000000,
        source: 'TokenUnlocks'
      },
      {
        token: 'IMX',
        chain: 'Ethereum',
        unlock_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        amount_usd: 25000000,
        source: 'TokenUnlocks'
      }
    ]

    // Insert new unlocks (in a real implementation, you'd check for existing ones)
    const { error: insertError } = await supabaseClient
      .from('token_unlocks')
      .insert(mockUnlocks)

    if (insertError) {
      throw new Error(`Failed to insert unlocks: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        unlocksAdded: mockUnlocks.length
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
