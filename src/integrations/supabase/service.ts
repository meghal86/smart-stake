import { createClient } from '@supabase/supabase-js'
import { supabase } from './client'
import { Database } from './types'

/**
 * Creates a service client for server-side operations
 * 
 * This should only be used in:
 * - Next.js API routes (server-side)
 * - Edge Functions
 * - Server-side utilities
 * 
 * For client-side code, use the regular supabase client instead
 */
export function createServiceClient() {
  // Check if we're in a server environment
  if (typeof window !== 'undefined') {
    // We're in the browser - return the client-side Supabase client
    // This is a fallback for client-side code that shouldn't be calling this
    console.warn('createServiceClient called from browser - using client-side Supabase client');
    return supabase;
  }

  // Server-side: create service client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
    });
    // Fallback to client-side client if keys are missing
    return supabase;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}