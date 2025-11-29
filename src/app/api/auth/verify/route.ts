/**
 * POST /api/auth/verify
 * 
 * Verifies wallet signature and creates JWT session
 * 
 * Requirements: System Req 13.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { verifyMessage } from 'viem';
import { z } from 'zod';

// Validation schema
const VerifyRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

// EIP-191 message format
const AUTH_MESSAGE = 'Sign this message to authenticate with AlphaWhale';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = VerifyRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { walletAddress, signature, message } = validation.data;

    // Verify the message matches expected format
    if (message !== AUTH_MESSAGE) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_MESSAGE',
            message: 'Message does not match expected format',
          },
        },
        { status: 400 }
      );
    }

    // Verify EIP-191 signature
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message: AUTH_MESSAGE,
        signature: signature as `0x${string}`,
      });
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'SIGNATURE_VERIFICATION_FAILED',
            message: 'Failed to verify signature',
          },
        },
        { status: 400 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed',
          },
        },
        { status: 401 }
      );
    }

    // Create Supabase session
    const supabase = await createClient();
    
    // Sign in with wallet address (using Supabase Auth)
    // Note: This assumes you have a custom auth provider or use signInAnonymously
    // and store wallet address in user metadata
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          wallet_address: walletAddress.toLowerCase(),
          authenticated_at: new Date().toISOString(),
        },
      },
    });

    if (authError || !authData.session) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_FAILED',
            message: 'Failed to create authentication session',
          },
        },
        { status: 500 }
      );
    }

    // The session is automatically stored in httpOnly cookies by Supabase SSR
    // Return success response
    return NextResponse.json(
      {
        success: true,
        walletAddress: walletAddress.toLowerCase(),
        expiresAt: authData.session.expires_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify endpoint error:', error);
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
