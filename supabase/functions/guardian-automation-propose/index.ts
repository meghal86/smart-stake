import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutomationRequest {
  user_id: string
  contract_address: string
  token_address: string
  trigger_reason: string
  trust_score_before: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, contract_address, token_address, trigger_reason, trust_score_before }: AutomationRequest = await req.json()

    // Validate user has active automation
    const { data: automation, error: automationError } = await supabase
      .from('guardian_automations')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (automationError || !automation) {
      return new Response(
        JSON.stringify({ error: 'No active automation found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check automation policies
    const { data: policies } = await supabase
      .from('guardian_automation_policies')
      .select('*')
      .eq('automation_id', automation.id)
      .eq('enabled', true)

    // Validate against policies
    const autoRevokePolicy = policies?.find(p => p.policy_type === 'auto_revoke')
    if (!autoRevokePolicy) {
      return new Response(
        JSON.stringify({ error: 'Auto-revoke policy not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const thresholdPolicy = policies?.find(p => p.policy_type === 'threshold')
    const threshold = thresholdPolicy?.policy_data?.min_trust_score || 5.0
    
    if (trust_score_before > threshold) {
      return new Response(
        JSON.stringify({ error: 'Trust score above threshold' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create automation log entry
    const { data: logEntry, error: logError } = await supabase
      .from('guardian_automation_logs')
      .insert({
        automation_id: automation.id,
        action_type: 'revoke',
        trigger_reason,
        contract_address,
        token_address,
        trust_score_before,
        status: 'pending'
      })
      .select()
      .single()

    if (logError) {
      throw logError
    }

    // Submit to relayer service
    const relayerUrl = Deno.env.get('GUARDIAN_RELAYER_URL') || 'http://localhost:3001'
    const relayerResponse = await fetch(`${relayerUrl}/api/submit-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GUARDIAN_RELAYER_API_KEY')}`
      },
      body: JSON.stringify({
        log_id: logEntry.id,
        user_address: automation.eoa_address,
        smart_wallet_address: automation.smart_wallet_address,
        target_contract: contract_address,
        token_address,
        action: 'revoke'
      })
    })

    if (!relayerResponse.ok) {
      await supabase
        .from('guardian_automation_logs')
        .update({ 
          status: 'failed', 
          error_message: 'Relayer submission failed' 
        })
        .eq('id', logEntry.id)

      throw new Error('Relayer submission failed')
    }

    const relayerResult = await relayerResponse.json()

    await supabase
      .from('guardian_automation_logs')
      .update({ 
        status: 'submitted',
        relayer_request_id: relayerResult.request_id
      })
      .eq('id', logEntry.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        log_id: logEntry.id,
        relayer_request_id: relayerResult.request_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Guardian automation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})