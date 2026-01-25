import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { IntentPlan, WalletScope, ExecutionStep } from '@/types/portfolio';
import { createPolicyEngine, type PolicyContext } from '@/lib/portfolio/PolicyEngine';
import { policyConfigService } from '@/services/policyConfigService';

// Request validation schema
const createPlanSchema = z.object({
  intent: z.string().min(1),
  walletScope: z.union([
    z.object({
      mode: z.literal('active_wallet'),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
    }),
    z.object({
      mode: z.literal('all_wallets')
    })
  ]),
  params: z.record(z.any()).optional().default({}),
  idempotencyKey: z.string().min(16)
});

// Mock intent planning service (would be implemented in actual ActionEngine)
const generateIntentPlan = async (
  userId: string,
  intent: string,
  walletScope: WalletScope,
  params: Record<string, any>,
  idempotencyKey: string
): Promise<IntentPlan> => {
  // Generate plan ID
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate steps based on intent type
  const steps: ExecutionStep[] = [];
  
  switch (intent) {
    case 'revoke_approvals':
      steps.push({
        stepId: 'revoke_1',
        kind: 'revoke',
        chainId: 1,
        target_address: params.spender || '0x1234567890123456789012345678901234567890',
        status: 'pending'
      });
      break;
    case 'claim_rewards':
      steps.push({
        stepId: 'claim_1',
        kind: 'approve',
        chainId: params.chainId || 1,
        target_address: params.protocol || '0x1234567890123456789012345678901234567890',
        status: 'pending'
      });
      break;
    case 'rebalance_portfolio':
      steps.push(
        {
          stepId: 'approve_1',
          kind: 'approve',
          chainId: 1,
          target_address: '0x1234567890123456789012345678901234567890',
          status: 'pending'
        },
        {
          stepId: 'swap_1',
          kind: 'swap',
          chainId: 1,
          target_address: '0x1234567890123456789012345678901234567890',
          status: 'pending'
        }
      );
      break;
    default:
      steps.push({
        stepId: 'generic_1',
        kind: 'transfer',
        chainId: 1,
        target_address: '0x1234567890123456789012345678901234567890',
        status: 'pending'
      });
  }
  
  // Policy check using PolicyEngine
  const userPolicyConfig = await policyConfigService.loadUserPolicyConfig(userId);
  const policyEngine = createPolicyEngine(userPolicyConfig);
  
  // Check daily transaction limit
  const dailyLimit = await policyConfigService.checkDailyTransactionLimit(userId);
  if (dailyLimit.exceeded) {
    return {
      ...plan,
      policy: {
        status: 'blocked' as const,
        violations: [`DAILY_LIMIT_EXCEEDED: ${dailyLimit.current}/${dailyLimit.limit} transactions today`]
      }
    };
  }
  
  // Estimate gas cost (mock - would be calculated by actual gas estimation service)
  const totalGasEstimateUsd = steps.length * 10; // $10 per step estimate
  
  // Mock contract ages (would be fetched from blockchain data service)
  const contractAges: Record<string, number> = {};
  for (const step of steps) {
    contractAges[step.target_address] = Math.floor(Math.random() * 365); // Random age for demo
  }
  
  const policyContext: PolicyContext = {
    userId,
    walletScope,
    steps,
    totalGasEstimateUsd,
    totalValueUsd: params.valueUsd || 0,
    confidence: 0.85, // Mock confidence - would come from data aggregation
    contractAges
  };
  
  const policyCheck = await policyEngine.checkPolicy(policyContext);
  
  // Mock simulation (would be implemented in SimulationService)
  const simulation = {
    status: 'pass' as const,
    receiptId: `sim_${planId}`
  };
  
  // Mock impact preview
  const impactPreview = {
    gasEstimateUsd: 10.5,
    timeEstimateSec: 30,
    riskDelta: -0.2
  };
  
  return {
    id: planId,
    intent,
    steps,
    policy: policyCheck,
    simulation,
    impactPreview,
    walletScope,
    idempotencyKey,
    status: 'pending'
  };
};

export async function POST(request: NextRequest) {
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
    const validationResult = createPlanSchema.safeParse(body);
    
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

    const { intent, walletScope, params, idempotencyKey } = validationResult.data;

    // Check for existing plan with same idempotency key
    const { data: existingPlan } = await supabase
      .from('intent_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingPlan) {
      // Return existing plan
      return NextResponse.json({
        data: existingPlan,
        apiVersion: 'v1',
        ts: new Date().toISOString()
      });
    }

    // Generate new intent plan
    const plan = await generateIntentPlan(
      user.id,
      intent,
      walletScope,
      params,
      idempotencyKey
    );

    // Store plan in database
    const { data: storedPlan, error: storeError } = await supabase
      .from('intent_plans')
      .insert({
        id: plan.id,
        user_id: user.id,
        intent: plan.intent,
        wallet_scope: plan.walletScope,
        steps: plan.steps,
        policy_status: plan.policy.status,
        policy_violations: plan.policy.violations,
        simulation_status: plan.simulation.status,
        simulation_receipt_id: plan.simulation.receiptId,
        impact_preview: plan.impactPreview,
        idempotency_key: plan.idempotencyKey,
        status: plan.status || 'pending'
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing intent plan:', storeError);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create intent plan'
          }
        },
        { status: 500 }
      );
    }

    // Store execution steps
    const stepsToInsert = plan.steps.map(step => ({
      plan_id: plan.id,
      step_id: step.stepId,
      kind: step.kind,
      chain_id: step.chainId,
      target_address: step.target_address,
      status: step.status,
      payload: step.payload,
      gas_estimate: step.gas_estimate,
      error_message: step.error_message,
      transaction_hash: step.transaction_hash,
      block_number: step.block_number,
      step_idempotency_key: step.step_idempotency_key || `${step.stepId}_${Date.now()}`
    }));

    const { error: stepsError } = await supabase
      .from('execution_steps')
      .insert(stepsToInsert);

    if (stepsError) {
      console.error('Error storing execution steps:', stepsError);
      // Clean up the plan if steps failed to insert
      await supabase
        .from('intent_plans')
        .delete()
        .eq('id', plan.id);
      
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create execution steps'
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: plan,
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in POST /api/v1/portfolio/plan:', error);
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