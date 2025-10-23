/**
 * Token approval revocation utilities
 */

// Standard ERC20 ABI for approve function
const ERC20_APPROVE_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

export interface RevokeTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  chainId?: number;
}

/**
 * Build a revoke transaction (sets approval to 0)
 */
export function buildRevokeTx(
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  userAddress: `0x${string}`
): RevokeTransaction {
  // Encode approve(spender, 0) call
  // Function selector: approve(address,uint256) = 0x095ea7b3
  const selector = '0x095ea7b3';
  
  // Encode parameters: address (32 bytes) + uint256 (32 bytes)
  const spender = spenderAddress.slice(2).padStart(64, '0');
  const amount = '0'.padStart(64, '0'); // 0 amount to revoke

  const data = `${selector}${spender}${amount}` as `0x${string}`;

  return {
    to: tokenAddress,
    data,
    value: BigInt(0),
  };
}

/**
 * Build multiple revoke transactions
 */
export function buildBatchRevokeTxs(
  approvals: Array<{
    token: `0x${string}`;
    spender: `0x${string}`;
  }>,
  userAddress: `0x${string}`
): RevokeTransaction[] {
  return approvals.map((approval) =>
    buildRevokeTx(approval.token, approval.spender, userAddress)
  );
}

/**
 * Estimate gas for revoke transaction
 * Returns a rough estimate (actual may vary)
 */
export function estimateRevokeGas(count: number): bigint {
  // Base gas for approve call is ~45,000
  const baseGas = 45000n;
  const perTxGas = 45000n;
  
  return baseGas + perTxGas * BigInt(count);
}

/**
 * Format revoke transaction for display
 */
export function formatRevokeTx(
  tx: RevokeTransaction,
  tokenSymbol: string,
  spenderName?: string
): {
  title: string;
  description: string;
} {
  return {
    title: `Revoke ${tokenSymbol} Approval`,
    description: spenderName
      ? `Remove approval for ${spenderName}`
      : `Remove approval for contract ${tx.to.slice(0, 10)}...`,
  };
}

/**
 * Parse revoke transaction status
 */
export interface RevokeStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  gasUsed?: bigint;
  blockNumber?: number;
}

/**
 * Check if an address is a valid ERC20 token
 * Simple heuristic based on bytecode
 */
export function looksLikeERC20(bytecode: string): boolean {
  if (!bytecode || bytecode === '0x') return false;
  
  // Check for common ERC20 function selectors
  const erc20Selectors = [
    '095ea7b3', // approve
    'dd62ed3e', // allowance
    'a9059cbb', // transfer
    '23b872dd', // transferFrom
    '70a08231', // balanceOf
  ];

  const hasSelectors = erc20Selectors.filter((sel) =>
    bytecode.includes(sel)
  ).length;

  // If it has at least 3 ERC20 selectors, likely an ERC20
  return hasSelectors >= 3;
}

/**
 * Validation helper for revoke parameters
 */
export function validateRevokeParams(
  token: string,
  spender: string,
  user: string
): { valid: boolean; error?: string } {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (!addressRegex.test(token)) {
    return { valid: false, error: 'Invalid token address' };
  }

  if (!addressRegex.test(spender)) {
    return { valid: false, error: 'Invalid spender address' };
  }

  if (!addressRegex.test(user)) {
    return { valid: false, error: 'Invalid user address' };
  }

  if (token.toLowerCase() === spender.toLowerCase()) {
    return { valid: false, error: 'Token and spender cannot be the same' };
  }

  return { valid: true };
}

/**
 * Get common spender names (DEX routers, etc.)
 */
export function getSpenderName(address: string): string | undefined {
  const knownSpenders: Record<string, string> = {
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap Universal Router',
    '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch Router',
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff': '0x Exchange Proxy',
  };

  return knownSpenders[address.toLowerCase()];
}

