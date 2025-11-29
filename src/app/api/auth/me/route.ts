/**
 * GET /api/auth/me
 * 
 * Validates JWT from cookie and returns authentication status
 * 
 * Requirements: System Req 16.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client (automatically reads session from cookies)
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      );
    }

    // Extract wallet address from user metadata
    const walletAddress = user.user_metadata?.wallet_address;

    if (!walletAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SESSION',
            message: 'Session missing wallet address',
          },
        },
        { status: 401 }
      );
    }

    // Return authenticated user info
    return NextResponse.json(
      {
        authenticated: true,
        walletAddress,
        userId: user.id,
        authenticatedAt: user.user_metadata?.authenticated_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth me endpoint error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
