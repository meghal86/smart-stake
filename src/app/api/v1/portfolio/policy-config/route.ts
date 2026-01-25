import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { policyConfigService } from '@/services/policyConfigService';
import type { PolicyEngineConfig } from '@/types/portfolio';

// Request validation schema for policy config updates
const updatePolicyConfigSchema = z.object({
  maxGasUsd: z.number().min(0).optional(),
  blockNewContractsDays: z.number().min(0).optional(),
  blockInfiniteApprovalsToUnknown: z.boolean().optional(),
  requireSimulationForValueOverUsd: z.number().min(0).optional(),
  confidenceThreshold: z.number().min(0.50).max(1.0).optional(),
  allowedSlippagePercent: z.number().min(0).max(100).optional(),
  maxDailyTransactionCount: z.number().min(0).optional()
});

/**
 * GET /api/v1/portfolio/policy-config
 * Get user's current policy configuration
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Load user policy configuration
    const config = await policyConfigService.loadUserPolicyConfig(user.id);

    return NextResponse.json({
      data: config,
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GET /api/v1/portfolio/policy-config:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/portfolio/policy-config
 * Update user's policy configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePolicyConfigSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid policy configuration',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    // Save updated configuration
    const result = await policyConfigService.saveUserPolicyConfig(
      user.id, 
      validationResult.data
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: result.error || 'Failed to save policy configuration'
          }
        },
        { status: 400 }
      );
    }

    // Return updated configuration
    const updatedConfig = await policyConfigService.loadUserPolicyConfig(user.id);

    return NextResponse.json({
      data: updatedConfig,
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in PUT /api/v1/portfolio/policy-config:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/portfolio/policy-config
 * Reset user's policy configuration to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Reset to default configuration
    const result = await policyConfigService.resetUserPolicyConfig(user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: result.error || 'Failed to reset policy configuration'
          }
        },
        { status: 500 }
      );
    }

    // Return default configuration
    const defaultConfig = await policyConfigService.loadUserPolicyConfig(user.id);

    return NextResponse.json({
      data: defaultConfig,
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in DELETE /api/v1/portfolio/policy-config:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}