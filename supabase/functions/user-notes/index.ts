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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method, coinId, note } = await req.json()

    if (method === 'save') {
      // Save or update note
      const { error } = await supabaseClient
        .from('user_notes')
        .upsert({
          user_id: user.id,
          coin_id: coinId,
          note: note,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Note saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (method === 'get') {
      // Get user's notes
      const { data, error } = await supabaseClient
        .from('user_notes')
        .select('coin_id, note')
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      const notes = data.reduce((acc, item) => {
        acc[item.coin_id] = item.note
        return acc
      }, {})

      return new Response(
        JSON.stringify({ success: true, notes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (method === 'delete') {
      // Delete note
      const { error } = await supabaseClient
        .from('user_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('coin_id', coinId)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Note deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error managing user notes:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to manage notes' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})