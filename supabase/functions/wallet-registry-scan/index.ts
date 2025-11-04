/**
 * Wallet Registry Scan Edge Function
 * 
 * Scheduled job that scans all registered wallets in user_wallets table.
 * Updates trust scores and risk flags for continuous monitoring.
 * 
 * Can be triggered:
 * - Via Supabase cron (pg_cron)
 * - Manually via HTTP POST
 * - On-demand from client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GUARDIAN_API_URL = Deno.env.get('GUARDIAN_API_URL') || 'https://api.guardian.alphawhale.com'

interface ScanResult {
  wallet_id: string
  address: string
  success: boolean
  trust_score?: number
  risk_flags?: any[]
  error?: string
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse request body for optional filters
    let batchSize = 50 // Default batch size
    let specificUserId: string | null = null
    let specificWalletIds: string[] = []

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        batchSize = body.batch_size || batchSize
        specificUserId = body.user_id || null
        specificWalletIds = body.wallet_ids || []
      } catch {
        // No body or invalid JSON - use defaults
      }
    }

    console.log('Starting wallet registry scan', {
      batchSize,
      specificUserId,
      specificWalletIds: specificWalletIds.length,
    })

    // Fetch wallets to scan
    let query = supabase
      .from('user_wallets')
      .select('id, user_id, address, chain, last_scan')
      .order('last_scan', { ascending: true, nullsFirst: true })
      .limit(batchSize)

    if (specificUserId) {
      query = query.eq('user_id', specificUserId)
    }

    if (specificWalletIds.length > 0) {
      query = query.in('id', specificWalletIds)
    }

    const { data: wallets, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch wallets: ${fetchError.message}`)
    }

    if (!wallets || wallets.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No wallets to scan',
          scanned: 0,
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    console.log(`Scanning ${wallets.length} wallets`)

    // Scan each wallet
    const results: ScanResult[] = []

    for (const wallet of wallets) {
      try {
        // Call Guardian API
        const scanResponse = await fetch(`${GUARDIAN_API_URL}/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: wallet.address,
            network: wallet.chain || 'ethereum',
          }),
        })

        if (!scanResponse.ok) {
          throw new Error(`Guardian API error: ${scanResponse.status}`)
        }

        const scanData = await scanResponse.json()

        // Extract trust score and risk flags
        const trustScore = Math.round((scanData.trust_score || 0) * 100)
        const riskFlags = scanData.flags || []

        // Update wallet in database
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({
            trust_score: trustScore,
            risk_flags: riskFlags,
            last_scan: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)

        if (updateError) {
          console.error(`Failed to update wallet ${wallet.id}:`, updateError)
          results.push({
            wallet_id: wallet.id,
            address: wallet.address,
            success: false,
            error: updateError.message,
          })
        } else {
          results.push({
            wallet_id: wallet.id,
            address: wallet.address,
            success: true,
            trust_score: trustScore,
            risk_flags: riskFlags,
          })
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Failed to scan wallet ${wallet.id}:`, error)
        results.push({
          wallet_id: wallet.id,
          address: wallet.address,
          success: false,
          error: error.message,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    console.log('Scan complete', {
      total: results.length,
      success: successCount,
      failure: failureCount,
    })

    return new Response(
      JSON.stringify({
        message: 'Wallet scan complete',
        total: results.length,
        success: successCount,
        failure: failureCount,
        results,
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    console.error('Fatal error in wallet registry scan:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})




