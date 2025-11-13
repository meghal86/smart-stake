import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Client for browser usage
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin client for server-side operations (only available on server)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

export async function getUserByWallet(walletAddress: string) {
  if (!supabaseAdmin) throw new Error('supabaseAdmin not available on client side')
  
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, handle')
    .ilike('handle', `%${walletAddress}%`)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function ensureUser(walletAddress: string) {
  if (!supabaseAdmin) throw new Error('supabaseAdmin not available on client side')
  
  // Ensure a user profile exists; if not, create minimal placeholder.
  const existing = await getUserByWallet(walletAddress)
  if (existing?.user_id) return existing

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .insert({ handle: walletAddress })
    .select('user_id, handle')
    .single()

  if (error) throw error
  return data
}
