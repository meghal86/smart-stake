/**
 * POST /api/cockpit/actions/rendered
 * 
 * Records which actions were rendered in the Action Preview.
 * Used for duplicate detection - actions shown recently get a -30 penalty.
 * 
 * Body: { dedupe_keys: string[] } (max 3)
 * 
 * Rules:
 * - MUST be called only after ActionPreview actually renders
 * - Uses ON CONFLICT DO UPDATE to refresh shown_at (upsert with refresh)
 * - Guards against re-render spam: only update if shown_at < now() - 30 seconds
 * 
 * Requirements: Duplicate Detection (Locked)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// ============================================================================
// Request Validation
// ============================================================================

const RenderedRequestSchema = z.object({
  dedupe_keys: z.array(z.string()).min(1).max(3),
});

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimum time between updates for the same dedupe_key (30 seconds)
 * Guards against re-render spam
 */
const SPAM_GUARD_SECONDS = 30;

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON body',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }
    
    const validation = RenderedRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { dedupe_keys } = validation.data;
    const nowIso = new Date().toISOString();

    // Upsert shown_actions rows with spam guard
    // Uses ON CONFLICT DO UPDATE to refresh shown_at
    // Only updates if shown_at < now() - 30 seconds (spam guard)
    // 
    // SQL equivalent:
    // INSERT INTO shown_actions (user_id, dedupe_key, shown_at)
    // VALUES ($1, $2, now())
    // ON CONFLICT (user_id, dedupe_key)
    // DO UPDATE SET shown_at = excluded.shown_at
    // WHERE shown_actions.shown_at < now() - interval '30 seconds';
    
    const results: { key: string; updated: boolean }[] = [];
    
    for (const dedupeKey of dedupe_keys) {
      // First, try to get existing record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('shown_actions')
        .select('shown_at')
        .eq('user_id', user.id)
        .eq('dedupe_key', dedupeKey)
        .single();

      if (existing) {
        // Check spam guard - only update if shown_at is old enough
        const shownAtMs = new Date(existing.shown_at).getTime();
        const nowMs = Date.now();
        const timeSinceShown = nowMs - shownAtMs;
        
        if (timeSinceShown >= SPAM_GUARD_SECONDS * 1000) {
          // Update existing record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabase as any)
            .from('shown_actions')
            .update({ shown_at: nowIso })
            .eq('user_id', user.id)
            .eq('dedupe_key', dedupeKey);

          if (updateError) {
            console.error('Error updating shown_actions:', updateError);
            results.push({ key: dedupeKey, updated: false });
          } else {
            results.push({ key: dedupeKey, updated: true });
          }
        } else {
          // Spam guard triggered - skip update
          results.push({ key: dedupeKey, updated: false });
        }
      } else {
        // Insert new record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('shown_actions')
          .insert({
            user_id: user.id,
            dedupe_key: dedupeKey,
            shown_at: nowIso,
          });

        if (insertError) {
          // Handle unique constraint violation (race condition)
          if (insertError.code === '23505') {
            // Another request inserted the row, try to update
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: retryError } = await (supabase as any)
              .from('shown_actions')
              .update({ shown_at: nowIso })
              .eq('user_id', user.id)
              .eq('dedupe_key', dedupeKey);

            if (retryError) {
              console.error('Error retrying shown_actions update:', retryError);
              results.push({ key: dedupeKey, updated: false });
            } else {
              results.push({ key: dedupeKey, updated: true });
            }
          } else {
            console.error('Error inserting shown_actions:', insertError);
            results.push({ key: dedupeKey, updated: false });
          }
        } else {
          results.push({ key: dedupeKey, updated: true });
        }
      }
    }

    const updatedCount = results.filter(r => r.updated).length;

    return NextResponse.json(
      {
        data: { 
          ok: true,
          updated_count: updatedCount,
          total_count: dedupe_keys.length,
        },
        error: null,
        meta: { ts: nowIso },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cockpit actions/rendered endpoint error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
