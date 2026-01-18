/**
 * AddWalletButton Component
 * 
 * Enhanced wallet connection button that supports adding multiple accounts
 * from the same wallet provider (MetaMask, Base, Rainbow, etc.)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Plus, Wallet, ChevronDown, Eye, Zap } from 'lucide-react';
import { MultiAccountSelector } from './MultiAccountSelector';
import { ManualWalletInput } from './ManualWalletInput';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Add multiple MetaMask accounts'
  },
  {
    id: 'base',
    name: 'Base Wallet',
    icon: '🔵',
    description: 'Add multiple Base accounts'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    description: 'Add multiple Rainbow accounts'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔷',
    description: 'Add multiple Coinbase accounts'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect via WalletConnect'
  }
];

export const AddWalletButton: React.FC = () => {
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [isMultiSelectorOpen, setIsMultiSelectorOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const { connectWallet, connectedWallets } = useWallet();

  const handleWalletSelect = async (wallet: WalletProvider) => {
    if (wallet.id === 'walletconnect') {
      // Handle WalletConnect differently (single connection)
      try {
        await connectWallet();
        toast.success('Wallet connected successfully!');
      } catch (error) {
        toast.error('Failed to connect wallet');
        console.error('Wallet connection failed:', error);
      }
    } else {
      // Open multi-account selector for other wallets
      setSelectedWallet(wallet);
      setIsMultiSelectorOpen(true);
    }
  };

  const handleManualAdd = () => {
    setIsManualInputOpen(true);
  };

  const handleAccountsAdded = (addresses: string[]) => {
    const count = addresses.length;
    toast.success(
      `Successfully added ${count} ${selectedWallet?.name} account${count !== 1 ? 's' : ''}!`
    );
    setSelectedWallet(null);
  };

  const handleManualWalletAdded = (address: string) => {
    toast.success('Watch-only wallet added successfully!');
  };

  const handleSelectorClose = () => {
    setIsMultiSelectorOpen(false);
    setSelectedWallet(null);
  };

  const handleManualClose = () => {
    setIsManualInputOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-slate-900 border-slate-700"
        >
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              CONNECT & SIGN
            </div>
          </div>
          
          {WALLET_PROVIDERS.map((wallet) => (
            <DropdownMenuItem
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet)}
              className="flex items-center gap-3 p-3 text-white hover:bg-slate-800 cursor-pointer"
            >
              <span className="text-xl">{wallet.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{wallet.name}</div>
                <div className="text-xs text-slate-400">{wallet.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-slate-700" />
          
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              WATCH-ONLY
            </div>
          </div>
          
          <DropdownMenuItem
            onClick={handleManualAdd}
            className="flex items-center gap-3 p-3 text-white hover:bg-slate-800 cursor-pointer"
          >
            <span className="text-xl">👁️</span>
            <div className="flex-1">
              <div className="font-medium">Manual Address</div>
              <div className="text-xs text-slate-400">Add any wallet address to watch</div>
            </div>
          </DropdownMenuItem>
          
          {connectedWallets.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-slate-700" />
              <div className="px-3 py-2">
                <div className="text-xs text-slate-400 mb-2">
                  Connected Wallets: {connectedWallets.length}
                </div>
                {connectedWallets.slice(0, 3).map((wallet) => (
                  <div key={wallet.address} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                    <Wallet className="w-3 h-3" />
                    <span className="font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    <span className="text-slate-500">
                      {wallet.label || 'Unnamed'}
                    </span>
                  </div>
                ))}
                {connectedWallets.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{connectedWallets.length - 3} more
                  </div>
                )}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Multi-Account Selector Modal */}
      {selectedWallet && (
        <MultiAccountSelector
          isOpen={isMultiSelectorOpen}
          onClose={handleSelectorClose}
          walletName={selectedWallet.name}
          onAccountsAdded={handleAccountsAdded}
        />
      )}

      {/* Manual Wallet Input Modal */}
      <ManualWalletInput
        isOpen={isManualInputOpen}
        onClose={handleManualClose}
        onWalletAdded={handleManualWalletAdded}
      />
    </>
  );
};