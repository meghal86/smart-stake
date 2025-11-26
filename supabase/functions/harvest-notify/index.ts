/**
 * HarvestPro Edge Function: Send Notifications
 * 
 * Sends notifications about harvest opportunities, sync status, and system updates.
 * Supports email, webhook, and in-app notifications.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface NotificationRequest {
  userId: string;
  type: 'opportunity_found' | 'sync_completed' | 'sync_failed' | 'harvest_executed' | 'system_alert';
  data: {
    title: string;
    message: string;
    opportunityCount?: number;
    potentialSavings?: number;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  channels: Array<'email' | 'webhook' | 'in_app'>;
}

interface NotificationResponse {
  success: boolean;
  notificationId: string;
  channelsDelivered: string[];
  channelsFailed: string[];
  sentAt: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: NotificationRequest = await req.json();
    
    if (!body.userId || !body.type || !body.data || !body.channels) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type, data, channels' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sending notification to user ${body.userId}, type: ${body.type}`);

    // Generate notification ID
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sentAt = new Date().toISOString();

    // Get user preferences and contact info
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('email, notification_preferences, webhook_url')
      .eq('user_id', body.userId)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      // Continue with notification attempt
    }

    const channelsDelivered: string[] = [];
    const channelsFailed: string[] = [];

    // Process each notification channel
    for (const channel of body.channels) {
      try {
        switch (channel) {
          case 'email':
            await sendEmailNotification({
              to: userProfile?.email,
              subject: body.data.title,
              message: body.data.message,
              actionUrl: body.data.actionUrl,
              type: body.type,
              opportunityCount: body.data.opportunityCount,
              potentialSavings: body.data.potentialSavings,
            });
            channelsDelivered.push('email');
            break;

          case 'webhook':
            await sendWebhookNotification({
              url: userProfile?.webhook_url,
              payload: {
                notificationId,
                userId: body.userId,
                type: body.type,
                data: body.data,
                sentAt,
              },
            });
            channelsDelivered.push('webhook');
            break;

          case 'in_app':
            await storeInAppNotification({
              userId: body.userId,
              notificationId,
              type: body.type,
              title: body.data.title,
              message: body.data.message,
              actionUrl: body.data.actionUrl,
              priority: body.data.priority || 'medium',
              sentAt,
            }, supabaseClient);
            channelsDelivered.push('in_app');
            break;

          default:
            console.warn(`Unknown notification channel: ${channel}`);
            channelsFailed.push(channel);
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
        channelsFailed.push(channel);
      }
    }

    // Store notification log
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        notification_id: notificationId,
        user_id: body.userId,
        type: body.type,
        title: body.data.title,
        message: body.data.message,
        channels_requested: body.channels,
        channels_delivered: channelsDelivered,
        channels_failed: channelsFailed,
        sent_at: sentAt,
        data: body.data,
      });

    if (logError) {
      console.error('Failed to log notification:', logError);
    }

    const response: NotificationResponse = {
      success: channelsDelivered.length > 0,
      notificationId,
      channelsDelivered,
      channelsFailed,
      sentAt,
      ...(channelsFailed.length > 0 && { 
        error: `Failed to deliver via: ${channelsFailed.join(', ')}` 
      })
    };

    console.log(`Notification sent:`, response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Notification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions

async function sendEmailNotification(params: {
  to?: string;
  subject: string;
  message: string;
  actionUrl?: string;
  type: string;
  opportunityCount?: number;
  potentialSavings?: number;
}) {
  if (!params.to) {
    throw new Error('No email address provided');
  }

  // Use Supabase Edge Functions email service or external service like SendGrid
  const emailPayload = {
    to: params.to,
    subject: params.subject,
    html: generateEmailHTML(params),
  };

  // For now, log the email (replace with actual email service)
  console.log('Email notification:', emailPayload);
  
  // TODO: Integrate with actual email service
  // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(emailPayload),
  // });
}

async function sendWebhookNotification(params: {
  url?: string;
  payload: any;
}) {
  if (!params.url) {
    throw new Error('No webhook URL provided');
  }

  const response = await fetch(params.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'HarvestPro-Webhook/1.0',
    },
    body: JSON.stringify(params.payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
}

async function storeInAppNotification(params: {
  userId: string;
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: string;
  sentAt: string;
}, supabaseClient: any) {
  const { error } = await supabaseClient
    .from('in_app_notifications')
    .insert({
      notification_id: params.notificationId,
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      priority: params.priority,
      is_read: false,
      created_at: params.sentAt,
    });

  if (error) {
    throw new Error(`Failed to store in-app notification: ${error.message}`);
  }
}

function generateEmailHTML(params: {
  subject: string;
  message: string;
  actionUrl?: string;
  type: string;
  opportunityCount?: number;
  potentialSavings?: number;
}): string {
  const actionButton = params.actionUrl 
    ? `<a href="${params.actionUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Details</a>`
    : '';

  const opportunityInfo = params.opportunityCount && params.potentialSavings
    ? `<p style="color: #059669; font-weight: 600;">💰 ${params.opportunityCount} opportunities found with potential savings of $${params.potentialSavings.toFixed(2)}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${params.subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #F9FAFB; padding: 24px; border-radius: 8px; border-left: 4px solid #4F46E5;">
        <h1 style="color: #1F2937; margin-top: 0;">${params.subject}</h1>
        ${opportunityInfo}
        <p style="color: #4B5563; font-size: 16px;">${params.message}</p>
        ${actionButton}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
        <p>This notification was sent by HarvestPro. If you no longer wish to receive these emails, you can update your notification preferences in your account settings.</p>
      </div>
    </body>
    </html>
  `;
}
