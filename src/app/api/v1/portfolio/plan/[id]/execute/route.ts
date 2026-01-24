import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ExecutionStep } from '@/types/portfolio';

// Request validation schema
const executeRequestSchema = z.object({
  stepIds: z.array(z.string()).optional(), // If not provided, execute all ready steps
  force: z.boolean().optional().default(false) // Force execution despite warnings
});

// Mock execution service (would be implemented in actual ActionEngine)
const executeSteps = async (
  steps: ExecutionStep[],
  force: boolean = false
): Promise<{ stepId: string; success: boolean; txHash?: string; error?: string }[]> => {
  const results = [];
  
  for (const step of steps) {
    // Mock execution logic
    const shouldFail = Math.random() < 0.1; // 10% failure rate for testing
    
    if (shouldFail && !force) {
      results.push({
        stepId: step.stepId,
        success: false,
        error: 'Transaction simulation failed - insufficient gas'
      });
    } else {
      // Mock successful execution
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      results.push({
        stepId: step.stepId,
        success: true,
        txHash
      });
    }
  }
  
  return results;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const planId = params.id;

    // Check for idempotency key in headers
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required'
          }
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const validationResult = executeRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { stepIds, force } = validationResult.data;

    // Get the intent plan
    const { data: plan, error: planError } = await supabase
      .from('intent_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Intent plan not found'
          }
        },
        { status: 404 }
      );
    }

    // Check policy status
    if (plan.policy_status === 'blocked' && !force) {
      return NextResponse.json(
        {
          error: {
            code: 'POLICY_BLOCKED',
            message: 'Execution blocked by policy violations',
            details: plan.policy_violations
          }
        },
        { status: 403 }
      );
    }

    // Get execution steps
    let stepsQuery = supabase
      .from('execution_steps')
      .select('*')
      .eq('plan_id', planId);

    if (stepIds && stepIds.length > 0) {
      stepsQuery = stepsQuery.in('step_id', stepIds);
    }

    const { data: steps, error: stepsError } = await stepsQuery.order('step_id');

    if (stepsError) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve execution steps'
          }
        },
        { status: 500 }
      );
    }

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_STEPS_FOUND',
            message: 'No executable steps found'
          }
        },
        { status: 404 }
      );
    }

    // Check for duplicate execution with same idempotency key
    const { data: existingExecution } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('plan_id', planId)
      .eq('step_idempotency_key', idempotencyKey)
      .single();

    if (existingExecution) {
      // Return existing execution result
      return NextResponse.json({
        data: {
          stepStates: steps.map(step => ({
            stepId: step.step_id,
            status: step.status,
            transactionHash: step.transaction_hash,
            error: step.error_message
          }))
        },
        apiVersion: 'v1',
        ts: new Date().toISOString()
      });
    }

    // Filter steps that are ready for execution
    const executableSteps = steps.filter(step => 
      step.status === 'ready' || (force && ['blocked', 'failed'].includes(step.status))
    );

    if (executableSteps.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_EXECUTABLE_STEPS',
            message: 'No steps are ready for execution'
          }
        },
        { status: 400 }
      );
    }

    // Update plan status to executing
    await supabase
      .from('intent_plans')
      .update({ status: 'executing' })
      .eq('id', planId);

    // Update steps to signing status
    await supabase
      .from('execution_steps')
      .update({ 
        status: 'signing',
        step_idempotency_key: idempotencyKey
      })
      .in('id', executableSteps.map(s => s.id));

    // Execute steps
    const executionResults = await executeSteps(
      executableSteps.map(step => ({
        stepId: step.step_id,
        kind: step.kind as any,
        chainId: step.chain_id,
        target_address: step.target_address,
        status: step.status as any,
        payload: step.payload,
        gas_estimate: step.gas_estimate,
        error_message: step.error_message,
        transaction_hash: step.transaction_hash,
        block_number: step.block_number,
        step_idempotency_key: step.step_idempotency_key
      })),
      force
    );

    // Update step statuses based on execution results
    const stepUpdates = executionResults.map(result => {
      const step = executableSteps.find(s => s.step_id === result.stepId);
      if (!step) return null;

      return supabase
        .from('execution_steps')
        .update({
          status: result.success ? 'confirmed' : 'failed',
          transaction_hash: result.txHash,
          error_message: result.error,
          block_number: result.success ? Math.floor(Math.random() * 1000000) + 18000000 : null
        })
        .eq('id', step.id);
    }).filter(Boolean);

    // Execute all updates
    await Promise.all(stepUpdates);

    // Update plan status based on results
    const allSuccessful = executionResults.every(r => r.success);
    const anySuccessful = executionResults.some(r => r.success);
    
    let planStatus = 'executing';
    if (allSuccessful) {
      planStatus = 'completed';
    } else if (!anySuccessful) {
      planStatus = 'failed';
    }

    await supabase
      .from('intent_plans')
      .update({ status: planStatus })
      .eq('id', planId);

    // Get updated steps for response
    const { data: updatedSteps } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('plan_id', planId)
      .order('step_id');

    const stepStates = (updatedSteps || []).map(step => ({
      stepId: step.step_id,
      status: step.status,
      transactionHash: step.transaction_hash,
      blockNumber: step.block_number,
      error: step.error_message,
      gasEstimate: step.gas_estimate
    }));

    return NextResponse.json({
      data: {
        stepStates,
        planStatus,
        executionSummary: {
          total: executionResults.length,
          successful: executionResults.filter(r => r.success).length,
          failed: executionResults.filter(r => !r.success).length
        }
      },
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in POST /api/v1/portfolio/plan/[id]/execute:', error);
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