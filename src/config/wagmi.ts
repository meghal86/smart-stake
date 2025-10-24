/**
 * Wagmi Configuration for Guardian Wallet Connection
 * Supports: Ethereum, Base, Polygon, Arbitrum
 */
import { createConfig, http } from 'wagmi';
import { mainnet, base, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Get WalletConnect project ID from env (fallback to a working demo)
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '7c6009e2b008c2f2b05de06fab2bb13f';

console.log('🔗 Wallet connectors initializing...');

export const config = createConfig({
  chains: [mainnet, base, polygon, arbitrum],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({ 
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'AlphaWhale Guardian',
      appLogoUrl: 'https://alphawhale.io/logo.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: false,
});

// Export chains for RainbowKit
export { mainnet, base, polygon, arbitrum };

