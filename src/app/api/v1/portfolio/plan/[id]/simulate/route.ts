import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SimulationReceipt } from '@/types/portfolio';

// Mock simulation service (would be implemented in actual SimulationService)
const simulateIntentPlan = async (
  planId: string,
  walletScope: any,
  steps: any[]
): Promise<SimulationReceipt> => {
  // Generate simulation receipt ID
  const receiptId = `sim_${planId}_${Date.now()}`;
  
  // Mock asset deltas based on steps
  const assetDeltas = steps.map((step, index) => {
    switch (step.kind) {
      case 'revoke':
        return {
          token: 'USDC',
          amount: 0, // No asset change for revoke
          valueUsd: 0
        };
      case 'approve':
        return {
          token: 'ETH',
          amount: -0.01, // Gas cost
          valueUsd: -25
        };
      case 'swap':
        return {
          token: index % 2 === 0 ? 'ETH' : 'USDC',
          amount: index % 2 === 0 ? -1 : 2500,
          valueUsd: index % 2 === 0 ? -2500 : 2500
        };
      case 'transfer':
        return {
          token: 'USDC',
          amount: -100,
          valueUsd: -100
        };
      default:
        return {
          token: 'ETH',
          amount: -0.005,
          valueUsd: -12.5
        };
    }
  });

  // Mock gas estimate
  const totalGasEstimate = steps.length * 50000; // 50k gas per step
  const gasEstimateUsd = (totalGasEstimate * 20 * 2500) / 1e18; // 20 gwei, ETH at $2500

  // Mock time estimate
  const timeEstimateSec = steps.length * 15; // 15 seconds per step

  // Mock warnings based on step analysis
  const warnings: string[] = [];
  
  // Check for high-risk operations
  const hasHighValueTransfer = assetDeltas.some(delta => 
    Math.abs(delta.valueUsd || 0) > 1000
  );
  if (hasHighValueTransfer) {
    warnings.push('High value transfer detected - please verify recipient');
  }

  // Check for new contracts (mock)
  const hasNewContract = steps.some(step => 
    step.target_address === '0x1234567890123456789012345678901234567890'
  );
  if (hasNewContract) {
    warnings.push('Interacting with unverified contract - proceed with caution');
  }

  // Mock confidence based on warnings
  const confidence = warnings.length === 0 ? 0.95 : 
                    warnings.length === 1 ? 0.75 : 0.55;

  return {
    id: receiptId,
    assetDeltas,
    gasEstimateUsd,
    timeEstimateSec,
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence
  };
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

    // Get execution steps
    const { data: steps, error: stepsError } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('plan_id', planId)
      .order('step_id');

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

    // Check if simulation already exists and is not expired
    const { data: existingReceipt } = await supabase
      .from('simulation_receipts')
      .select('*')
      .eq('plan_id', planId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingReceipt) {
      // Return existing simulation
      const receipt: SimulationReceipt = {
        id: existingReceipt.id,
        gasEstimateUsd: 15.5, // Mock data
        timeEstimateSec: 45,
        confidence: 0.85
      };

      return NextResponse.json({
        data: receipt,
        apiVersion: 'v1',
        ts: new Date().toISOString()
      });
    }

    // Run simulation
    const simulationResult = await simulateIntentPlan(
      planId,
      plan.wallet_scope,
      steps || []
    );

    // Store simulation receipt
    const expiresAt = new Date(Date.now() + 60000); // 60 seconds TTL
    const { error: receiptError } = await supabase
      .from('simulation_receipts')
      .insert({
        id: simulationResult.id,
        plan_id: planId,
        user_id: user.id,
        wallet_scope_hash: JSON.stringify(plan.wallet_scope),
        chain_set_hash: JSON.stringify(steps?.map(s => s.chain_id) || []),
        simulator_version: 'v1.0.0',
        expires_at: expiresAt.toISOString()
      });

    if (receiptError) {
      console.error('Error storing simulation receipt:', receiptError);
      // Continue anyway - simulation was successful
    }

    // Update plan simulation status
    const simulationStatus = simulationResult.warnings && simulationResult.warnings.length > 0 ? 
      'warn' : 'pass';
    
    await supabase
      .from('intent_plans')
      .update({
        simulation_status: simulationStatus,
        simulation_receipt_id: simulationResult.id
      })
      .eq('id', planId);

    return NextResponse.json({
      data: simulationResult,
      apiVersion: 'v1',
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in POST /api/v1/portfolio/plan/[id]/simulate:', error);
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