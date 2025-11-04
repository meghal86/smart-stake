/**
 * Transaction Pre-Simulation
 * Simulates transactions before user signs them
 */
import { parseAbi, encodeFunctionData, type Hex } from 'viem';

export interface SimulationResult {
  success: boolean;
  gasEstimate?: bigint;
  reason?: string;
  scoreDelta?: {
    min: number;
    max: number;
  };
}

/**
 * Simulate a revoke transaction using Alchemy's Simulation API
 */
export async function simulateRevokeTransaction(
  userAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  chainId: number
): Promise<SimulationResult> {
  try {
    // Build the approve(spender, 0) transaction
    const abi = parseAbi([
      'function approve(address spender, uint256 amount) returns (bool)',
    ]);
    
    const data = encodeFunctionData({
      abi,
      functionName: 'approve',
      args: [spenderAddress, 0n],
    });

    const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      return {
        success: false,
        reason: 'Alchemy API key not configured',
      };
    }

    // Get network name from chain ID
    const networkMap: Record<number, string> = {
      1: 'eth-mainnet',
      137: 'polygon-mainnet',
      42161: 'arb-mainnet',
      8453: 'base-mainnet',
      10: 'opt-mainnet',
    };
    
    const network = networkMap[chainId] || 'eth-mainnet';
    const alchemyUrl = `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`;

    // Simulate using eth_estimateGas
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateGas',
        params: [
          {
            from: userAddress,
            to: tokenAddress,
            data,
          },
        ],
      }),
    });

    const result = await response.json();

    if (result.error) {
      return {
        success: false,
        reason: result.error.message || 'Simulation failed',
      };
    }

    const gasEstimate = BigInt(result.result);

    // Calculate potential score improvement
    // Revoking 1 unlimited approval = +15 points (up to +45 max)
    const scoreDelta = {
      min: 10,
      max: 15,
    };

    return {
      success: true,
      gasEstimate,
      scoreDelta,
    };
  } catch (error) {
    console.error('Simulation error:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch simulate multiple revoke transactions
 */
export async function simulateRevokeTransactions(
  userAddress: `0x${string}`,
  revocations: Array<{
    token: `0x${string}`;
    spender: `0x${string}`;
  }>,
  chainId: number
): Promise<{
  totalGasEstimate: bigint;
  scoreDelta: { min: number; max: number };
  perTransaction: SimulationResult[];
}> {
  const results = await Promise.all(
    revocations.map(({ token, spender }) =>
      simulateRevokeTransaction(userAddress, token, spender, chainId)
    )
  );

  const totalGasEstimate = results.reduce(
    (sum, r) => sum + (r.gasEstimate || 0n),
    0n
  );

  // Calculate cumulative score improvement
  const numRevocations = revocations.length;
  const scoreDelta = {
    min: Math.min(numRevocations * 10, 45),
    max: Math.min(numRevocations * 15, 45),
  };

  return {
    totalGasEstimate,
    scoreDelta,
    perTransaction: results,
  };
}

/**
 * Format gas estimate for display
 */
export function formatGasEstimate(gasEstimate: bigint): string {
  return gasEstimate.toString();
}

/**
 * Estimate gas cost in USD (requires ETH price)
 */
export function estimateGasCostUSD(
  gasEstimate: bigint,
  gasPriceGwei: number,
  ethPriceUSD: number
): string {
  const gasCostETH = Number(gasEstimate) * gasPriceGwei * 1e-9;
  const gasCostUSD = gasCostETH * ethPriceUSD;
  return gasCostUSD.toFixed(2);
}




