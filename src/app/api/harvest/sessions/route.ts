/**
 * HarvestPro Sessions API
 * POST /api/harvest/sessions - Create new harvest session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateSessionRequestSchema } from '@/schemas/harvestpro';
import { createHarvestSession } from '@/lib/harvestpro/session-management';
import type { CreateSessionResponse, ErrorResponse } from '@/types/harvestpro';

/**
 * POST /api/harvest/sessions
 * Create a new harvest session in draft status
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = CreateSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid request body',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Create session
    const session = await createHarvestSession({
      userId: user.id,
      opportunityIds: parsed.data.opportunityIds,
    });

    const response: CreateSessionResponse = {
      sessionId: session.sessionId,
      status: 'draft',
      createdAt: session.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating harvest session:', error);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
