import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { error } = await supabaseClient
      .from('whale_balances')
      .insert([
        { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', balance: '1250.5' },
        { address: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', balance: '890.2' }
      ])

    return new Response(JSON.stringify({ success: !error, error: error?.message }))
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }))
  }
})