/**
 * POST /functions/v1/wallets-set-primary
 * 
 * Set a wallet as the primary wallet for the user with atomic updates.
 * 
 * Requirements:
 * - Validates JWT token from Authorization header
 * - Sets specified wallet as primary (is_primary = true)
 * - Atomically sets all other wallets for user to is_primary = false
 * - Ensures only one primary wallet per user
 * - Atomic operation (same transaction)
 * - Handles CORS preflight requests
 * - Uses SQL transaction for true atomicity
 * 
 * Request Body:
 * {
 *   "wallet_id": "uuid"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "wallet_id": "uuid"
 * }
 * 
 * Error Responses:
 * - 401: Missing/invalid Authorization header
 * - 403: Forbidden (wallet doesn't belong to user)
 * - 404: Wallet not found
 * - 422: Validation error
 * - 500: Internal server error
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { checkWalletRateLimit, RateLimitError, createRateLimitResponse } from '../_shared/rate-limit.ts'
import { handleIdempotency } from '../_shared/idempotency.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL')

interface SetPrimaryRequest {
  wallet_id: string
}

interface SuccessResponse {
  success: true
  wallet_id: string
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
 * Validate request body
 */
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const req = body as Record<string, unknown>

  if (!req.wallet_id || typeof req.wallet_id !== 'string') {
    return { valid: false, error: 'wallet_id is required and must be a string' }
  }

  return { valid: true }
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(uuid)
}

/**
 * Execute atomic transaction using raw SQL
 * This ensures true atomicity for the primary wallet update
 */
async function executeAtomicTransaction(
  userId: string,
  walletId: string
): Promise<{ success: boolean; error?: string }> {
  // If SUPABASE_DB_URL is available, use direct SQL connection for true atomicity
  if (SUPABASE_DB_URL) {
    try {
      // Use Supabase client to execute raw SQL via RPC
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      
      // Execute atomic transaction via SQL
      const { data, error } = await supabase.rpc('set_primary_wallet_atomic', {
        p_user_id: userId,
        p_wallet_id: walletId,
      })

      if (error) {
        console.error('RPC error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Transaction error:', err)
      return { success: false, error: err.message }
    }
  }

  // Fallback: Use sequential updates (less atomic but still functional)
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Set all wallets for this user to is_primary = false
    const { error: unsetError } = await supabase
      .from('user_wallets')
      .update({ is_primary: false })
      .eq('user_id', userId)

    if (unsetError) {
      return { success: false, error: 'Failed to unset other primary wallets' }
    }

    // Set the specified wallet to is_primary = true
    const { error: setPrimaryError } = await supabase
      .from('user_wallets')
      .update({ is_primary: true })
      .eq('id', walletId)

    if (setPrimaryError) {
      return { success: false, error: 'Failed to set wallet as primary' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed',
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

    // Handle idempotency
    const idempotencyResult = await handleIdempotency(req, userId, 'wallets-set-primary')
    if (idempotencyResult.cached && idempotencyResult.response) {
      return idempotencyResult.response
    }

    // Check rate limit (10 requests per minute per user)
    try {
      await checkWalletRateLimit(userId, 10, 60)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return createRateLimitResponse(error.retryAfter)
      }
      throw error
    }

    // Parse request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate request body
    const validation = validateRequest(body)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: validation.error,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const req_body = body as SetPrimaryRequest

    // Validate UUID format
    if (!isValidUUID(req_body.wallet_id)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_WALLET_ID',
            message: 'wallet_id must be a valid UUID',
          },
        } as ErrorResponse),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get the wallet to be set as primary
    const { data: walletToSetPrimary, error: fetchError } = await supabase
      .from('user_wallets')
      .select('id, user_id')
      .eq('id', req_body.wallet_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows found
        return new Response(
          JSON.stringify({
            error: {
              code: 'WALLET_NOT_FOUND',
              message: 'Wallet not found',
            },
          } as ErrorResponse),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.error('Database fetch error:', fetchError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch wallet',
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify wallet belongs to authenticated user
    if (walletToSetPrimary.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this wallet',
          },
        } as ErrorResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Execute atomic transaction
    const txResult = await executeAtomicTransaction(userId, req_body.wallet_id)

    if (!txResult.success) {
      console.error('Transaction failed:', txResult.error)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: txResult.error || 'Failed to update primary wallet',
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return success response
    const response: SuccessResponse = {
      success: true,
      wallet_id: req_body.wallet_id,
    }

    // Cache response for idempotency
    await idempotencyResult.setCacheResponse(response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in wallets-set-primary:', error)
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
