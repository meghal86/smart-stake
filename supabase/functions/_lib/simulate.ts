/**
 * Transaction Pre-Simulation
 * Verify transactions will succeed before user signs
 */

const ALCHEMY_KEY = Deno.env.get('ALCHEMY_API_KEY') || 'demo';

export interface SimulationResult {
  success: boolean;
  reason?: string;
  gasEstimate?: string;
  latencyMs: number;
}

export async function simulateTransaction(
  transaction: {
    from: string;
    to: string;
    data: string;
    value?: string;
  },
  chainId: number
): Promise<SimulationResult> {
  const start = Date.now();

  try {
    // Map chainId to Alchemy network
    const networkMap: Record<number, string> = {
      1: 'eth-mainnet',
      8453: 'base-mainnet',
      42161: 'arb-mainnet',
      137: 'polygon-mainnet',
    };

    const network = networkMap[chainId] || 'eth-mainnet';
    const alchemyUrl = `https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}`;

    // Simulate with eth_call
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            from: transaction.from,
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || '0x0',
          },
          'latest',
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        success: false,
        reason: `Simulation API error: ${response.status}`,
        latencyMs: Date.now() - start,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        reason: data.error.message || 'Simulation failed',
        latencyMs: Date.now() - start,
      };
    }

    // Estimate gas
    const gasResponse = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_estimateGas',
        params: [
          {
            from: transaction.from,
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || '0x0',
          },
        ],
      }),
    });

    let gasEstimate = '45000'; // Default for approve
    if (gasResponse.ok) {
      const gasData = await gasResponse.json();
      if (gasData.result) {
        gasEstimate = parseInt(gasData.result, 16).toString();
      }
    }

    return {
      success: true,
      gasEstimate,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Calculate risk delta (score improvement) from revoking approvals
 */
export function calculateRiskDelta(approvalsCount: number): { min: number; max: number } {
  // Each unlimited approval is -15 points
  // Revoking them gives back those points
  const pointsPerApproval = 15;
  const min = approvalsCount * pointsPerApproval * 0.5; // Conservative estimate
  const max = approvalsCount * pointsPerApproval;       // Optimistic estimate

  return { min: Math.round(min), max: Math.round(max) };
}

