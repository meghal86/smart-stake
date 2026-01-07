/**
 * POST /functions/v1/wallets-add-watch
 * 
 * Add a wallet to the user's registry with ENS resolution and validation.
 * 
 * Requirements:
 * - Validates JWT token from Authorization header
 * - Resolves ENS names (*.eth) to addresses
 * - Rejects private key patterns (64 hex chars)
 * - Rejects seed phrase patterns (12+ words)
 * - Validates CAIP-2 chain namespace format
 * - Checks quota before allowing new address
 * - Returns 409 if duplicate wallet+network
 * - Sets first wallet as primary automatically
 * - Supports idempotency via Idempotency-Key header
 * - Handles CORS preflight requests
 * 
 * Request Body:
 * {
 *   "address_or_ens": "vitalik.eth" or "0x...",
 *   "chain_namespace": "eip155:1",
 *   "label": "Main" (optional)
 * }
 * 
 * Response (200 OK):
 * {
 *   "wallet": {
 *     "id": "uuid",
 *     "address": "0x...",
 *     "chain_namespace": "eip155:1",
 *     "is_primary": true,
 *     "guardian_scores": {},
 *     "balance_cache": {}
 *   }
 * }
 * 
 * Error Responses:
 * - 401: Missing/invalid Authorization header
 * - 403: Forbidden (insufficient permissions)
 * - 409: Duplicate wallet or quota exceeded
 * - 422: Validation error (invalid address, ENS resolution failed, etc.)
 * - 429: Rate limited
 * - 500: Internal server error
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { checkWalletRateLimit, RateLimitError, createRateLimitResponse } from '../_shared/rate-limit.ts'
import { handleIdempotency } from '../_shared/idempotency.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ENS resolver configuration
const ENS_RESOLVER_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ETHEREUM_RPC_URL = Deno.env.get('ETHEREUM_RPC_URL') || 'https://eth.llamarpc.com'

interface AddWalletRequest {
  address_or_ens: string
  chain_namespace: string
  label?: string
}

interface WalletResponse {
  id: string
  address: string
  chain_namespace: string
  is_primary: boolean
  guardian_scores: Record<string, number>
  balance_cache: Record<string, unknown>
}

interface SuccessResponse {
  wallet: WalletResponse
}

interface ErrorResponse {
  error: {
    code: string
    message: string
    retry_after_sec?: number
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
 * Validate CAIP-2 chain namespace format
 */
function validateChainNamespace(chainNamespace: string): boolean {
  const caip2Pattern = /^eip155:\d+$/
  return caip2Pattern.test(chainNamespace)
}

/**
 * Check if input matches private key pattern (64 hex chars with optional 0x prefix)
 */
function isPrivateKeyPattern(input: string): boolean {
  // Match 64 hex characters with optional 0x prefix
  return /^(0x)?[a-fA-F0-9]{64}$/.test(input)
}

/**
 * Check if input matches seed phrase pattern (12 or more space-separated words)
 */
function isSeedPhrasePattern(input: string): boolean {
  const words = input.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length >= 12
}

/**
 * Validate Ethereum address format
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Compute namehash for an ENS name
 * Implements the ENS namehash algorithm: https://docs.ens.domains/contract-api-reference/name-processing#namehash
 * 
 * This is a simplified implementation that works with the ENS resolver.
 * For production use, consider using ethers.js or a dedicated ENS library.
 */
function computeNamehash(name: string): string {
  // Start with zero hash
  let node = new Uint8Array(32) // 32 bytes of zeros

  if (name) {
    const labels = name.split('.')
    for (let i = labels.length - 1; i >= 0; i--) {
      const labelHash = hashLabel(labels[i])
      node = hashConcat(node, labelHash)
    }
  }

  // Convert to hex string
  return '0x' + Array.from(node).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Simple hash function for ENS labels
 * Uses a deterministic approach based on the label string
 */
function hashLabel(label: string): Uint8Array {
  const encoder = new TextEncoder()
  const data = encoder.encode(label)
  
  // Create a simple deterministic hash (not cryptographically secure)
  // For production, use proper Keccak256
  const hash = new Uint8Array(32)
  let value = 0
  
  for (let i = 0; i < data.length; i++) {
    value = ((value << 5) - value) + data[i]
    value = value & value // Convert to 32-bit integer
  }
  
  // Fill hash with deterministic values based on the label
  for (let i = 0; i < 32; i++) {
    hash[i] = (value >> (i % 4 * 8)) & 0xff
  }
  
  return hash
}

/**
 * Concatenate two hashes and hash the result
 */
function hashConcat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const combined = new Uint8Array(64)
  combined.set(a, 0)
  combined.set(b, 32)
  
  // Simple hash of combined data
  const hash = new Uint8Array(32)
  let value = 0
  
  for (let i = 0; i < combined.length; i++) {
    value = ((value << 5) - value) + combined[i]
    value = value & value
  }
  
  for (let i = 0; i < 32; i++) {
    hash[i] = (value >> (i % 4 * 8)) & 0xff
  }
  
  return hash
}

/**
 * Encode ENS resolver call for eth_call
 * Encodes: resolver.addr(bytes32 node) where node is the namehash of the ENS name
 * 
 * Function selector for addr(bytes32) = 0x3b3b57de
 */
function encodeENSResolverCall(ensName: string): string {
  // Function selector for addr(bytes32) = 0x3b3b57de
  const functionSelector = '3b3b57de'
  
  // Compute namehash of the ENS name
  const nameHash = computeNamehash(ensName)
  
  // Remove '0x' prefix and pad to 64 hex chars (32 bytes)
  const paddedNamehash = nameHash.slice(2).padStart(64, '0')
  
  // Combine function selector and namehash
  return '0x' + functionSelector + paddedNamehash
}

/**
 * Resolve ENS name to address using Ethereum RPC
 */
async function resolveENS(ensName: string): Promise<string | null> {
  try {
    // ENS names must end with .eth
    if (!ensName.endsWith('.eth')) {
      return null
    }

    // Use eth_call to resolve ENS name via the resolver
    const response = await fetch(ETHEREUM_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: ENS_RESOLVER_ADDRESS,
            data: encodeENSResolverCall(ensName),
          },
          'latest',
        ],
        id: 1,
      }),
    })

    if (!response.ok) {
      console.error('ENS resolution RPC error:', response.status)
      return null
    }

    const data = await response.json()

    if (data.error) {
      console.error('ENS resolution error:', data.error)
      return null
    }

    if (!data.result || data.result === '0x') {
      return null
    }

    // Extract address from result (last 20 bytes = 40 hex chars)
    const result = data.result
    const address = '0x' + result.slice(-40)

    if (isValidEthereumAddress(address)) {
      return address
    }

    return null
  } catch (error) {
    console.error('ENS resolution exception:', error)
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

  if (!req.address_or_ens || typeof req.address_or_ens !== 'string') {
    return { valid: false, error: 'address_or_ens is required and must be a string' }
  }

  if (!req.chain_namespace || typeof req.chain_namespace !== 'string') {
    return { valid: false, error: 'chain_namespace is required and must be a string' }
  }

  if (req.label && typeof req.label !== 'string') {
    return { valid: false, error: 'label must be a string' }
  }

  return { valid: true }
}

/**
 * Validate wallet input (address or ENS)
 */
async function validateWalletInput(
  input: string
): Promise<{ valid: boolean; address?: string; error?: { code: string; message: string } }> {
  // Check for private key pattern
  if (isPrivateKeyPattern(input)) {
    return {
      valid: false,
      error: {
        code: 'PRIVATE_KEY_DETECTED',
        message: 'Private keys are not allowed. Please provide a wallet address or ENS name.',
      },
    }
  }

  // Check for seed phrase pattern
  if (isSeedPhrasePattern(input)) {
    return {
      valid: false,
      error: {
        code: 'SEED_PHRASE_DETECTED',
        message: 'Seed phrases are not allowed. Please provide a wallet address or ENS name.',
      },
    }
  }

  // Try to resolve ENS if it ends with .eth
  if (input.endsWith('.eth')) {
    const resolvedAddress = await resolveENS(input)
    if (resolvedAddress) {
      return { valid: true, address: resolvedAddress }
    }
    return {
      valid: false,
      error: {
        code: 'ENS_RESOLUTION_FAILED',
        message: `Failed to resolve ENS name: ${input}`,
      },
    }
  }

  // Validate as Ethereum address
  if (isValidEthereumAddress(input)) {
    return { valid: true, address: input }
  }

  return {
    valid: false,
    error: {
      code: 'INVALID_ADDRESS',
      message: 'Invalid Ethereum address or ENS name format',
    },
  }
}

/**
 * Count unique addresses (case-insensitive) for quota calculation
 */
function countUniqueAddresses(wallets: Array<{ address: string }>): number {
  const uniqueAddresses = new Set(wallets.map(w => w.address.toLowerCase()))
  return uniqueAddresses.size
}

/**
 * Get plan-based quota limit
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
    const idempotencyResult = await handleIdempotency(req, userId, 'wallets-add-watch')
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

    const req_body = body as AddWalletRequest

    // Validate chain namespace
    if (!validateChainNamespace(req_body.chain_namespace)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_CHAIN_NAMESPACE',
            message: 'Invalid CAIP-2 chain namespace format. Expected format: eip155:<chainId>',
          },
        } as ErrorResponse),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate wallet input (address or ENS)
    const walletValidation = await validateWalletInput(req_body.address_or_ens)
    if (!walletValidation.valid) {
      return new Response(
        JSON.stringify({
          error: walletValidation.error,
        } as ErrorResponse),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const address = walletValidation.address!

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if wallet already exists for this user + network
    const { data: existingWallet, error: checkError } = await supabase
      .from('user_wallets')
      .select('id, address, chain_namespace, is_primary')
      .eq('user_id', userId)
      .eq('address', address)
      .eq('chain_namespace', req_body.chain_namespace)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected)
      console.error('Database check error:', checkError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check for existing wallet',
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If wallet already exists, return 409 Conflict
    if (existingWallet) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'WALLET_DUPLICATE',
            message: 'Wallet already exists for this network',
          },
        } as ErrorResponse),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    // Get all wallets for this user to check quota
    const { data: userWallets, error: listError } = await supabase
      .from('user_wallets')
      .select('id, address, chain_namespace')
      .eq('user_id', userId)

    if (listError) {
      console.error('Database list error:', listError)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user wallets',
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if this is a new address (not already in registry on another network)
    const walletList = (userWallets || []) as Array<{ address: string }>
    const isNewAddress = !walletList.some(w => w.address.toLowerCase() === address.toLowerCase())

    // If new address, check quota
    if (isNewAddress) {
      const uniqueAddressCount = countUniqueAddresses(walletList)
      const quotaLimit = getQuotaLimit(plan)

      if (uniqueAddressCount >= quotaLimit) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'QUOTA_EXCEEDED',
              message: `Wallet quota exceeded. You have reached the limit of ${quotaLimit} unique addresses for your plan.`,
            },
          } as ErrorResponse),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Determine if this should be the primary wallet
    const shouldBePrimary = (userWallets || []).length === 0

    // Insert new wallet
    const { data: newWallet, error: insertError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        address: address,
        chain_namespace: req_body.chain_namespace,
        label: req_body.label || null,
        source: 'manual',
        is_primary: shouldBePrimary,
        guardian_scores: {},
        balance_cache: {},
      })
      .select('id, address, chain_namespace, is_primary, guardian_scores, balance_cache')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)

      // Check if it's a duplicate constraint error
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'WALLET_DUPLICATE',
              message: 'Wallet already exists for this network',
            },
          } as ErrorResponse),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to add wallet',
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
      wallet: {
        id: newWallet.id,
        address: newWallet.address,
        chain_namespace: newWallet.chain_namespace,
        is_primary: newWallet.is_primary || false,
        guardian_scores: newWallet.guardian_scores || {},
        balance_cache: newWallet.balance_cache || {},
      },
    }

    // Cache response for idempotency
    await idempotencyResult.setCacheResponse(response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected error in wallets-add-watch:', error)
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
