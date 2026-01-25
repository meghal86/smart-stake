import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ExecutionStep, FreshnessConfidence } from '@/types/portfolio';

/**
 * GET /api/v1/portfolio/plans/:id/steps
 * 
 * Returns the canonical state of execution steps for a specific intent plan.
 * This endpoint provides real-time step status for execution monitoring.
 * 
 * Requirements: 15.2, 15.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    // Get user ID from auth
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First verify the plan exists and belongs to the user
    const { data: plan, error: planError } = await supabase
      .from('intent_plans')
      .select('id, user_id, updated_at')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: {
              code: 'PLAN_NOT_FOUND',
              message: 'Intent plan not found'
            }
          },
          { status: 404 }
        );
      }

      console.error('Error verifying intent plan:', planError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to verify intent plan'
          }
        },
        { status: 500 }
      );
    }

    // Get all execution steps for this plan
    const { data: steps, error: stepsError } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('plan_id', planId)
      .order('step_index', { ascending: true });

    if (stepsError) {
      console.error('Error fetching execution steps:', stepsError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch execution steps'
          }
        },
        { status: 500 }
      );
    }

    // Map database records to TypeScript interfaces
    const executionSteps: ExecutionStep[] = (steps || []).map(step => ({
      id: step.id,
      planId: step.plan_id,
      stepIndex: step.step_index,
      type: step.type,
      chainId: step.chain_id,
      to: step.to,
      value: step.value,
      data: step.data,
      gasLimit: step.gas_limit,
      maxFeePerGas: step.max_fee_per_gas,
      maxPriorityFeePerGas: step.max_priority_fee_per_gas,
      status: step.status,
      txHash: step.tx_hash,
      blockNumber: step.block_number,
      gasUsed: step.gas_used,
      effectiveGasPrice: step.effective_gas_price,
      error: step.error,
      createdAt: step.created_at,
      updatedAt: step.updated_at
    }));

    // Calculate execution progress
    const totalSteps = executionSteps.length;
    const completedSteps = executionSteps.filter(step => step.status === 'confirmed').length;
    const failedSteps = executionSteps.filter(step => step.status === 'failed').length;
    const pendingSteps = executionSteps.filter(step => 
      ['pending', 'submitted', 'simulating'].includes(step.status)
    ).length;

    // Calculate freshness based on most recent step update
    const mostRecentUpdate = executionSteps.reduce((latest, step) => {
      const stepTime = new Date(step.updatedAt).getTime();
      return stepTime > latest ? stepTime : latest;
    }, new Date(plan.updated_at).getTime());

    const freshness: FreshnessConfidence = {
      freshnessSec: Math.floor((Date.now() - mostRecentUpdate) / 1000),
      confidence: 1.0, // Step data is always authoritative
      confidenceThreshold: 0.70,
      degraded: false
    };

    return NextResponse.json({
      data: {
        planId,
        steps: executionSteps,
        summary: {
          totalSteps,
          completedSteps,
          failedSteps,
          pendingSteps,
          overallStatus: determineOverallStatus(executionSteps)
        },
        freshness
      },
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Plan steps API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch execution steps'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Determine overall execution status based on individual step statuses
 */
function determineOverallStatus(steps: ExecutionStep[]): string {
  if (steps.length === 0) {
    return 'empty';
  }

  const hasFailures = steps.some(step => step.status === 'failed');
  const hasPending = steps.some(step => 
    ['pending', 'submitted', 'simulating'].includes(step.status)
  );
  const allCompleted = steps.every(step => step.status === 'confirmed');

  if (hasFailures) {
    return 'failed';
  }
  
  if (hasPending) {
    return 'executing';
  }
  
  if (allCompleted) {
    return 'completed';
  }
  
  return 'unknown';
}

/**
 * Get user ID from authentication
 */
async function getUserIdFromAuth(request: NextRequest): Promise<string | null> {
  // TODO: Implement proper authentication
  // This is a placeholder implementation
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  // For now, return a mock user ID
  return 'mock-user-id';
}