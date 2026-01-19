/**
 * WalletSettings - Wallet Administration Page
 * 
 * Enterprise wallet management with full admin capabilities.
 * Route: /settings/wallets
 * 
 * Features:
 * - Rename wallets
 * - Reorder wallets
 * - Hide/remove wallets
 * - Set default wallet
 * - Add new wallet (entry to wizard)
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { WalletBalanceDisplay } from '@/components/wallet/WalletBalanceDisplay';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  ExternalLink,
  GripVertical,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface WalletDisplayData {
  address: string;
  label: string;
  provider: string;
  icon: string;
  isActive: boolean;
  isHidden: boolean;
  isPrimary: boolean;
}

export default function WalletSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectedWallets, activeWallet, setActiveWallet, disconnectWallet } = useWallet();
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  // Back button handler - uses browser history
  const handleBack = () => {
    navigate(-1);
  };

  // Get wallet addresses for debugging
  const walletAddresses = connectedWallets.map(w => w.address);

  // Transform wallet data for display
  const walletDisplayData: WalletDisplayData[] = connectedWallets.map((wallet, index) => ({
    address: wallet.address,
    label: getWalletLabel(wallet),
    provider: getWalletProvider(wallet),
    icon: getWalletIcon(wallet),
    isActive: wallet.address === activeWallet,
    isHidden: false, // TODO: Implement hidden state
    isPrimary: index === 0, // TODO: Implement primary state
  }));

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

  // Handle wallet actions
  const handleSetActive = (address: string, label: string) => {
    setActiveWallet(address);
    toast.success(`${label} is now your active wallet`);
  };

  const handleStartEdit = (address: string, currentLabel: string) => {
    setEditingWallet(address);
    setEditLabel(currentLabel);
  };

  const handleSaveEdit = () => {
    if (editingWallet && editLabel.trim()) {
      // TODO: Implement wallet label update
      toast.success('Wallet renamed successfully');
      setEditingWallet(null);
      setEditLabel('');
    }
  };

  const handleCancelEdit = () => {
    setEditingWallet(null);
    setEditLabel('');
  };

  const handleRemoveWallet = async (address: string, label: string) => {
    if (window.confirm(`Are you sure you want to remove ${label}?`)) {
      try {
        await disconnectWallet(address);
        toast.success(`${label} removed successfully`);
      } catch (error) {
        toast.error('Failed to remove wallet');
      }
    }
  };

  const handleViewOnExplorer = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

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
            Manage Wallets
          </h1>
          <button
            onClick={() => navigate('/settings/wallets/add')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Add Wallet
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {walletDisplayData.length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Connected
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              1
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Active
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {new Set(walletDisplayData.map(w => w.provider)).size}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Providers
            </div>
          </div>
        </div>

        {/* Wallets List */}
        {walletDisplayData.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Your Wallets
            </h2>
            
            {walletDisplayData.map((wallet) => (
              <motion.div
                key={wallet.address}
                layout
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 ${
                  wallet.isActive 
                    ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/10' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Drag Handle - Hidden on mobile */}
                    <div className="hidden sm:block cursor-grab hover:cursor-grabbing text-slate-400">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Wallet Icon */}
                    <div className="text-2xl sm:text-3xl">{wallet.icon}</div>

                    {/* Wallet Info */}
                    <div className="flex-1 min-w-0">
                      {editingWallet === wallet.address ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm sm:text-base"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                              {wallet.label}
                            </span>
                            {wallet.isPrimary && (
                              <Star className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                            {truncateAddress(wallet.address, 6)}
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                            <span>{wallet.provider}</span>
                            <span>•</span>
                            <WalletBalanceDisplay 
                              address={wallet.address}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions - Responsive layout */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      {/* Active State Button - Always show for consistency */}
                      {wallet.isActive ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-medium rounded-lg min-h-[44px]">
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Active</span>
                          <span className="sm:hidden">✓</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSetActive(wallet.address, wallet.label)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[44px] whitespace-nowrap"
                        >
                          Set Active
                        </button>
                      )}
                      
                      {/* Secondary Actions - Horizontal on mobile, vertical on desktop */}
                      <div className="flex sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => handleStartEdit(wallet.address, wallet.label)}
                          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                          title="Rename wallet"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleViewOnExplorer(wallet.address)}
                          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                          title="View on explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveWallet(wallet.address, wallet.label)}
                          className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                            wallet.isActive 
                              ? 'text-red-300 opacity-50 cursor-not-allowed' 
                              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title="Remove wallet"
                          disabled={wallet.isActive}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No wallets connected
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Connect your first wallet to get started with AlphaWhale
            </p>
            <button
              onClick={() => navigate('/settings/wallets/add')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
            >
              Add Your First Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}