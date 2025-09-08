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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      throw new Error('Invalid user')
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'create':
        return await createWebhook(req, supabaseClient, user.id)
      case 'list':
        return await listWebhooks(supabaseClient, user.id)
      case 'delete':
        return await deleteWebhook(req, supabaseClient, user.id)
      case 'trigger':
        return await triggerWebhook(req, supabaseClient, user.id)
      default:
        throw new Error('Invalid action')
    }

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

async function createWebhook(req: Request, supabaseClient: any, userId: string) {
  const { url, events, secret } = await req.json()
  
  const { data, error } = await supabaseClient
    .from('webhooks')
    .insert({
      user_id: userId,
      url,
      events,
      secret,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, webhook: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listWebhooks(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ webhooks: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteWebhook(req: Request, supabaseClient: any, userId: string) {
  const { id } = await req.json()
  
  const { error } = await supabaseClient
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function triggerWebhook(req: Request, supabaseClient: any, userId: string) {
  const { webhook_id, event_type, data } = await req.json()
  
  // Get webhook details
  const { data: webhook, error } = await supabaseClient
    .from('webhooks')
    .select('*')
    .eq('id', webhook_id)
    .eq('user_id', userId)
    .single()

  if (error || !webhook) throw new Error('Webhook not found')

  // Send webhook
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret || '',
      },
      body: JSON.stringify({
        event: event_type,
        data,
        timestamp: new Date().toISOString()
      })
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: response.status,
        delivered: response.ok 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to deliver webhook' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}