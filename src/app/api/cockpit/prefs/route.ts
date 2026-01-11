/**
 * GET /api/cockpit/prefs - Retrieve user preferences
 * POST /api/cockpit/prefs - Update user preferences
 * 
 * Manages cockpit preferences including:
 * - wallet_scope_default: "active" | "all"
 * - timezone: IANA timezone string
 * - dnd_start_local: "HH:MM" format
 * - dnd_end_local: "HH:MM" format
 * - notif_cap_per_day: integer 0-10
 * 
 * Requirements: 19.1, 19.3, 19.4, Preference Validation Rules (Locked)
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
 */
function isValidIANATimezone(tz: string): boolean {
  const ianaPattern = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$|^UTC$|^Etc\/(?:UTC|GMT(?:[+-]\d{1,2})?)$/;
  
  if (!ianaPattern.test(tz)) {
    return false;
  }
  
  if (COMMON_TIMEZONES.has(tz)) {
    return true;
  }
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates HH:MM time format
 * HH must be 00-23, MM must be 00-59
 */
function isValidTimeFormat(time: string): boolean {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timePattern.test(time);
}

/**
 * Normalizes time to HH:MM format (zero-padded)
 */
function normalizeTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

// Preferences validation schema
const PrefsUpdateSchema = z.object({
  wallet_scope_default: z.enum(['active', 'all']).optional(),
  timezone: z.string().optional(),
  dnd_start_local: z.string().optional(),
  dnd_end_local: z.string().optional(),
  notif_cap_per_day: z.number().int().min(0).max(10).optional(),
});

// Default preferences
const DEFAULT_PREFS = {
  wallet_scope_default: 'active' as const,
  dnd_start_local: '22:00',
  dnd_end_local: '08:00',
  notif_cap_per_day: 3,
};

/**
 * GET /api/cockpit/prefs
 * Retrieves user preferences with defaults applied
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
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

    // Fetch cockpit_state for the user
    // Using type assertion since cockpit_state types may not be generated yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: state, error: fetchError } = await (supabase as any)
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', user.id)
      .single() as { data: Pick<CockpitState, 'prefs'> | null; error: { code: string; message: string } | null };

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching cockpit_state:', fetchError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch preferences',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Merge stored prefs with defaults
    const storedPrefs = (state?.prefs as Record<string, unknown>) || {};
    const prefs = {
      wallet_scope_default: storedPrefs.wallet_scope_default ?? DEFAULT_PREFS.wallet_scope_default,
      timezone: storedPrefs.timezone ?? null,
      dnd_start_local: storedPrefs.dnd_start_local ?? DEFAULT_PREFS.dnd_start_local,
      dnd_end_local: storedPrefs.dnd_end_local ?? DEFAULT_PREFS.dnd_end_local,
      notif_cap_per_day: storedPrefs.notif_cap_per_day ?? DEFAULT_PREFS.notif_cap_per_day,
    };

    return NextResponse.json(
      {
        data: prefs,
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cockpit prefs GET error:', error);
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

/**
 * POST /api/cockpit/prefs
 * Updates user preferences with validation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    
    const validation = PrefsUpdateSchema.safeParse(body);
    
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

    const updates = validation.data;

    // Validate timezone if provided
    if (updates.timezone !== undefined && updates.timezone !== null) {
      if (!isValidIANATimezone(updates.timezone)) {
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
    }

    // Validate DND times if provided
    if (updates.dnd_start_local !== undefined) {
      if (!isValidTimeFormat(updates.dnd_start_local)) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid dnd_start_local format. Expected HH:MM (00-23:00-59)',
            },
            meta: { ts: new Date().toISOString() },
          },
          { status: 400 }
        );
      }
      updates.dnd_start_local = normalizeTime(updates.dnd_start_local);
    }

    if (updates.dnd_end_local !== undefined) {
      if (!isValidTimeFormat(updates.dnd_end_local)) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid dnd_end_local format. Expected HH:MM (00-23:00-59)',
            },
            meta: { ts: new Date().toISOString() },
          },
          { status: 400 }
        );
      }
      updates.dnd_end_local = normalizeTime(updates.dnd_end_local);
    }

    // Fetch existing state
    // Using type assertion since cockpit_state types may not be generated yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingState, error: fetchError } = await (supabase as any)
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', user.id)
      .single() as { data: Pick<CockpitState, 'prefs'> | null; error: { code: string; message: string } | null };

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching cockpit_state:', fetchError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch preferences',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Merge updates with existing prefs
    const existingPrefs = (existingState?.prefs as Record<string, unknown>) || {};
    const updatedPrefs = { ...existingPrefs };
    
    // Apply updates (only set fields that were provided)
    if (updates.wallet_scope_default !== undefined) {
      updatedPrefs.wallet_scope_default = updates.wallet_scope_default;
    }
    if (updates.timezone !== undefined) {
      updatedPrefs.timezone = updates.timezone;
    }
    if (updates.dnd_start_local !== undefined) {
      updatedPrefs.dnd_start_local = updates.dnd_start_local;
    }
    if (updates.dnd_end_local !== undefined) {
      updatedPrefs.dnd_end_local = updates.dnd_end_local;
    }
    if (updates.notif_cap_per_day !== undefined) {
      updatedPrefs.notif_cap_per_day = updates.notif_cap_per_day;
    }

    // Upsert cockpit_state
    if (existingState) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('cockpit_state')
        .update({ prefs: updatedPrefs })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating cockpit_state:', updateError);
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update preferences',
            },
            meta: { ts: new Date().toISOString() },
          },
          { status: 500 }
        );
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('cockpit_state')
        .insert({
          user_id: user.id,
          prefs: updatedPrefs,
        });

      if (insertError) {
        console.error('Error inserting cockpit_state:', insertError);
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create preferences',
            },
            meta: { ts: new Date().toISOString() },
          },
          { status: 500 }
        );
      }
    }

    // Return the updated preferences with defaults applied
    const responsePrefs = {
      wallet_scope_default: updatedPrefs.wallet_scope_default ?? DEFAULT_PREFS.wallet_scope_default,
      timezone: updatedPrefs.timezone ?? null,
      dnd_start_local: updatedPrefs.dnd_start_local ?? DEFAULT_PREFS.dnd_start_local,
      dnd_end_local: updatedPrefs.dnd_end_local ?? DEFAULT_PREFS.dnd_end_local,
      notif_cap_per_day: updatedPrefs.notif_cap_per_day ?? DEFAULT_PREFS.notif_cap_per_day,
    };

    return NextResponse.json(
      {
        data: responsePrefs,
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cockpit prefs POST error:', error);
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
