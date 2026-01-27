import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schemas
const WalletScopeSchema = z.union([
  z.object({
    mode: z.literal('active_wallet'),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  }),
  z.object({
    mode: z.literal('all_wallets')
  })
]);

const CopilotStreamParamsSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  scope: z.enum(['active_wallet', 'all_wallets']).default('active_wallet'),
  message: z.string().optional()
});

// Copilot taxonomy types
type CopilotStreamEvent =
  | { type: 'message'; text: string }
  | { type: 'action_card'; payload: ActionCard }
  | { type: 'intent_plan'; payload: IntentPlan }
  | { type: 'capability_notice'; payload: { code: string; message: string } }
  | { type: 'done' };

interface ActionCard {
  type: 'ActionCard';
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  why: string[];
  impactPreview: {
    riskDelta: number;
    preventedLossP50Usd: number;
    expectedGainUsd: number;
    gasEstimateUsd: number;
    timeEstimateSec: number;
    confidence: number;
  };
  cta: {
    label: string;
    intent: string;
    params: Record<string, any>;
  };
  walletScope: WalletScope;
}

interface IntentPlan {
  type: 'IntentPlan';
  id: string;
  intent: string;
  steps: ExecutionStep[];
  policy: {
    status: 'allowed' | 'blocked';
    violations: string[];
  };
  simulation: {
    status: 'pass' | 'warn' | 'block';
    receiptId: string;
  };
  impactPreview: {
    gasEstimateUsd: number;
    timeEstimateSec: number;
    riskDelta: number;
  };
  walletScope: WalletScope;
}

interface ExecutionStep {
  stepId: string;
  kind: 'revoke' | 'approve' | 'swap' | 'transfer';
  chainId: number;
  target: string;
  status: 'pending' | 'simulated' | 'blocked' | 'ready' | 'signing' | 'submitted' | 'confirmed' | 'failed';
}

type WalletScope =
  | { mode: 'active_wallet'; address: string }
  | { mode: 'all_wallets' };

// Action verbs that should trigger ActionCard or IntentPlan
const ACTION_VERBS = [
  'revoke', 'approve', 'swap', 'transfer', 'execute', 'cancel', 'claim',
  'stake', 'unstake', 'withdraw', 'deposit', 'bridge', 'migrate',
  'harvest', 'compound', 'rebalance', 'liquidate', 'hedge'
];

// Prohibited automation promises
const AUTOMATION_PROMISES = [
  "I'll monitor daily",
  "I'll automatically rebalance",
  "I'll track this for you",
  "I'll keep watching",
  "I'll alert you when",
  "I'll automatically execute",
  "I'll handle this ongoing"
];

/**
 * GET /api/v1/portfolio/copilot/stream
 * 
 * Server-Sent Events endpoint for Copilot chat streaming.
 * Validates responses against taxonomy and prevents automation promises.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      wallet: searchParams.get('wallet'),
      scope: searchParams.get('scope') || 'active_wallet',
      message: searchParams.get('message')
    };
    
    const params = CopilotStreamParamsSchema.parse(rawParams);
    
    // Build wallet scope
    const walletScope: WalletScope = params.scope === 'active_wallet' && params.wallet
      ? { mode: 'active_wallet', address: params.wallet }
      : { mode: 'all_wallets' };
    
    // Validate wallet scope
    WalletScopeSchema.parse(walletScope);
    
    // Get user from auth (simplified for demo)
    const userId = 'demo-user-id'; // In real implementation, extract from auth
    
    // Create SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send meta event with API version (requirement from design doc)
        const metaEvent = `event: meta\ndata: ${JSON.stringify({ apiVersion: 'v1' })}\n\n`;
        controller.enqueue(encoder.encode(metaEvent));
        
        // Simulate Copilot processing
        simulateCopilotResponse(controller, encoder, walletScope, params.message);
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-API-Version': 'v1', // Required by design doc
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Copilot stream error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid request parameters',
            details: error.errors
          },
          apiVersion: 'v1'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start Copilot stream'
        },
        apiVersion: 'v1'
      },
      { status: 500 }
    );
  }
}

/**
 * Simulate Copilot response generation with taxonomy validation
 */
async function simulateCopilotResponse(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  walletScope: WalletScope,
  message?: string
) {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock response based on message content
    const responses = generateCopilotResponses(walletScope, message);
    
    // Stream each response with delays
    for (const response of responses) {
      // Validate response against taxonomy
      const validation = validateCopilotOutput(response);
      
      if (!validation.isValid) {
        // Send capability notice for invalid responses
        const capabilityNotice: CopilotStreamEvent = {
          type: 'capability_notice',
          payload: {
            code: 'INVALID_SCHEMA',
            message: "I can't execute this; missing plan schema"
          }
        };
        
        const eventData = `event: capability_notice\ndata: ${JSON.stringify(capabilityNotice)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
        continue;
      }
      
      // Send valid response
      const eventType = response.type.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase();
      const eventData = `event: ${eventType}\ndata: ${JSON.stringify(response)}\n\n`;
      controller.enqueue(encoder.encode(eventData));
      
      // Add delay between responses
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Send done event
    const doneEvent: CopilotStreamEvent = { type: 'done' };
    const doneData = `event: done\ndata: ${JSON.stringify(doneEvent)}\n\n`;
    controller.enqueue(encoder.encode(doneData));
    
    // Close the stream
    controller.close();
    
  } catch (error) {
    console.error('Error in Copilot response simulation:', error);
    
    // Send error as capability notice
    const errorNotice: CopilotStreamEvent = {
      type: 'capability_notice',
      payload: {
        code: 'PROCESSING_ERROR',
        message: 'I encountered an error processing your request. Please try again.'
      }
    };
    
    const errorData = `event: capability_notice\ndata: ${JSON.stringify(errorNotice)}\n\n`;
    controller.enqueue(encoder.encode(errorData));
    controller.close();
  }
}

/**
 * Generate mock Copilot responses based on input
 */
function generateCopilotResponses(walletScope: WalletScope, message?: string): CopilotStreamEvent[] {
  const responses: CopilotStreamEvent[] = [];
  
  // Always start with a message
  responses.push({
    type: 'message',
    text: `Analyzing your ${walletScope.mode === 'active_wallet' ? 'active wallet' : 'portfolio'}...`
  });
  
  // Check if message contains action verbs
  const hasActionVerb = message ? containsActionVerb(message) : false;
  
  if (hasActionVerb) {
    // Generate ActionCard for action-oriented requests
    responses.push({
      type: 'action_card',
      payload: generateMockActionCard(walletScope, message)
    });
    
    // Sometimes also generate an IntentPlan
    if (Math.random() > 0.5) {
      responses.push({
        type: 'intent_plan',
        payload: generateMockIntentPlan(walletScope, message)
      });
    }
  } else {
    // Generate informational response
    responses.push({
      type: 'message',
      text: 'I can help you analyze your portfolio, identify risks, and suggest optimizations. What would you like to know?'
    });
  }
  
  return responses;
}

/**
 * Check if text contains action verbs
 */
function containsActionVerb(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ACTION_VERBS.some(verb => lowerText.includes(verb));
}

/**
 * Validate Copilot output against taxonomy
 */
function validateCopilotOutput(output: CopilotStreamEvent): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for automation promises
  if (output.type === 'message') {
    const hasAutomationPromise = AUTOMATION_PROMISES.some(promise => 
      output.text.toLowerCase().includes(promise.toLowerCase())
    );
    
    if (hasAutomationPromise) {
      errors.push('Response contains prohibited automation promise');
    }
  }
  
  // Validate ActionCard structure
  if (output.type === 'action_card') {
    const actionCard = output.payload as ActionCard;
    if (!actionCard.id || !actionCard.title || !actionCard.severity) {
      errors.push('ActionCard missing required fields');
    }
    if (!['critical', 'high', 'medium', 'low'].includes(actionCard.severity)) {
      errors.push('ActionCard has invalid severity');
    }
  }
  
  // Validate IntentPlan structure
  if (output.type === 'intent_plan') {
    const intentPlan = output.payload as IntentPlan;
    if (!intentPlan.id || !intentPlan.intent || !Array.isArray(intentPlan.steps)) {
      errors.push('IntentPlan missing required fields');
    }
    if (!['allowed', 'blocked'].includes(intentPlan.policy.status)) {
      errors.push('IntentPlan has invalid policy status');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Generate mock ActionCard
 */
function generateMockActionCard(walletScope: WalletScope, message?: string): ActionCard {
  return {
    type: 'ActionCard',
    id: `act_${Date.now()}`,
    title: 'Revoke Risky Token Approval',
    severity: 'high',
    why: [
      'Unlimited approval to unknown spender detected',
      'Contract has not been audited recently',
      'High value at risk ($12,500 USDC)'
    ],
    impactPreview: {
      riskDelta: -2.3,
      preventedLossP50Usd: 12500,
      expectedGainUsd: 0,
      gasEstimateUsd: 8.50,
      timeEstimateSec: 30,
      confidence: 0.87
    },
    cta: {
      label: 'Revoke Approval',
      intent: 'revoke_approval',
      params: {
        token: '0xA0b86a33E6441e6e80D0c4C6C7556C974B1A4825',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
      }
    },
    walletScope
  };
}

/**
 * Generate mock IntentPlan
 */
function generateMockIntentPlan(walletScope: WalletScope, message?: string): IntentPlan {
  return {
    type: 'IntentPlan',
    id: `plan_${Date.now()}`,
    intent: 'revoke_risky_approvals',
    steps: [
      {
        stepId: 'step_1',
        kind: 'revoke',
        chainId: 1,
        target: '0xA0b86a33E6441e6e80D0c4C6C7556C974B1A4825',
        status: 'ready'
      }
    ],
    policy: {
      status: 'allowed',
      violations: []
    },
    simulation: {
      status: 'pass',
      receiptId: `sim_${Date.now()}`
    },
    impactPreview: {
      gasEstimateUsd: 8.50,
      timeEstimateSec: 30,
      riskDelta: -2.3
    },
    walletScope
  };
}