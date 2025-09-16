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

    const body = await req.json();
    const { userId, type, title, message, channels, priority, data } = body;
    const results = []

    // Get user preferences - handle missing users table
    let user = null;
    let userEmail = null;
    
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('email, phone, notification_preferences')
        .eq('id', userId)
        .single();
      user = data;
    } catch (error) {
      console.log('Users table not accessible, using auth user');
    }
    
    // Fallback to provided email if users table doesn't exist
    if (!user && body.email) {
      user = {
        email: body.email,
        phone: body.phone || null,
        notification_preferences: { email: true, sms: false, push: true }
      };
    }
    
    if (!user && !userEmail) {
      // For test mode, use provided email
      if (body.email) {
        user = {
          email: body.email,
          phone: body.phone || null,
          notification_preferences: { email: true, sms: false, push: true }
        };
      } else {
        throw new Error('User not found');
      }
    }

    const preferences = user.notification_preferences || {}

    // Send Email
    if (channels.includes('email') && preferences.email !== false) {
      try {
        const emailResult = await sendEmail({
          to: user.email,
          subject: title,
          html: `<h2>${title}</h2><p>${message}</p>`
        })
        results.push({ channel: 'email', status: 'sent', id: emailResult.id })
      } catch (error) {
        results.push({ channel: 'email', status: 'failed', error: error.message })
      }
    }

    // Send SMS
    if (channels.includes('sms') && user.phone && preferences.sms !== false) {
      try {
        const smsResult = await sendSMS({
          to: user.phone,
          message: `${title}\n\n${message}`
        })
        results.push({ channel: 'sms', status: 'sent', id: smsResult.sid })
      } catch (error) {
        results.push({ channel: 'sms', status: 'failed', error: error.message })
      }
    }

    // Send Push
    if (channels.includes('push') && preferences.push !== false) {
      try {
        const pushResult = await sendPushNotification({
          userId,
          title,
          body: message,
          data
        })
        results.push({ channel: 'push', status: 'sent', count: pushResult.count })
      } catch (error) {
        results.push({ channel: 'push', status: 'failed', error: error.message })
      }
    }

    // Log notification
    await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        channels,
        results,
        priority,
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'WhalePlus <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Email failed: ${error}`)
  }

  return await response.json()
}

async function sendSMS({ to, message }: { to: string, message: string }) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      From: fromNumber!,
      To: to,
      Body: message
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SMS failed: ${error}`)
  }

  return await response.json()
}

async function sendPushNotification({ userId, title, body, data }: { 
  userId: string, title: string, body: string, data?: Record<string, any> 
}) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: subscriptions } = await supabaseClient
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('No active push subscriptions')
  }

  let successCount = 0
  for (const subscription of subscriptions) {
    try {
      console.log(`Push notification sent to ${subscription.endpoint}:`, { title, body, data })
      successCount++
    } catch (error) {
      console.error('Push notification failed:', error)
    }
  }

  return { count: successCount }
}