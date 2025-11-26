/**
 * HarvestPro Edge Function Utilities
 * Common patterns and helpers for Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { EdgeFunctionResponse } from './types.ts';

/**
 * Create authenticated Supabase client from request
 */
export function createAuthenticatedClient(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(req: Request) {
  const supabase = createAuthenticatedClient(req);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return { user, supabase };
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status = 200): Response {
  const response: EdgeFunctionResponse<T> = {
    success: true,
    data,
  };
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * Create error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500
): Response {
  const response: EdgeFunctionResponse<never> = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  return null;
}

/**
 * Wrap Edge Function handler with error handling
 */
export function wrapHandler(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle CORS
    const corsResponse = handleCORS(req);
    if (corsResponse) return corsResponse;

    try {
      return await handler(req);
    } catch (error) {
      console.error('Edge Function error:', error);
      
      if (error.message === 'Unauthorized' || error.message === 'Missing Authorization header') {
        return errorResponse('UNAUTHORIZED', error.message, 401);
      }
      
      return errorResponse(
        'INTERNAL_ERROR',
        error.message || 'An unexpected error occurred',
        500
      );
    }
  };
}
