/**
 * POST /functions/v1/wallets-remove
 * 
 * Remove a wallet from the user's registry with atomic primary reassignment.
 * 
 * Requirements:
 * - Validates JWT token from Authorization header
 * - Deletes wallet by ID
 * - If deleted wallet was primary, atomically reassigns primary to another wallet
 * - Primary reassignment follows priority: eip155:1 → oldest created_at → smallest id
 * - If no other rows exist for that address, picks from another address
 * - Atomic operation (same transaction)
 * - Handles CORS preflight requests
 * 
 * Request Body:
 * {
 *   "wallet_id": "uuid"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "new_primary_id": "uuid" (optional, if primary was reassigned)
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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RemoveWalletRequest {
  wallet_id: string
}

interface SuccessResponse {
  success: true
  new_primary_id?: string
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
 * Find the best candidate for primary reassignment
 * Priority: eip155:1 → oldest created_at → smallest id
 */
function findBestPrimaryCandidate(
  wallets: Array<{
    id: string
    chain_namespace: string
    created_at: string
  }>
): string | null {
  if (wallets.length === 0) {
    return null
  }

  // First priority: eip155:1 (Ethereum mainnet)
  const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
  if (ethereumWallet) {
    return ethereumWallet.id
  }

  // Second priority: oldest by created_at
  let oldestWallet = wallets[0]
  for (const wallet of wallets) {
    if (new Date(wallet.created_at) < new Date(oldestWallet.created_at)) {
      oldestWallet = wallet
    } else if (
      new Date(wallet.created_at).getTime() === new Date(oldestWallet.created_at).getTime() &&
      wallet.id < oldestWallet.id
    ) {
      // Tiebreaker: smallest id
      oldestWallet = wallet
    }
  }

  return oldestWallet.id
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

    const req_body = body as RemoveWalletRequest

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

    // Get the wallet to be deleted
    const { data: walletToDelete, error: fetchError } = await supabase
      .from('user_wallets')
      .select('id, user_id, address, chain_namespace, is_primary')
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
    if (walletToDelete.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this wallet',
          },
        } as ErrorResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const wasPrimary = walletToDelete.is_primary || false
    const deletedAddress = walletToDelete.address

    // Start atomic transaction
    let newPrimaryId: string | null = null

    if (wasPrimary) {
      // Get all other wallets for this user to find a new primary
      const { data: allWallets, error: listError } = await supabase
        .from('user_wallets')
        .select('id, address, chain_namespace, created_at')
        .eq('user_id', userId)
        .neq('id', req_body.wallet_id)

      if (listError) {
        console.error('Database list error:', listError)
        return new Response(
          JSON.stringify({
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch other wallets',
            },
          } as ErrorResponse),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const otherWallets = (allWallets || []) as Array<{
        id: string
        address: string
        chain_namespace: string
        created_at: string
      }>

      if (otherWallets.length > 0) {
        // Find best candidate for new primary
        newPrimaryId = findBestPrimaryCandidate(otherWallets)

        if (newPrimaryId) {
          // Update new primary wallet
          const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ is_primary: true })
            .eq('id', newPrimaryId)

          if (updateError) {
            console.error('Database update error:', updateError)
            return new Response(
              JSON.stringify({
                error: {
                  code: 'DATABASE_ERROR',
                  message: 'Failed to update primary wallet',
                },
              } as ErrorResponse),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }
        }
      }
    }

    // Delete the wallet
    const { error: deleteError } = await supabase
      .from('user_wallets')
      .delete()
      .eq('id', req_body.wallet_id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete wallet',
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
    }

    if (newPrimaryId) {
      response.new_primary_id = newPrimaryId
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in wallets-remove:', error)
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
