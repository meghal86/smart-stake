/**
 * Honeypot token detection
 */

export interface HoneypotResult {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Check if a token is a honeypot using external API
 */
export async function checkHoneypot(
  tokenAddress: string,
  chain: string
): Promise<HoneypotResult> {
  try {
    const apiUrl = import.meta.env.VITE_HONEYPOT_API_URL;

    if (!apiUrl || apiUrl === 'none') {
      // Use heuristic fallback
      return checkHoneypotHeuristic(tokenAddress, chain);
    }

    // Call honeypot.is API
    const response = await fetch(
      `${apiUrl}?address=${tokenAddress}&chain=${chain}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      return checkHoneypotHeuristic(tokenAddress, chain);
    }

    const data = await response.json();

    return {
      isHoneypot: data.honeypotResult?.isHoneypot || false,
      buyTax: data.simulationResult?.buyTax || 0,
      sellTax: data.simulationResult?.sellTax || 0,
      warnings: extractWarnings(data),
      confidence: 'high',
    };
  } catch (error) {
    console.error('Error checking honeypot:', error);
    return checkHoneypotHeuristic(tokenAddress, chain);
  }
}

/**
 * Extract warnings from honeypot API response
 */
function extractWarnings(data: any): string[] {
  const warnings: string[] = [];

  if (data.honeypotResult?.isHoneypot) {
    warnings.push('Token identified as honeypot');
  }

  if (data.simulationResult?.buyTax > 10) {
    warnings.push(`High buy tax: ${data.simulationResult.buyTax}%`);
  }

  if (data.simulationResult?.sellTax > 10) {
    warnings.push(`High sell tax: ${data.simulationResult.sellTax}%`);
  }

  if (data.contractCode?.includes('selfdestruct')) {
    warnings.push('Contract contains selfdestruct');
  }

  return warnings;
}

/**
 * Heuristic-based honeypot detection from contract source
 */
export async function checkHoneypotHeuristic(
  tokenAddress: string,
  chain: string
): Promise<HoneypotResult> {
  // This is a simplified heuristic
  // In production, you'd analyze the contract source code

  const warnings: string[] = [];
  let suspicionScore = 0;

  // Placeholder: In real implementation, fetch and analyze source code
  // Look for patterns like:
  // - onlyOwner on transfer functions
  // - blacklist/whitelist mappings
  // - paused state that can't be unpaused
  // - hidden tax logic
  // - time locks

  // For now, return neutral result
  return {
    isHoneypot: false,
    buyTax: 0,
    sellTax: 0,
    warnings,
    confidence: 'low',
  };
}

/**
 * Check for hidden mint patterns in contract
 */
export async function checkHiddenMint(
  tokenAddress: string,
  chain: string,
  contractSource?: string
): Promise<{
  hasHiddenMint: boolean;
  patterns: string[];
}> {
  const patterns: string[] = [];

  if (!contractSource) {
    return { hasHiddenMint: false, patterns };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    { regex: /function\s+mint\s*\([^)]*\)\s+(?!public|external)/i, name: 'Non-public mint function' },
    { regex: /_mint\s*\([^)]*owner/i, name: 'Direct mint to owner' },
    { regex: /totalSupply\s*\+=/i, name: 'Direct supply manipulation' },
    { regex: /balanceOf\[.*\]\s*\+=/i, name: 'Direct balance manipulation' },
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.regex.test(contractSource)) {
      patterns.push(pattern.name);
    }
  }

  return {
    hasHiddenMint: patterns.length > 0,
    patterns,
  };
}

/**
 * Analyze tax structure
 */
export function analyzeTaxes(buyTax: number, sellTax: number): {
  severity: 'high' | 'medium' | 'low' | 'none';
  description: string;
} {
  const totalTax = buyTax + sellTax;

  if (totalTax > 20) {
    return {
      severity: 'high',
      description: `Very high taxes: ${buyTax}% buy, ${sellTax}% sell`,
    };
  }

  if (totalTax > 10) {
    return {
      severity: 'medium',
      description: `Moderate taxes: ${buyTax}% buy, ${sellTax}% sell`,
    };
  }

  if (totalTax > 0) {
    return {
      severity: 'low',
      description: `Low taxes: ${buyTax}% buy, ${sellTax}% sell`,
    };
  }

  return {
    severity: 'none',
    description: 'No taxes detected',
  };
}

