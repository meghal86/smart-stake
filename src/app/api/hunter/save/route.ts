/**
 * Hunter Screen - Save Opportunity API
 * 
 * POST /api/hunter/save
 * 
 * Allows authenticated users to save opportunities for later viewing.
 * Implements rate limiting to prevent abuse.
 * 
 * Requirements:
 * - 5.8: Save functionality
 * - 11.4: Rate limiting for save operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

// Validation schema
const SaveRequestSchema = z.object({
  opportunity_id: z.string().uuid(),
});

// Initialize Supabase client
function getSupabaseClient(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Get auth token from request
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Get user from auth
    const supabase = getSupabaseClient(req);
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user;
    const authError = authResult?.error;
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Rate limiting: 60 saves per hour per user
    const identifier = `save:${user.id}`;
    try {
      await checkRateLimit(identifier, { limit: 60, window: '1 h' });
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: { 
            code: 'RATE_LIMITED', 
            message: 'Too many save requests', 
            retry_after_sec: error.retryAfter 
          } 
        },
        { 
          status: 429, 
          headers: { 'Retry-After': String(error.retryAfter || 60) } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = SaveRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { opportunity_id } = parsed.data;

    // Check if opportunity exists
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('id', opportunity_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Opportunity not found' } },
        { status: 404 }
      );
    }

    // Save opportunity (upsert to handle duplicates)
    const { data: saved, error: saveError } = await supabase
      .from('saved_opportunities')
      .upsert(
        { 
          user_id: user.id, 
          opportunity_id,
          saved_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id,opportunity_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to save opportunity' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      saved_at: saved.saved_at,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
      },
    });

  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unsave
export async function DELETE(req: NextRequest) {
  try {
    // Get user from auth
    const supabase = getSupabaseClient(req);
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user;
    const authError = authResult?.error;
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse query parameter
    const { searchParams } = new URL(req.url);
    const opportunity_id = searchParams.get('opportunity_id');

    if (!opportunity_id) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'opportunity_id is required' } },
        { status: 400 }
      );
    }

    // Delete saved opportunity
    const { error: deleteError } = await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunity_id);

    if (deleteError) {
      console.error('Unsave error:', deleteError);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to unsave opportunity' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unsave API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
