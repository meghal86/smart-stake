/**
 * HarvestPro Session API (by ID)
 * GET /api/harvest/sessions/:id - Get session details
 * PATCH /api/harvest/sessions/:id - Update session
 * DELETE /api/harvest/sessions/:id - Cancel session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  getHarvestSession,
  updateHarvestSession,
  deleteHarvestSession,
} from '@/lib/harvestpro/session-management';
import type { SessionResponse, ErrorResponse } from '@/types/harvestpro';
import { HarvestSessionStatusSchema } from '@/schemas/harvestpro';

// Schema for PATCH request body
const UpdateSessionRequestSchema = z.object({
  status: HarvestSessionStatusSchema.optional(),
  opportunityIds: z.array(z.string().uuid()).optional(),
  realizedLossesTotal: z.number().nonnegative().optional(),
  netBenefitTotal: z.number().optional(),
  executionSteps: z.array(z.any()).optional(),
  exportUrl: z.string().url().optional(),
  proofHash: z.string().optional(),
});

/**
 * GET /api/harvest/sessions/:id
 * Get harvest session details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Validate session ID
    const params = await context.params;
    const sessionId = params.id;
    if (!sessionId) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Session ID is required',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get session
    const session = await getHarvestSession(sessionId, user.id);

    if (!session) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: SessionResponse = {
      session,
    };

    // Cache for 30 seconds
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'private, max-age=30');
    return nextResponse;
  } catch (error) {
    console.error('Error fetching harvest session:', error);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PATCH /api/harvest/sessions/:id
 * Update harvest session
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Validate session ID
    const params = await context.params;
    const sessionId = params.id;
    if (!sessionId) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Session ID is required',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = UpdateSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid request body',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Update session
    const session = await updateHarvestSession({
      sessionId,
      userId: user.id,
      ...parsed.data,
    });

    const response: SessionResponse = {
      session,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating harvest session:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid state transition')) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      if (error.message.includes('not found')) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found',
          },
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/harvest/sessions/:id
 * Cancel harvest session
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Validate session ID
    const params = await context.params;
    const sessionId = params.id;
    if (!sessionId) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Session ID is required',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Delete (cancel) session
    await deleteHarvestSession(sessionId, user.id);

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting harvest session:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
