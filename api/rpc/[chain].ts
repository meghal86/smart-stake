import type { VercelRequest, VercelResponse } from '@vercel/node';

// RPC endpoint mapping
const RPC_ENDPOINTS: Record<string, string[]> = {
  ethereum: [
    process.env.ALCHEMY_ETH_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    'https://ethereum.publicnode.com',
    'https://rpc.ankr.com/eth',
  ],
  polygon: [
    process.env.ALCHEMY_POLYGON_URL || `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    'https://polygon.publicnode.com',
  ],
  arbitrum: [
    process.env.ALCHEMY_ARB_URL || `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    'https://arbitrum.publicnode.com',
  ],
  optimism: [
    process.env.ALCHEMY_OP_URL || `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    'https://optimism.publicnode.com',
  ],
  base: [
    process.env.ALCHEMY_BASE_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    'https://base.publicnode.com',
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests allowed' } });
  }

  // Get chain from URL path
  const chain = req.query.chain as string;

  // Validate chain
  if (!chain || !RPC_ENDPOINTS[chain]) {
    return res.status(400).json({ 
      error: { 
        code: 'INVALID_CHAIN', 
        message: `Chain ${chain} not supported. Valid chains: ${Object.keys(RPC_ENDPOINTS).join(', ')}` 
      } 
    });
  }

  try {
    const body = req.body;
    
    // Try each RPC endpoint in order (fallback)
    const endpoints = RPC_ENDPOINTS[chain];
    let lastError: Error | null = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!response.ok) {
          throw new Error(`RPC request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Success - return the RPC response
        return res.status(200).json(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        // Continue to next endpoint
        continue;
      }
    }
    
    // All endpoints failed
    throw lastError || new Error('All RPC endpoints failed');
    
  } catch (error) {
    console.error(`RPC proxy error for ${chain}:`, error);
    
    return res.status(500).json({
      error: {
        code: 'RPC_ERROR',
        message: error instanceof Error ? error.message : 'RPC request failed',
      },
    });
  }
}
