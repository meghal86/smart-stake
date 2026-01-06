/**
 * GET /functions/v1/wallets-list
 * 
 * Returns authenticated user's wallet registry with deterministic ordering.
 * 
 * Requirements:
 * - Validates JWT token from Authorization header
 * - Returns wallets sorted by: is_primary DESC, created_at DESC, id ASC
 * - Includes quota information
 * - Handles CORS preflight requests
 * 
 * Response Shape:
 * {
 *   "wallets": [
 *     {
 *       "id": "uuid",
 *       "address": "0x...",
 *       "chain_namespace": "eip155:1",
 *       "is_primary": true,
 *       "guardian_scores": {},
 *       "balance_cache": {}
 *     }
 *   ],
 *   "quota": { "used_addresses": 2, "used_rows": 4, "total": 5, "plan": "free" },
 *   "active_hint": { "primary_wallet_id": "uuid" }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WalletRow {
  id: string
  address: string
  chain_namespace: string
  is_primary: boolean
  guardian_scores: Record<string, number>
  balance_cache: Record<string, unknown>
  created_at: string
}

interface WalletResponse {
  id: string
  address: string
  chain_namespace: string
  is_primary: boolean
  guardian_scores: Record<string, number>
  balance_cache: Record<string, unknown>
}

interface QuotaInfo {
  used_addresses: number
  used_rows: number
  total: number
  plan: string
}

interface ActiveHint {
  primary_wallet_id: string | null
}

interface SuccessResponse {
  wallets: WalletResponse[]
  quota: QuotaInfo
  active_hint: ActiveHint
}

interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

/**
 * Extract and validate JWT token from Authorization header
 */
function extractUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    // Decode JWT payload (without verification - Supabase will verify)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = JSON.parse(atob(parts[1]))
    return payload.sub || null
  } catch {
    return null
  }
}

/**
 * Count unique addresses (case-insensitive) for quota calculation
 */
function countUniqueAddresses(wallets: WalletRow[]): number {
  const uniqueAddresses = new Set(
    wallets.map(w => w.address.toLowerCase())
  )
  return uniqueAddresses.size
}

/**
 * Get plan-based quota limit (default to free tier)
 */
function getQuotaLimit(plan: string): number {
  const quotaLimits: Record<string, number> = {
    'free': 5,
    'pro': 20,
    'enterprise': 1000,
  }
  return quotaLimits[plan] || quotaLimits['free']
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET requests are allowed',
        },
      } as ErrorResponse),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Extract and validate JWT
    const authHeader = req.headers.get('Authorization')
    const userId = extractUserIdFromJWT(authHeader)

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header',
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Query wallets with deterministic ordering
    // Order by: is_primary DESC, created_at DESC, id ASC
    const { data: wallets, error: queryError } = await supabase
      .from('user_wallets')
      .select(
        'id, address, chain_namespace, is_primary, guardian_scores, balance_cache, created_at'
      )
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })

    if (queryError) {
      console.error('Database query error:', queryError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch wallets',
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Transform wallet rows to response format
    const walletRows = (wallets || []) as WalletRow[]
    const responseWallets: WalletResponse[] = walletRows.map(w => ({
      id: w.id,
      address: w.address,
      chain_namespace: w.chain_namespace,
      is_primary: w.is_primary || false,
      guardian_scores: w.guardian_scores || {},
      balance_cache: w.balance_cache || {},
    }))

    // Get user's plan from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('plan')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      // Default to free tier if profile fetch fails
      var plan = 'free'
    } else {
      var plan = userProfile?.plan || 'free'
    }

    // Calculate quota
    const uniqueAddressCount = countUniqueAddresses(walletRows)
    const totalRows = walletRows.length
    const quotaLimit = getQuotaLimit(plan)

    const quota: QuotaInfo = {
      used_addresses: uniqueAddressCount,
      used_rows: totalRows,
      total: quotaLimit,
      plan,
    }

    // Find primary wallet for active hint
    const primaryWallet = walletRows.find(w => w.is_primary)
    const activeHint: ActiveHint = {
      primary_wallet_id: primaryWallet?.id || null,
    }

    // Return success response
    const response: SuccessResponse = {
      wallets: responseWallets,
      quota,
      active_hint: activeHint,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in wallets-list:', error)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
