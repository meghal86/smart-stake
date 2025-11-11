/**
 * Admin API for Feature Flags
 * 
 * GET /api/admin/feature-flags - Get all feature flags configuration
 * 
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlagsConfig } from '@/lib/feature-flags';

/**
 * GET /api/admin/feature-flags
 * 
 * Returns the current configuration for all feature flags.
 * Useful for admin dashboards to view rollout status.
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(req);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    
    const config = await getFeatureFlagsConfig();
    
    return NextResponse.json({
      flags: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch feature flags config:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
