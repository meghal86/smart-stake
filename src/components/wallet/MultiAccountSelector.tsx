/**
 * MultiAccountSelector Component
 * 
 * Allows users to select and add multiple accounts from the same wallet provider
 * (e.g., multiple MetaMask accounts, multiple Base accounts, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Check, X } from 'lucide-react';
import { useWalletRegistry } from '@/hooks/useWalletRegistry';
import { truncateAddress } from '@/contexts/WalletContext';

interface Account {
  address: string;
  balance?: string;
  isAlreadyAdded: boolean;
}

interface MultiAccountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string; // 'MetaMask', 'Base', 'Rainbow', etc.
  onAccountsAdded: (addresses: string[]) => void;
}

export const MultiAccountSelector: React.FC<MultiAccountSelectorProps> = ({
  isOpen,
  onClose,
  walletName,
  onAccountsAdded,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { wallets, addWallet } = useWalletRegistry();

  // Fetch all accounts from the wallet
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum wallet detected');
      }

      console.log('🦊 Starting MetaMask-specific account discovery...');
      console.log('Wallet name:', walletName);
      
      let accounts: string[] = [];

      // Special handling for MetaMask
      if (walletName.toLowerCase().includes('metamask')) {
        console.log('🦊 Detected MetaMask - using MetaMask-specific flow');
        
        // MetaMask-specific approach
        try {
          // Step 1: Force disconnect and reconnect to get fresh permissions
          console.log('Step 1: Requesting fresh MetaMask connection...');
          
          // Clear any cached permissions and request fresh connection
          const freshAccounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          }) as string[];
          
          console.log('Fresh MetaMask connection returned:', freshAccounts);
          accounts = freshAccounts;
          
          // Step 2: If only 1 account, try to force account selection dialog
          if (accounts.length === 1) {
            console.log('Only 1 account returned, trying to force account selection...');
            
            try {
              // This should force MetaMask to show account selection
              await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
              });
              
              // Get accounts again after permission request
              const newAccounts = await window.ethereum.request({
                method: 'eth_accounts'
              }) as string[];
              
              console.log('After permission request:', newAccounts);
              
              if (newAccounts.length > accounts.length) {
                accounts = newAccounts;
              }
            } catch (permError: any) {
              console.log('Permission request failed (this is normal):', permError?.message || 'Unknown error');
            }
          }
          
          // Step 3: MetaMask nuclear option - try to detect if user has multiple accounts
          if (accounts.length === 1) {
            console.log('🚨 MetaMask nuclear option: Checking if user has multiple accounts...');
            
            // Check if MetaMask has multiple accounts by looking at the provider
            const ethereum = window.ethereum as any;
            if (ethereum?.selectedAddress && ethereum?.isMetaMask) {
              console.log('MetaMask detected with selectedAddress:', ethereum.selectedAddress);
              
              // Show instructions for manual connection
              console.log('💡 MetaMask only sharing 1 account. User needs to manually connect others.');
            }
          }
          
        } catch (metamaskError) {
          console.error('MetaMask-specific flow failed:', metamaskError);
          throw metamaskError;
        }
        
      } else {
        console.log('🌈 Non-MetaMask wallet - using standard flow');
        
        // Standard flow for other wallets (like Rainbow)
        try {
          accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          }) as string[];
          console.log('Standard flow returned:', accounts);
        } catch (error) {
          console.error('Standard flow failed:', error);
          throw error;
        }
      }

      console.log('🎯 Final accounts discovered:', accounts);

      if (accounts.length === 0) {
        throw new Error('No accounts found. Make sure your wallet is unlocked.');
      }

      // Get balances for each account
      const accountsWithData: Account[] = await Promise.all(
        accounts.map(async (address, index) => {
          const isAlreadyAdded = wallets.some(
            w => w.address.toLowerCase() === address.toLowerCase()
          );

          console.log(`Processing account ${index + 1}: ${address}, already added: ${isAlreadyAdded}`);

          // Fetch balance
          try {
            const balance = await (window.ethereum as any).request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            }) as string;
            
            // Convert from wei to ETH (simplified)
            const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
            
            return {
              address,
              balance: `${balanceInEth} ETH`,
              isAlreadyAdded,
            };
          } catch (balanceError) {
            console.warn('Failed to fetch balance for', address, balanceError);
            return {
              address,
              balance: 'Unknown',
              isAlreadyAdded,
            };
          }
        })
      );

      console.log('✅ Final accounts with data:', accountsWithData);

      setAccounts(accountsWithData);
      
      // Pre-select accounts that aren't already added
      const newAccounts = accountsWithData
        .filter(acc => !acc.isAlreadyAdded)
        .map(acc => acc.address);
      setSelectedAccounts(new Set(newAccounts));

      console.log(`🎉 SUCCESS: Found ${accountsWithData.length} total accounts, ${newAccounts.length} are new and available to add`);

      // Special logging for MetaMask issues
      if (walletName.toLowerCase().includes('metamask') && accountsWithData.length === 1) {
        console.log('🔍 MetaMask DEBUG INFO:');
        console.log('- MetaMask is only sharing 1 account with this dApp');
        console.log('- You have 3 accounts in MetaMask but only 1 is connected to this site');
        console.log('- Solution: Switch to Account 2 in MetaMask, then try "Add Wallet" → "MetaMask" again');
        console.log('- Each account needs to be manually connected to this dApp');
      }

    } catch (error) {
      console.error('❌ Account fetching failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccount = (address: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(address)) {
      newSelected.delete(address);
    } else {
      newSelected.add(address);
    }
    setSelectedAccounts(newSelected);
  };

  const addSelectedAccounts = async () => {
    if (selectedAccounts.size === 0) return;

    setIsAdding(true);
    try {
      const accountsToAdd = Array.from(selectedAccounts);
      
      // Add each selected account
      for (let i = 0; i < accountsToAdd.length; i++) {
        const address = accountsToAdd[i];
        const accountIndex = accounts.findIndex(acc => acc.address === address);
        
        await addWallet({
          address,
          label: `${walletName} Account ${accountIndex + 1}`,
          chain_namespace: 'eip155:1', // Default to Ethereum
        });
      }

      onAccountsAdded(accountsToAdd);
      onClose();
    } catch (error) {
      console.error('Failed to add accounts:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Add {walletName} Accounts
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading accounts...</p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm">
                Select the {walletName} accounts you want to add:
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {accounts.map((account, index) => (
                  <div
                    key={account.address}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border
                      ${account.isAlreadyAdded 
                        ? 'bg-slate-800/50 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAccounts.has(account.address)}
                        onCheckedChange={() => toggleAccount(account.address)}
                        disabled={account.isAlreadyAdded}
                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div>
                        <div className="text-white font-mono text-sm">
                          {truncateAddress(account.address, 6)}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {walletName} Account {index + 1}
                        </div>
                        {account.balance && (
                          <div className="text-slate-500 text-xs">
                            {account.balance}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {account.isAlreadyAdded && (
                      <Badge variant="secondary" className="bg-green-900/20 text-green-400 border-green-700">
                        <Check className="w-3 h-3 mr-1" />
                        Added
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              
              {accounts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400">No accounts found</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Make sure your wallet is unlocked and has accounts
                  </p>
                </div>
              )}
              
              {accounts.length === 1 && accounts[0].isAlreadyAdded && (
                <div className="text-center py-4 space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm font-medium mb-2">
                      🔒 MetaMask is only sharing 1 account with this app
                    </p>
                    <p className="text-yellow-300 text-xs mb-3">
                      Even though you have 3 accounts in MetaMask, this app only has permission to see 1 account.
                    </p>
                    
                    <div className="bg-slate-800/50 p-3 rounded-lg text-left mb-3">
                      <p className="text-slate-300 text-sm font-medium mb-2">📋 Manual Solution:</p>
                      <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
                        <li><strong>Switch to Account 2</strong> in MetaMask extension</li>
                        <li><strong>Close this modal</strong> and click "Add Wallet" → "MetaMask" again</li>
                        <li><strong>Approve the connection</strong> for Account 2</li>
                        <li><strong>Repeat for Account 3</strong></li>
                      </ol>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('Manual refresh requested');
                          fetchAccounts();
                        }}
                        className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                      >
                        🔄 Try Again
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors"
                      >
                        ✋ I'll Connect Manually
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {accounts.length > 0 && accounts.every(acc => acc.isAlreadyAdded) && accounts.length > 1 && (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">
                    All {accounts.length} accounts are already added to your wallet registry.
                  </p>
                  <button
                    onClick={() => {
                      console.log('Manual refresh requested');
                      fetchAccounts();
                    }}
                    className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    🔄 Refresh Accounts
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addSelectedAccounts}
                  disabled={selectedAccounts.size === 0 || isAdding}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add {selectedAccounts.size} Account{selectedAccounts.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};