import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const trainingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ml-training`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await trainingResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      timestamp: new Date().toISOString(),
      training_result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})