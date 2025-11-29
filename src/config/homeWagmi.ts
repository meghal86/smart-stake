/**
 * Wagmi Configuration for AlphaWhale Home Page
 * Configured for mainnet and sepolia chains with WalletConnect v2
 */
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

// Get WalletConnect project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 
                  import.meta.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                  'f13ce31c7183dda28756902c7195ab5e';

if (!projectId) {
  console.warn('WalletConnect project ID not found in environment variables');
}

// Get RPC URLs from environment (optional - falls back to public RPCs)
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 
                      import.meta.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const infuraApiKey = import.meta.env.VITE_INFURA_API_KEY || 
                     import.meta.env.NEXT_PUBLIC_INFURA_API_KEY;

export const homeWagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: 'AlphaWhale',
        description: 'Master Your DeFi Risk & Yield – In Real Time',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://alphawhale.io',
        icons: ['https://alphawhale.io/favicon.ico'],
      },
    }),
    coinbaseWallet({
      appName: 'AlphaWhale',
    }),
  ],
  transports: {
    // Use Alchemy if available, otherwise Infura, otherwise public RPC
    [mainnet.id]: http(
      alchemyApiKey 
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
        : infuraApiKey
        ? `https://mainnet.infura.io/v3/${infuraApiKey}`
        : undefined // Falls back to wagmi's default public RPC
    ),
    [sepolia.id]: http(
      alchemyApiKey 
        ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
        : infuraApiKey
        ? `https://sepolia.infura.io/v3/${infuraApiKey}`
        : undefined // Falls back to wagmi's default public RPC
    ),
  },
});

// Export supported chains for reference
export const supportedChains = {
  mainnet: mainnet.id,
  sepolia: sepolia.id,
};

export const chainIdToName: Record<number, string> = {
  [mainnet.id]: 'mainnet',
  [sepolia.id]: 'sepolia',
};
