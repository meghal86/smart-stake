/**
 * CustomWalletModal - Direct wallet connection without RainbowKit modal
 * 
 * This component bypasses RainbowKit's modal entirely and uses wagmi's
 * connect functions directly to avoid CSS z-index issues.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useConnect, useAccount } from 'wagmi';
import { X, Wallet, ExternalLink } from 'lucide-react';

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (address: string) => void;
}

export function CustomWalletModal({ isOpen, onClose, onSuccess }: CustomWalletModalProps) {
  const { connectors, connect, isPending, error } = useConnect();
  const { address, isConnected } = useAccount();
  const [connectingConnector, setConnectingConnector] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('CustomWalletModal opened:', {
        isConnected,
        address,
        connectorsCount: connectors.length,
        connectingConnector
      });
    }
  }, [isOpen, isConnected, address, connectors.length, connectingConnector]);

  // TEMPORARILY DISABLED: Only close modal when a NEW wallet connection happens during the connection process
  // useEffect(() => {
  //   // Only close if we were actively connecting and now have a different address
  //   if (isConnected && address && connectingConnector) {
  //     console.log('New wallet connected during connection process:', address);
  //     onSuccess?.(address);
  //     onClose();
  //     setConnectingConnector(null);
  //   }
  // }, [isConnected, address, connectingConnector, onSuccess, onClose]);

  const handleConnect = async (connector: any) => {
    try {
      setConnectingConnector(connector.id);
      console.log('Connecting to wallet:', connector.name);
      
      const result = await connect({ connector });
      console.log('Connect result:', result);
      
      // Manual success handling for now
      setTimeout(() => {
        console.log('Connection completed, closing modal manually');
        onSuccess?.(address || 'connected');
        onClose();
        setConnectingConnector(null);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnectingConnector(null);
    }
  };

  const handleClose = () => {
    console.log('CustomWalletModal closing');
    setConnectingConnector(null);
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConnectingConnector(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999998]"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Connect Wallet
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose how you want to connect
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Wallet Options */}
          <div className="p-6 space-y-3">
            {connectors.map((connector, index) => {
              const isConnecting = connectingConnector === connector.id;
              const isDisabled = isPending || isConnecting;
              // Use combination of id, name and index to ensure unique keys
              // This prevents React duplicate key warnings when multiple connectors have same id
              const uniqueKey = `${connector.id}-${connector.name}-${index}`;
              
              return (
                <button
                  key={uniqueKey}
                  onClick={() => handleConnect(connector)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg border transition-all
                    ${isDisabled 
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50' 
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer'
                    }
                  `}
                >
                  {/* Wallet Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Wallet Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {connector.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {getConnectorDescription(connector.id)}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center">
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pb-6">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error.message || 'Failed to connect wallet'}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

function getConnectorDescription(connectorId: string): string {
  const descriptions: Record<string, string> = {
    'metaMask': 'Connect using MetaMask browser extension',
    'walletConnect': 'Scan QR code with mobile wallet',
    'coinbaseWallet': 'Connect using Coinbase Wallet',
    'injected': 'Connect using browser wallet',
    'safe': 'Connect using Safe multisig wallet',
  };
  
  return descriptions[connectorId] || 'Connect using this wallet';
}