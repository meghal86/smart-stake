import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IntentPlan, ExecutionStep, FreshnessConfidence } from '@/types/portfolio';

/**
 * GET /api/v1/portfolio/plans/:id
 * 
 * Returns the canonical state of an intent plan including all execution steps.
 * This endpoint provides the complete plan state for monitoring and audit purposes.
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

    // Get the intent plan
    const { data: plan, error: planError } = await supabase
      .from('intent_plans')
      .select('*')
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

      console.error('Error fetching intent plan:', planError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch intent plan'
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
    const intentPlan: IntentPlan = {
      id: plan.id,
      userId: plan.user_id,
      intent: plan.intent,
      walletScope: plan.wallet_scope,
      steps: plan.steps,
      status: plan.status,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      idempotencyKey: plan.idempotency_key,
      simulationReceiptId: plan.simulation_receipt_id
    };

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

    // Calculate freshness and confidence
    const freshness: FreshnessConfidence = {
      freshnessSec: Math.floor((Date.now() - new Date(plan.updated_at).getTime()) / 1000),
      confidence: 1.0, // Plan data is always authoritative
      confidenceThreshold: 0.70,
      degraded: false
    };

    return NextResponse.json({
      data: {
        plan: intentPlan,
        steps: executionSteps,
        freshness
      },
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Plans API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch intent plan'
        }
      },
      { status: 500 }
    );
  }
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