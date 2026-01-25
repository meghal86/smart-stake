/**
 * AddWalletWizard - Enterprise Add Wallet Flow
 * 
 * Full-screen guided wizard for adding new wallets.
 * STRICT: This is the ONLY way to add wallets - no header shortcuts.
 * 
 * Routes:
 * - /settings/wallets/add - Choose provider
 * - /settings/wallets/connecting - Connection in progress
 * - /settings/wallets/success - Success confirmation
 * 
 * UX Principles:
 * - Deliberate, guided flow
 * - Clear progress indication
 * - Proper error handling
 * - Mobile-first design
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Wallet, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useWalletRegistry } from '@/hooks/useWalletRegistry';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect } from 'wagmi';
import { toast } from 'sonner';

type WizardStep = 'providers' | 'connecting' | 'success';

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  helperText: string;
}

const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Browser extension',
    helperText: 'Most popular Ethereum wallet'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    description: 'Mobile & extension',
    helperText: 'Beautiful, easy to use'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '💙',
    description: 'Mobile & extension',
    helperText: 'From Coinbase exchange'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'QR code connection',
    helperText: 'Connect mobile wallets via QR'
  },
  {
    id: 'other',
    name: 'Other Wallets',
    icon: '💼',
    description: 'More options',
    helperText: 'Browse all available wallets'
  }
];

export default function AddWalletWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('providers');
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setActiveWallet, connectedWallets } = useWallet();
  const { addWallet } = useWalletRegistry();
  const { openConnectModal } = useConnectModal();
  const { address: wagmiAddress, isConnected: wagmiConnected, chain } = useAccount();
  const { connectors, connectAsync, error: connectError } = useConnect();

  // Debug RainbowKit availability
  useEffect(() => {
    console.log('🔍 RainbowKit Debug:', {
      openConnectModal: !!openConnectModal,
      wagmiAddress,
      wagmiConnected,
      timestamp: new Date().toISOString()
    });
  }, [openConnectModal, wagmiAddress, wagmiConnected]);

  // Track the last address handled during the connect flow
  const [handledAddress, setHandledAddress] = useState<string | null>(null);

  // Handle connection timeout - SIMPLIFIED
  useEffect(() => {
    if (currentStep === 'connecting') {
      // Simple timeout: Give up after 30 seconds
      const timeout = setTimeout(() => {
        console.log('⏰ Connection timeout - returning to provider selection');
        setConnectionError('Connection timed out. Please try again.');
        setCurrentStep('providers');
        setSelectedProvider(null);
      }, 30000);
      
      setConnectionTimeout(timeout);
      
      return () => clearTimeout(timeout);
    } else {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }
    }
  }, [currentStep]);

  const findConnectorForProvider = (provider: WalletProvider) => {
    const providerId = provider.id.toLowerCase();
    
    console.log('🔍 Looking for connector for provider:', providerId);
    console.log('🔍 Available connector IDs:', connectors.map(c => c.id));
    console.log('🔍 Available connector names:', connectors.map(c => c.name));
    
    const found = connectors.find((connector) => {
      const connectorId = connector.id.toLowerCase();
      const connectorName = connector.name.toLowerCase();

      if (providerId === 'metamask') {
        return connectorId.includes('metamask') || connectorName.includes('metamask');
      }
      if (providerId === 'coinbase') {
        return connectorId.includes('coinbase') || connectorName.includes('coinbase');
      }
      if (providerId === 'walletconnect') {
        return connectorId.includes('walletconnect') || connectorName.includes('walletconnect');
      }
      if (providerId === 'rainbow') {
        return connectorId.includes('rainbow') || connectorName.includes('rainbow');
      }
      return false;
    });
    
    console.log('🔍 Found connector:', found ? { id: found.id, name: found.name } : 'null');
    return found;
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'providers') {
      // Go back to wallet settings with replace to avoid history loop
      navigate('/settings/wallets', { replace: true });
    } else if (currentStep === 'connecting') {
      setCurrentStep('providers');
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }
    } else if (currentStep === 'success') {
      // After success, go to wallet settings with replace to avoid history loop
      navigate('/settings/wallets', { replace: true });
    }
  };

  // Handle provider selection - use wagmi connectors
  const handleProviderSelect = async (provider: WalletProvider) => {
    setHandledAddress(null);
    setSelectedProvider(provider);
    setConnectionError(null);
    setCurrentStep('connecting');
    
    console.log(`🔗 Connecting ${provider.name} wallet...`);
    console.log('📋 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
    
    try {
      if (provider.id === 'other') {
        if (!openConnectModal) {
          throw new Error('No wallet connector available. Please refresh and try again.');
        }
        openConnectModal();
        return;
      }

      const connector = findConnectorForProvider(provider);
      console.log('🔌 Found connector:', connector ? { id: connector.id, name: connector.name } : 'null');
      
      if (!connector) {
        console.error(`❌ No connector found for ${provider.name}`);
        if (!openConnectModal) {
          throw new Error(`No ${provider.name} connector found. Please use another provider.`);
        }
        openConnectModal();
        return;
      }

      console.log('⏳ Attempting to connect with connector:', connector.name);
      await connectAsync({ connector });
      console.log('✅ Connect async completed');
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      console.error('Error details:', { code: error.code, message: error.message, stack: error.stack });
      
      if (error.code === 4001) {
        setConnectionError('Connection cancelled by user.');
      } else if (error.message?.includes('No wallet connector')) {
        setConnectionError('No wallet connector available. Please install a wallet extension or try WalletConnect.');
      } else if (error.message?.includes('User rejected')) {
        setConnectionError('Connection cancelled by user.');
      } else {
        setConnectionError(`Failed to connect wallet: ${error.message || 'Please try again.'}`);
      }
      
      setCurrentStep('providers');
      setSelectedProvider(null);
    }
  };

  // Handle connect errors from wagmi
  useEffect(() => {
    if (!connectError || currentStep !== 'connecting') return;

    console.error('❌ wagmi connect error:', connectError);
    setConnectionError(connectError.message || 'Failed to connect wallet. Please try again.');
    setCurrentStep('providers');
    setSelectedProvider(null);
  }, [connectError, currentStep]);

  // Handle successful connection and add wallet
  useEffect(() => {
    if (currentStep !== 'connecting' || !selectedProvider) return;
    if (!wagmiConnected || !wagmiAddress) return;

    const normalizedAddress = wagmiAddress.toLowerCase();
    if (handledAddress === normalizedAddress) return;

    setHandledAddress(normalizedAddress);

    const isAlreadyInCollection = connectedWallets.some(
      (wallet) => wallet.address.toLowerCase() === normalizedAddress
    );

    if (isAlreadyInCollection) {
      console.log('ℹ️ Wallet already in collection - returning to provider selection');

      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }

      toast.error('Wallet already added', {
        description: 'This wallet is already in your collection. Switch accounts in your wallet to add a different one.',
        duration: 5000
      });

      setConnectionError('This wallet is already in your collection. Please switch to a different account in your wallet and try again.');
      setSelectedProvider(null);
      setCurrentStep('providers');
      return;
    }

    const chainNamespace = chain?.id ? `eip155:${chain.id}` : 'eip155:1';

    const addConnectedWallet = async () => {
      try {
        console.log('🆕 New wallet detected, adding to registry...');

        await addWallet({
          address: normalizedAddress,
          label: `${selectedProvider.name} Wallet`,
          chain_namespace: chainNamespace,
        });

        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          setConnectionTimeout(null);
        }

        setConnectedAddress(normalizedAddress);
        setCurrentStep('success');

        const event = new CustomEvent('walletAdded', {
          detail: {
            address: normalizedAddress,
            provider: selectedProvider.name,
            timestamp: new Date().toISOString(),
          }
        });
        window.dispatchEvent(event);
      } catch (error: any) {
        console.error('❌ Failed to add wallet:', error);
        
        // Check if it's a duplicate wallet error (409 Conflict)
        if (error.message?.includes('409') || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          toast.error('Wallet already exists', {
            description: 'This wallet is already in your collection. Please switch to a different account in your wallet.',
            duration: 5000
          });
          setConnectionError('This wallet is already in your collection. Please switch to a different account and try again.');
        } else {
          toast.error('Failed to add wallet', {
            description: error.message || 'Please try again.',
            duration: 5000
          });
          setConnectionError(`Failed to add wallet: ${error.message || 'Please try again.'}`);
        }
        
        setCurrentStep('providers');
        setSelectedProvider(null);
      }
    };

    addConnectedWallet();
  }, [
    currentStep,
    selectedProvider,
    wagmiConnected,
    wagmiAddress,
    connectedWallets,
    addWallet,
    chain?.id,
    handledAddress,
    connectionTimeout
  ]);

  // Handle setting wallet as active
  const handleSetAsActive = () => {
    if (connectedAddress) {
      setActiveWallet(connectedAddress);
      toast.success('Wallet switched successfully');
    }
    // Navigate to wallet settings with replace to avoid history loop
    navigate('/settings/wallets', { replace: true });
  };

  // Handle keeping current wallet
  const handleKeepCurrent = () => {
    if (connectedAddress) {
      toast.success('Wallet added to your collection');
    }
    // Navigate to wallet settings with replace to avoid history loop
    navigate('/settings/wallets', { replace: true });
  };

  // Auto-dismiss success screen after 20s if no action taken
  useEffect(() => {
    if (currentStep === 'success') {
      const timer = setTimeout(() => {
        handleKeepCurrent();
      }, 20000); // Changed from 3000ms to 20000ms (20 seconds)
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-900" 
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px] px-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {currentStep === 'providers' && 'Add Wallet'}
            {currentStep === 'connecting' && 'Connecting...'}
            {currentStep === 'success' && 'Success!'}
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {/* SCREEN 1: Choose Wallet Provider */}
          {currentStep === 'providers' && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Choose Wallet Provider
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Select your wallet to connect to AlphaWhale
                </p>
                
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    <div>RainbowKit: {openConnectModal ? '✅ Available' : '❌ Not Available'}</div>
                    <div>Wagmi: {wagmiConnected ? `✅ Connected (${wagmiAddress?.slice(0, 6)}...)` : '❌ Not Connected'}</div>
                  </div>
                )}
              </div>

              {/* Connection Error */}
              {connectionError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl mb-6"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{connectionError}</p>
                </motion.div>
              )}

              <div className="space-y-3">
                {WALLET_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-[0.98] shadow-sm min-h-[64px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">
                      {provider.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {provider.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {provider.description}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {provider.helperText}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Debug Panel - Show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Debug Info:</div>
                  <div>Connected Wallets: {connectedWallets.length}</div>
                  <div>Direct Connection: ✅ Enabled</div>
                  <div>Wallet Available: {typeof window !== 'undefined' && window.ethereum ? '✅' : '❌'}</div>
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN 2: Connecting - DIRECT CONNECTION */}
          {currentStep === 'connecting' && selectedProvider && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl mb-4">
                {selectedProvider.icon}
              </div>
              
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Connecting to {selectedProvider.name}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Check your wallet for connection request
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  <p>💡 <strong>Tip:</strong> You can switch to a different account in your wallet</p>
                </div>
              </div>

              <button
                onClick={() => {
                  console.log('❌ User cancelled connection');
                  if (connectionTimeout) {
                    clearTimeout(connectionTimeout);
                    setConnectionTimeout(null);
                  }
                  setCurrentStep('providers');
                  setSelectedProvider(null);
                  setConnectionError(null);
                }}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* SCREEN 3: Success */}
          {currentStep === 'success' && selectedProvider && connectedAddress && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring',
                  damping: 15,
                  stiffness: 300,
                  delay: 0.2 
                }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Wallet Added!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedProvider.name} wallet has been added to your collection
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-6)}
                </div>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={handleSetAsActive}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-colors min-h-[44px]"
                >
                  Switch to this wallet
                </button>
                <button
                  onClick={handleKeepCurrent}
                  className="w-full py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold transition-colors min-h-[44px]"
                >
                  Keep current wallet active
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Wallet added to your collection • Auto-redirecting in 20 seconds...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
