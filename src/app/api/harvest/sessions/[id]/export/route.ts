/**
 * HarvestPro CSV Export API Endpoint
 * GET /api/harvest/sessions/:id/export
 * 
 * Generates and downloads Form 8949-compatible CSV export
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getHarvestSession } from '@/lib/harvestpro/session-management';
import { generateForm8949CSV } from '@/lib/harvestpro/csv-export';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Fetch the harvest session
    const session = await getHarvestSession(sessionId, user.id);

    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Harvest session not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow export for completed sessions
    if (session.status !== 'completed') {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Can only export completed harvest sessions',
          },
        },
        { status: 400 }
      );
    }

    // Generate CSV (Requirement 11.1: Complete within 2 seconds)
    const startTime = Date.now();
    const csv = generateForm8949CSV(session);
    const generationTime = Date.now() - startTime;

    // Log if generation took too long
    if (generationTime > 2000) {
      console.warn(
        `CSV generation took ${generationTime}ms for session ${sessionId}`
      );
    }

    // Return CSV file
    // Requirement 11.5: Ensure compatibility with Excel, Google Sheets, Numbers
    const filename = `harvest-${sessionId.slice(0, 8)}-form8949.csv`;
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to generate CSV export',
        },
      },
      { status: 500 }
    );
  }
}
