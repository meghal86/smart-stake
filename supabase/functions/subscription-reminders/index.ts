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

    const now = new Date()
    const reminderDates = [
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day
    ]

    const results = []

    for (const reminderDate of reminderDates) {
      const { data: subscriptions } = await supabaseClient
        .from('subscriptions')
        .select(`
          id, user_id, plan, status, current_period_end,
          users!inner(email, notification_preferences)
        `)
        .eq('status', 'active')
        .gte('current_period_end', reminderDate.toISOString().split('T')[0])
        .lt('current_period_end', new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (subscriptions) {
        for (const subscription of subscriptions) {
          const user = subscription.users as any
          if (user?.notification_preferences?.email !== false) {
            const daysUntilExpiry = Math.ceil((new Date(subscription.current_period_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            
            await sendRenewalReminder({
              email: user.email,
              plan: subscription.plan,
              daysUntilExpiry,
              subscriptionId: subscription.id
            })

            results.push({
              userId: subscription.user_id,
              email: user.email,
              daysUntilExpiry,
              status: 'sent'
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Renewal reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendRenewalReminder({ email, plan, daysUntilExpiry }: {
  email: string, plan: string, daysUntilExpiry: number, subscriptionId: string
}) {
  const subject = `🐋 Your WhalePlus ${plan} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">🐋 WhalePlus</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e1e5e9;">
        <h2>Your ${plan} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</h2>
        <p>Don't miss out on premium whale tracking features.</p>
        <a href="https://whaleplus.app/subscription/manage" 
           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
          Renew Subscription →
        </a>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'WhalePlus <onboarding@resend.dev>',
      to: [email],
      subject,
      html
    })
  })

  if (!response.ok) {
    throw new Error(`Email failed: ${await response.text()}`)
  }

  return await response.json()
}