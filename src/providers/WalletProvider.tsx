/**
 * Wagmi/RainbowKit Wallet Provider
 * Real wallet integration for Guardian
 */
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo';
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Configure chains
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, base, arbitrum, polygon],
  [
    alchemyProvider({ apiKey: ALCHEMY_KEY }),
    publicProvider(),
  ]
);

// Configure wallets
const { wallets } = getDefaultWallets({
  appName: 'AlphaWhale Guardian',
  projectId: PROJECT_ID,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
]);

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: '#14b8a6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export { chains };

