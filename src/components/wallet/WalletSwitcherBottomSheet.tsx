/**
 * WalletSwitcherBottomSheet - Enterprise Wallet Context Switcher
 * 
 * iOS-style bottom sheet for switching between connected wallets.
 * STRICT: Only context switching - NO add wallet, settings, or admin actions.
 * 
 * UX Principles:
 * - Fast switching between existing wallets
 * - Maximum 60-65% screen height
 * - Swipe down or tap backdrop to dismiss
 * - Auto-dismiss after wallet switch
 * - Show maximum 3 wallets (others via "Manage wallets")
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Settings } from 'lucide-react';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WalletSwitcherBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletDisplayData {
  address: string;
  label: string;
  provider: string;
  icon: string;
  balance: string;
  isActive: boolean;
}

export const WalletSwitcherBottomSheet: React.FC<WalletSwitcherBottomSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { connectedWallets, activeWallet, setActiveWallet } = useWallet();
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Transform wallet data for display
  const walletDisplayData: WalletDisplayData[] = connectedWallets.map(wallet => ({
    address: wallet.address,
    label: getWalletLabel(wallet),
    provider: getWalletProvider(wallet),
    icon: getWalletIcon(wallet),
    balance: getWalletBalance(wallet.address),
    isActive: wallet.address === activeWallet,
  }));

  // Separate active and inactive wallets
  const activeWalletData = walletDisplayData.find(w => w.isActive);
  const inactiveWallets = walletDisplayData.filter(w => !w.isActive);
  
  // Show max 3 wallets (active + 2 inactive)
  const displayWallets = inactiveWallets.slice(0, 2);
  const hasMoreWallets = inactiveWallets.length > 2;

  // Handle wallet switch
  const handleWalletSwitch = (address: string, walletLabel: string) => {
    if (address === activeWallet) {
      onClose();
      return;
    }
    
    setActiveWallet(address);
    
    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Success toast
    toast.success(`Now using ${walletLabel}`);
    
    // Auto-dismiss after switch
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Navigate to manage wallets (admin flow)
  const handleManageWallets = () => {
    onClose();
    navigate('/settings/wallets');
  };

  // Handle swipe down to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!sheetRef.current?.contains(e.target as Node)) return;
      
      const startY = e.touches[0].clientY;
      
      const handleTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        // If swiping down more than 50px, close sheet
        if (deltaY > 50) {
          onClose();
          document.removeEventListener('touchmove', handleTouchMove);
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', () => {
        document.removeEventListener('touchmove', handleTouchMove);
      }, { once: true });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isOpen, onClose]);

  // Helper functions
  function getWalletLabel(wallet: any): string {
    if (wallet.label && wallet.label !== 'Connected Wallet') {
      return wallet.label;
    }
    const provider = getWalletProvider(wallet);
    return `${provider} Account`;
  }

  function getWalletProvider(wallet: any): string {
    if (wallet.label?.toLowerCase().includes('metamask')) return 'MetaMask';
    if (wallet.label?.toLowerCase().includes('rainbow')) return 'Rainbow';
    if (wallet.label?.toLowerCase().includes('base')) return 'Base';
    if (wallet.label?.toLowerCase().includes('coinbase')) return 'Coinbase';
    return 'MetaMask';
  }

  function getWalletIcon(wallet: any): string {
    const provider = getWalletProvider(wallet);
    const iconMap: Record<string, string> = {
      'MetaMask': '🦊',
      'Rainbow': '🌈',
      'Base': '🔵',
      'Coinbase': '💙',
    };
    return iconMap[provider] || '💼';
  }

  function getWalletBalance(address: string): string {
    // Mock balances - replace with real balance fetching
    const mockBalances: Record<string, string> = {
      '0x379c186a7582706388d20cd4258bfd5f9d7d72e3': '$2,547.82',
      '0xfe74dd4c1433c': '$843.20',
      '0xd65fe4868c2': '$156.45',
    };
    return mockBalances[address] || '$0.00';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[9998]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: 0.3,
            }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-slate-900 shadow-2xl"
            style={{
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              paddingBottom: 'env(safe-area-inset-bottom)',
              maxHeight: '65vh',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Switch Wallet
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Active Wallet */}
              {activeWalletData && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Active Wallet
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl border border-teal-200 dark:border-teal-800">
                    <div className="text-2xl">{activeWalletData.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {activeWalletData.label}
                        </span>
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {truncateAddress(activeWalletData.address, 6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-slate-900 dark:text-white">
                        {activeWalletData.balance}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Wallets */}
              {displayWallets.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Recent Wallets
                  </div>
                  <div className="space-y-2">
                    {displayWallets.map((wallet) => (
                      <button
                        key={wallet.address}
                        onClick={() => handleWalletSwitch(wallet.address, wallet.label)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] min-h-[56px]"
                      >
                        <div className="text-2xl">{wallet.icon}</div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {wallet.label}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                            {truncateAddress(wallet.address, 6)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {wallet.balance}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manage Wallets Link */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleManageWallets}
                  className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Manage wallets {hasMoreWallets && `(+${inactiveWallets.length - 2} more)`}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};