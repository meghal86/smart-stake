/**
 * Wagmi Configuration for Guardian Wallet Integration
 */
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, base, optimism } from 'wagmi/chains';

// Get environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f13ce31c7183dda28756902c7195ab5e';
const appName = 'AlphaWhale Guardian';

// Export as 'config' to match App.tsx import
export const config = getDefaultConfig({
  appName,
  projectId,
  chains: [mainnet, polygon, arbitrum, base, optimism],
  ssr: false, // Vite doesn't use SSR
});

// Also export as wagmiConfig for backward compatibility
export const wagmiConfig = config;

export const supportedChains = {
  ethereum: mainnet.id,
  polygon: polygon.id,
  arbitrum: arbitrum.id,
  base: base.id,
  optimism: optimism.id,
};

export const chainIdToName: Record<number, string> = {
  [mainnet.id]: 'ethereum',
  [polygon.id]: 'polygon',
  [arbitrum.id]: 'arbitrum',
  [base.id]: 'base',
  [optimism.id]: 'optimism',
};
