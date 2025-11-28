/**
 * Hunter Screen Report API Endpoint
 * 
 * POST /api/hunter/report
 * 
 * Handles abuse reports for opportunities with idempotency key support
 * to prevent duplicate submissions from double-clicks.
 * 
 * Requirements: 11.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

// Validation schema for report submission
const ReportSchema = z.object({
  opportunity_id: z.string().uuid('Invalid opportunity ID'),
  category: z.enum(['phishing', 'impersonation', 'reward_not_paid', 'scam', 'other']),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

type ReportPayload = z.infer<typeof ReportSchema>;

interface ReportResponse {
  id: string;
  opportunity_id: string;
  category: string;
  status: string;
  created_at: string;
  is_duplicate: boolean;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    retry_after_sec?: number;
  };
}

/**
 * POST /api/hunter/report
 * 
 * Submit an abuse report for an opportunity
 * 
 * Headers:
 * - Idempotency-Key: Required unique key to prevent duplicates
 * - Authorization: Optional bearer token for authenticated users
 * 
 * Body:
 * - opportunity_id: UUID of the opportunity being reported
 * - category: Report category (phishing, impersonation, reward_not_paid, scam, other)
 * - description: Optional description of the issue
 * - metadata: Optional additional metadata
 * 
 * Returns:
 * - 200: Report submitted successfully (or existing report returned)
 * - 400: Invalid request (missing idempotency key or invalid payload)
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function POST(req: NextRequest): Promise<NextResponse<ReportResponse | ErrorResponse>> {
  try {
    // Extract idempotency key from header
    const idempotencyKey = req.headers.get('idempotency-key');
    
    if (!idempotencyKey) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate idempotency key format (should be a UUID or similar unique string)
    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key must be between 16 and 128 characters',
          },
        },
        { status: 400 }
      );
    }

    // Get user IP for rate limiting and anonymous reports
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    // Rate limiting: 3 reports per minute per IP
    const rateLimitIdentifier = `report:${userIp}`;
    try {
      await checkRateLimit(rateLimitIdentifier, {
        limit: 3,
        window: '1 m',
      });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many report submissions. Please try again later.',
            retry_after_sec: error.retryAfter || 60,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.retryAfter || 60),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Invalid request payload',
          },
        },
        { status: 400 }
      );
    }

    const payload: ReportPayload = parsed.data;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user ID if available
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check if report with this idempotency key already exists
    const { data: existingReport, error: lookupError } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingReport) {
      // Return existing report with 200 status
      return NextResponse.json(
        {
          id: existingReport.id,
          opportunity_id: existingReport.opportunity_id,
          category: existingReport.category,
          status: existingReport.status,
          created_at: existingReport.created_at,
          is_duplicate: true,
        },
        { status: 200 }
      );
    }

    // If lookup error is not "not found", return error
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Error looking up existing report:', lookupError);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to check for existing report',
          },
        },
        { status: 500 }
      );
    }

    // Verify opportunity exists
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id, status')
      .eq('id', payload.opportunity_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        {
          error: {
            code: 'OPPORTUNITY_NOT_FOUND',
            message: 'Opportunity not found',
          },
        },
        { status: 404 }
      );
    }

    // Insert new report
    const { data: newReport, error: insertError } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: idempotencyKey,
        opportunity_id: payload.opportunity_id,
        user_id: userId,
        user_ip: userIp,
        category: payload.category,
        description: payload.description || null,
        metadata: payload.metadata || {},
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (race condition)
      if (insertError.code === '23505') {
        // Another request with same idempotency key was processed
        // Fetch and return the existing report
        const { data: racedReport } = await supabase
          .from('report_events')
          .select('*')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (racedReport) {
          return NextResponse.json(
            {
              id: racedReport.id,
              opportunity_id: racedReport.opportunity_id,
              category: racedReport.category,
              status: racedReport.status,
              created_at: racedReport.created_at,
              is_duplicate: true,
            },
            { status: 200 }
          );
        }
      }

      console.error('Error inserting report:', insertError);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to submit report',
          },
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        id: newReport.id,
        opportunity_id: newReport.opportunity_id,
        category: newReport.category,
        status: newReport.status,
        created_at: newReport.created_at,
        is_duplicate: false,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in report endpoint:', error);
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
