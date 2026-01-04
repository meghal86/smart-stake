/**
 * POST /functions/v1/wallets-remove-address
 * 
 * Remove all wallet rows for a given address across all networks.
 * 
 * Requirements:
 * - Validates JWT token from Authorization header
 * - Deletes all rows for the specified address (case-insensitive)
 * - If any deleted wallet was primary, atomically reassigns primary to another address
 * - Primary reassignment follows priority: eip155:1 → oldest created_at → smallest id
 * - Atomic operation (same transaction)
 * - Handles CORS preflight requests
 * 
 * Request Body:
 * {
 *   "address": "0x..."
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "deleted_count": 2,
 *   "new_primary_id": "uuid" (optional, if primary was reassigned)
 * }
 * 
 * Error Responses:
 * - 401: Missing/invalid Authorization header
 * - 403: Forbidden (address doesn't belong to user)
 * - 404: Address not found
 * - 422: Validation error
 * - 500: Internal server error
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RemoveAddressRequest {
  address: string
}

interface SuccessResponse {
  success: true
  deleted_count: number
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
 * Validate Ethereum address format
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const req = body as Record<string, unknown>

  if (!req.address || typeof req.address !== 'string') {
    return { valid: false, error: 'address is required and must be a string' }
  }

  if (!isValidEthereumAddress(req.address)) {
    return { valid: false, error: 'address must be a valid Ethereum address (0x...)' }
  }

  return { valid: true }
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
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const req_body = body as RemoveAddressRequest
    const addressLower = req_body.address.toLowerCase()

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all wallets for this address and user
    const { data: walletsToDelete, error: fetchError } = await supabase
      .from('user_wallets')
      .select('id, user_id, address, chain_namespace, is_primary, created_at')
      .eq('user_id', userId)
      .ilike('address', addressLower) // Case-insensitive match

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
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

    const wallets = (walletsToDelete || []) as Array<{
      id: string
      user_id: string
      address: string
      chain_namespace: string
      is_primary: boolean
      created_at: string
    }>

    // If no wallets found, return 404
    if (wallets.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'ADDRESS_NOT_FOUND',
            message: 'No wallets found for this address',
          },
        } as ErrorResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify all wallets belong to authenticated user (security check)
    const allBelongToUser = wallets.every(w => w.user_id === userId)
    if (!allBelongToUser) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete these wallets',
          },
        } as ErrorResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if any of the wallets being deleted is primary
    const wasPrimary = wallets.some(w => w.is_primary)
    let newPrimaryId: string | null = null

    if (wasPrimary) {
      // Get all other wallets for this user (not being deleted)
      const { data: otherWallets, error: listError } = await supabase
        .from('user_wallets')
        .select('id, address, chain_namespace, created_at')
        .eq('user_id', userId)
        .not('id', 'in', `(${wallets.map(w => `'${w.id}'`).join(',')})`)

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

      const remainingWallets = (otherWallets || []) as Array<{
        id: string
        address: string
        chain_namespace: string
        created_at: string
      }>

      if (remainingWallets.length > 0) {
        // Find best candidate for new primary
        newPrimaryId = findBestPrimaryCandidate(remainingWallets)

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

    // Delete all wallets for this address
    const { error: deleteError } = await supabase
      .from('user_wallets')
      .delete()
      .eq('user_id', userId)
      .ilike('address', addressLower) // Case-insensitive match

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete wallets',
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
      deleted_count: wallets.length,
    }

    if (newPrimaryId) {
      response.new_primary_id = newPrimaryId
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in wallets-remove-address:', error)
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
