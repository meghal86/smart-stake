/**
 * Mixer interaction detection (Tornado Cash, etc.)
 */

// Known mixer addresses across chains
export const MIXER_ADDRESSES: Record<string, string[]> = {
  ethereum: [
    '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936', // Tornado 0.1 ETH
    '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', // Tornado 1 ETH
    '0xa160cdab225685da1d56aa342ad8841c3b53f291', // Tornado 10 ETH
    '0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a', // Tornado 100 ETH
    '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3', // Tornado 1000 DAI
    '0x169ad27a470d064dede56a2d3ff727986b15d52b', // Tornado 10000 DAI
  ],
  base: [
    // Add Base chain mixers if any
  ],
  arbitrum: [
    // Add Arbitrum mixers
  ],
  polygon: [
    // Add Polygon mixers
  ],
  optimism: [
    // Add Optimism mixers
  ],
};

export interface MixerProximityResult {
  hasMixerActivity: boolean;
  proximityScore: number; // 0-100, higher = closer/more suspicious
  directInteractions: number;
  oneHopInteractions: number;
  lastInteraction: number | null; // Unix timestamp
  mixerAddresses: string[];
}

/**
 * Check for direct mixer interactions
 */
function checkDirectMixerInteractions(
  transactions: unknown[],
  mixerAddresses: string[]
): {
  count: number;
  lastTimestamp: number | null;
  addresses: string[];
} {
  const mixerSet = new Set(mixerAddresses.map((a) => a.toLowerCase()));
  let count = 0;
  let lastTimestamp: number | null = null;
  const foundAddresses: string[] = [];

  for (const tx of transactions) {
    const to = tx.to?.toLowerCase();
    const from = tx.from?.toLowerCase();

    if (to && mixerSet.has(to)) {
      count++;
      foundAddresses.push(to);
      if (!lastTimestamp || tx.timestamp > lastTimestamp) {
        lastTimestamp = tx.timestamp;
      }
    }

    if (from && mixerSet.has(from)) {
      count++;
      foundAddresses.push(from);
      if (!lastTimestamp || tx.timestamp > lastTimestamp) {
        lastTimestamp = tx.timestamp;
      }
    }
  }

  return {
    count,
    lastTimestamp,
    addresses: Array.from(new Set(foundAddresses)),
  };
}

/**
 * Check for one-hop mixer interactions (address interacted with someone who used a mixer)
 */
function checkOneHopMixerInteractions(
  transactions: unknown[],
  mixerAddresses: string[],
  targetAddress: string
): {
  count: number;
  intermediaries: string[];
} {
  const mixerSet = new Set(mixerAddresses.map((a) => a.toLowerCase()));
  const intermediaries = new Set<string>();
  let count = 0;

  // Get all addresses that interacted with target
  const interactedAddresses = new Set<string>();
  for (const tx of transactions) {
    const to = tx.to?.toLowerCase();
    const from = tx.from?.toLowerCase();
    const target = targetAddress.toLowerCase();

    if (from === target && to) {
      interactedAddresses.add(to);
    }
    if (to === target && from) {
      interactedAddresses.add(from);
    }
  }

  // Check if any of those addresses interacted with mixers
  // (This is simplified - real implementation would fetch their transactions)
  // For now, we'll just check within the same transaction set
  for (const tx of transactions) {
    const to = tx.to?.toLowerCase();
    const from = tx.from?.toLowerCase();

    if (from && interactedAddresses.has(from) && to && mixerSet.has(to)) {
      intermediaries.add(from);
      count++;
    }

    if (to && interactedAddresses.has(to) && from && mixerSet.has(from)) {
      intermediaries.add(to);
      count++;
    }
  }

  return {
    count,
    intermediaries: Array.from(intermediaries),
  };
}

/**
 * Calculate mixer proximity score
 */
function calculateProximityScore(
  directCount: number,
  oneHopCount: number,
  lastInteraction: number | null
): number {
  let score = 0;

  // Direct interactions are highly suspicious
  score += directCount * 50;

  // One-hop interactions are moderately suspicious
  score += oneHopCount * 10;

  // Recent interactions increase score
  if (lastInteraction) {
    const daysSince = (Date.now() / 1000 - lastInteraction) / (24 * 60 * 60);
    if (daysSince < 30) {
      score += 30;
    } else if (daysSince < 90) {
      score += 15;
    } else if (daysSince < 180) {
      score += 5;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Check mixer proximity for an address
 */
export async function checkMixerProximity(
  address: string,
  chain: string,
  transactions: unknown[]
): Promise<MixerProximityResult> {
  const mixerAddresses = MIXER_ADDRESSES[chain.toLowerCase()] || [];

  if (mixerAddresses.length === 0) {
    return {
      hasMixerActivity: false,
      proximityScore: 0,
      directInteractions: 0,
      oneHopInteractions: 0,
      lastInteraction: null,
      mixerAddresses: [],
    };
  }

  // Check direct interactions
  const direct = checkDirectMixerInteractions(transactions, mixerAddresses);

  // Check one-hop interactions (limited to avoid expensive computation)
  const oneHop = checkOneHopMixerInteractions(
    transactions.slice(0, 50), // Limit to recent 50 transactions
    mixerAddresses,
    address
  );

  // Calculate proximity score
  const proximityScore = calculateProximityScore(
    direct.count,
    oneHop.count,
    direct.lastTimestamp
  );

  return {
    hasMixerActivity: direct.count > 0 || oneHop.count > 0,
    proximityScore,
    directInteractions: direct.count,
    oneHopInteractions: oneHop.count,
    lastInteraction: direct.lastTimestamp,
    mixerAddresses: direct.addresses,
  };
}

/**
 * Get mixer proximity severity
 */
export function getMixerSeverity(
  proximityScore: number
): 'high' | 'medium' | 'low' | 'none' {
  if (proximityScore >= 80) return 'high';
  if (proximityScore >= 40) return 'medium';
  if (proximityScore > 0) return 'low';
  return 'none';
}

/**
 * Format mixer proximity for display
 */
export function formatMixerProximity(result: MixerProximityResult): string {
  if (result.directInteractions > 0) {
    return `Direct mixer interactions: ${result.directInteractions}`;
  }

  if (result.oneHopInteractions > 0) {
    return `Indirect mixer exposure: ${result.oneHopInteractions} intermediary addresses`;
  }

  return 'No mixer activity detected';
}

