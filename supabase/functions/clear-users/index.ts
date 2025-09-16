import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    await supabaseClient.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseClient.from('users_metadata').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return new Response(JSON.stringify({ success: true }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }))
  }
})