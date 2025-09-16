import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, title, message } = await req.json()

    // Test email notification
    const emailResult = await sendTestEmail({
      to: email || 'meghal86@gmail.com',
      subject: title || '🐋 Test Whale Alert',
      html: createWhaleAlertHTML(title || 'Test Notification', message || 'Testing notification system')
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test notification sent successfully',
        emailResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendTestEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
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

function createWhaleAlertHTML(title: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhalePlus Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            🐋 WhalePlus
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">
            Professional Whale Tracking
          </p>
        </div>
        
        <!-- Alert Content -->
        <div style="padding: 30px 20px;">
          <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">${title}</h2>
            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
          </div>
          
          <!-- Transaction Details -->
          <div style="background-color: #fff; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              📊 Transaction Details
            </h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666; font-size: 14px;">Amount:</span>
              <span style="color: #333; font-weight: bold; font-size: 14px;">1,000 ETH ($2.5M)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666; font-size: 14px;">Network:</span>
              <span style="color: #333; font-weight: bold; font-size: 14px;">Ethereum</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666; font-size: 14px;">Time:</span>
              <span style="color: #333; font-weight: bold; font-size: 14px;">${new Date().toLocaleString()}</span>
            </div>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://etherscan.io" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View on Explorer →
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e5e9;">
          <p style="color: #666; margin: 0; font-size: 12px;">
            You're receiving this because you have whale alerts enabled.
            <a href="#" style="color: #667eea; text-decoration: none;">Manage preferences</a>
          </p>
          <p style="color: #999; margin: 10px 0 0 0; font-size: 11px;">
            WhalePlus - Professional Crypto Whale Monitoring
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}