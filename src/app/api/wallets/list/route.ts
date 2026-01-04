import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

/**
 * GET /api/wallets/list
 * 
 * Returns the list of wallets for the authenticated user.
 * Called by WalletContext on login to hydrate wallet state.
 * Clears wallet state on logout (when called without valid auth).
 * 
 * Requirements:
 * - Task 2: Edge Functions Implementation
 * - Requirement 13.1-13.5: API contract consistency
 */

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.substring(7);

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    // Fetch wallets for this user from the database
    // Note: This is a placeholder implementation
    // In production, this would call an Edge Function or query the database directly
    const { data: wallets, error: dbError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error fetching wallets:', dbError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch wallets' } },
        { status: 500 }
      );
    }

    // Transform database response to API response format
    const formattedWallets = (wallets || []).map((w: any) => ({
      id: w.id,
      address: w.address,
      chain_namespace: w.chain_namespace || 'eip155:1',
      label: w.label,
      is_primary: w.is_primary,
      balance_cache: w.balance_cache || {},
      guardian_scores: w.guardian_scores || {},
      created_at: w.created_at,
    }));

    return NextResponse.json({
      wallets: formattedWallets,
      quota: {
        used: formattedWallets.length,
        total: 100, // Default quota
        plan: 'free',
        used_rows: formattedWallets.length,
      },
      active_hint: {
        primary_wallet_id: formattedWallets.find((w: any) => w.is_primary)?.id || null,
      },
    });
  } catch (error) {
    console.error('Error in /api/wallets/list:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
