/**
 * POST /api/cockpit/open
 * 
 * Updates the user's last_opened_at timestamp in cockpit_state.
 * Implements server-side debouncing (once per minute per user).
 * Persists timezone if not already set.
 * 
 * Requirements: 11.7, 11.8, Timezone Persistence (Locked)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// Type definitions for cockpit_state table
// Note: These should be auto-generated after running `supabase gen types`
interface CockpitState {
  user_id: string;
  last_opened_at: string | null;
  last_pulse_viewed_date: string | null;
  prefs: Record<string, unknown>;
  updated_at: string;
}

// Common IANA timezone identifiers for validation
// This is a subset of common timezones - we also do basic format validation
const COMMON_TIMEZONES = new Set([
  // Americas
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'America/Toronto', 'America/Vancouver',
  'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
  // Europe
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Warsaw',
  'Europe/Moscow', 'Europe/Istanbul', 'Europe/Athens', 'Europe/Zurich',
  // Asia
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
  'Asia/Dubai', 'Asia/Mumbai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Jakarta',
  'Asia/Manila', 'Asia/Taipei', 'Asia/Kuala_Lumpur',
  // Pacific
  'Pacific/Auckland', 'Pacific/Sydney', 'Australia/Sydney', 'Australia/Melbourne',
  'Australia/Brisbane', 'Australia/Perth', 'Pacific/Honolulu', 'Pacific/Fiji',
  // Africa
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  // UTC
  'UTC', 'Etc/UTC', 'Etc/GMT',
]);

/**
 * Validates if a string is a valid IANA timezone identifier.
 * Uses a combination of format validation and allowlist fallback.
 */
function isValidIANATimezone(tz: string): boolean {
  // Basic format validation: Area/Location or Etc/GMT patterns
  const ianaPattern = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$|^UTC$|^Etc\/(?:UTC|GMT(?:[+-]\d{1,2})?)$/;
  
  if (!ianaPattern.test(tz)) {
    return false;
  }
  
  // Check against common timezones allowlist
  if (COMMON_TIMEZONES.has(tz)) {
    return true;
  }
  
  // For less common timezones, try to validate using Intl API
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Request validation schema
const OpenRequestSchema = z.object({
  timezone: z.string().optional(),
});

// Debounce window in milliseconds (1 minute)
const DEBOUNCE_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
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
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }
    
    const validation = OpenRequestSchema.safeParse(body);
    
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

    const { timezone } = validation.data;

    // Validate timezone if provided
    if (timezone && !isValidIANATimezone(timezone)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid IANA timezone identifier',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Get current cockpit_state for the user
    // Using type assertion since cockpit_state types may not be generated yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingState, error: fetchError } = await (supabase as any)
      .from('cockpit_state')
      .select('last_opened_at, prefs')
      .eq('user_id', user.id)
      .single() as { data: Pick<CockpitState, 'last_opened_at' | 'prefs'> | null; error: { code: string; message: string } | null };

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (first open)
      console.error('Error fetching cockpit_state:', fetchError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch cockpit state',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Check debounce: if last_opened_at is within 1 minute, skip update
    if (existingState?.last_opened_at) {
      const lastOpened = new Date(existingState.last_opened_at);
      const timeSinceLastOpen = now.getTime() - lastOpened.getTime();
      
      if (timeSinceLastOpen < DEBOUNCE_WINDOW_MS) {
        // Debounced - return success without updating
        return NextResponse.json(
          {
            data: { ok: true, debounced: true },
            error: null,
            meta: { ts: nowIso },
          },
          { status: 200 }
        );
      }
    }

    // Prepare prefs update - persist timezone if missing
    const existingPrefs = (existingState?.prefs as Record<string, unknown>) || {};
    const updatedPrefs = { ...existingPrefs };
    
    if (timezone && !existingPrefs.timezone) {
      updatedPrefs.timezone = timezone;
    }

    // Upsert cockpit_state
    if (existingState) {
      // Update existing row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('cockpit_state')
        .update({
          last_opened_at: nowIso,
          prefs: updatedPrefs,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating cockpit_state:', updateError);
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update cockpit state',
            },
            meta: { ts: nowIso },
          },
          { status: 500 }
        );
      }
    } else {
      // Insert new row (first open)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('cockpit_state')
        .insert({
          user_id: user.id,
          last_opened_at: nowIso,
          prefs: updatedPrefs,
        });

      if (insertError) {
        console.error('Error inserting cockpit_state:', insertError);
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create cockpit state',
            },
            meta: { ts: nowIso },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        data: { ok: true },
        error: null,
        meta: { ts: nowIso },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cockpit open endpoint error:', error);
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
