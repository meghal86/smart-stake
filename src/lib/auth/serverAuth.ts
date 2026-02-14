/**
 * Server-Side Authentication Utilities
 * 
 * Provides authentication helpers for API routes and server-side code.
 * Extracts user ID from Supabase auth session.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get authenticated user ID from request
 * 
 * @param request - Next.js request object
 * @returns User ID if authenticated, null otherwise
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [Auth] No valid authorization header found');
      return null;
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role key for server-side auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ [Auth] Error verifying token:', error.message);
      return null;
    }

    if (!user) {
      console.warn('⚠️ [Auth] No user found for token');
      return null;
    }

    console.log('✅ [Auth] Authenticated user:', user.id);
    return user.id;
  } catch (error) {
    console.error('❌ [Auth] Unexpected error during authentication:', error);
    return null;
  }
}

/**
 * Get authenticated user ID from cookie-based session
 * Alternative method for cookie-based authentication
 * 
 * @param request - Next.js request object
 * @returns User ID if authenticated, null otherwise
 */
export async function getUserIdFromCookie(request: NextRequest): Promise<string | null> {
  try {
    // Create Supabase client that reads from cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user from session (reads from cookies automatically)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ [Auth] Error getting user from session:', error.message);
      return null;
    }

    if (!user) {
      console.warn('⚠️ [Auth] No user found in session');
      return null;
    }

    console.log('✅ [Auth] Authenticated user from session:', user.id);
    return user.id;
  } catch (error) {
    console.error('❌ [Auth] Unexpected error during session authentication:', error);
    return null;
  }
}

/**
 * Get authenticated user ID (tries both methods)
 * 
 * @param request - Next.js request object
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // Try bearer token first
  let userId = await getUserIdFromRequest(request);
  
  // Fallback to cookie-based session
  if (!userId) {
    userId = await getUserIdFromCookie(request);
  }
  
  return userId;
}

/**
 * Require authentication - throws error if not authenticated
 * 
 * @param request - Next.js request object
 * @returns User ID
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getAuthenticatedUserId(request);
  
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  
  return userId;
}
