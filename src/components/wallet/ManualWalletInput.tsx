/**
 * ManualWalletInput Component
 * 
 * Allows users to manually add wallet addresses for watch-only monitoring
 * Supports ENS names, Lens handles, and direct addresses
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, X, Eye, AlertCircle } from 'lucide-react';
import { useWalletRegistry } from '@/hooks/useWalletRegistry';
import { toast } from 'sonner';

interface ManualWalletInputProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletAdded: (address: string) => void;
}

const CHAIN_OPTIONS = [
  { value: 'eip155:1', label: 'Ethereum Mainnet' },
  { value: 'eip155:137', label: 'Polygon' },
  { value: 'eip155:42161', label: 'Arbitrum' },
  { value: 'eip155:8453', label: 'Base' },
  { value: 'eip155:10', label: 'Optimism' },
];

export const ManualWalletInput: React.FC<ManualWalletInputProps> = ({
  isOpen,
  onClose,
  onWalletAdded,
}) => {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [chainNamespace, setChainNamespace] = useState('eip155:1');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const { addWallet } = useWalletRegistry();

  const validateAddress = (input: string): boolean => {
    // Reset error
    setError('');
    
    if (!input) {
      setError('Address is required');
      return false;
    }

    // Check if it's a valid Ethereum address (0x + 40 hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
      return true;
    }

    // Check if it's an ENS name (ends with .eth)
    if (input.endsWith('.eth') && input.length > 4) {
      return true;
    }

    // Check if it's a Lens handle (ends with .lens)
    if (input.endsWith('.lens') && input.length > 5) {
      return true;
    }

    // Check if it's an Unstoppable Domain
    const unstoppableTlds = ['.crypto', '.nft', '.blockchain', '.bitcoin', '.coin', '.wallet', '.888', '.dao', '.x'];
    if (unstoppableTlds.some(tld => input.endsWith(tld))) {
      return true;
    }

    setError('Invalid address format. Use 0x address, ENS name (.eth), or Lens handle (.lens)');
    return false;
  };

  const handleAddWallet = async () => {
    if (!validateAddress(address)) {
      return;
    }

    setIsAdding(true);
    try {
      // If it's not a direct address, we'll need to resolve it
      const resolvedAddress = address;
      
      if (!address.startsWith('0x')) {
        // For ENS/Lens resolution, we'd normally use a resolver here
        // For now, we'll show an error asking for the resolved address
        setError('Please enter the resolved 0x address. ENS/Lens resolution coming soon.');
        return;
      }

      await addWallet({
        address: resolvedAddress,
        label: label || `Watch-only Wallet`,
        chain_namespace: chainNamespace,
      });

      toast.success('Watch-only wallet added successfully!');
      onWalletAdded(resolvedAddress);
      onClose();
      
      // Reset form
      setAddress('');
      setLabel('');
      setChainNamespace('eip155:1');
    } catch (error: any) {
      console.error('Failed to add wallet:', error);
      
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        toast.error('This wallet is already in your registry');
      } else {
        toast.error('Failed to add wallet. Please try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value) {
      validateAddress(value);
    } else {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Add Watch-Only Wallet
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
          <div className="space-y-2">
            <Label htmlFor="address" className="text-white">
              Wallet Address or ENS Name
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="0x... or name.eth or name.lens"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label" className="text-white">
              Label (Optional)
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My DeFi Wallet, Trading Account, etc."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chain" className="text-white">
              Primary Chain
            </Label>
            <Select value={chainNamespace} onValueChange={setChainNamespace}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {CHAIN_OPTIONS.map((chain) => (
                  <SelectItem 
                    key={chain.value} 
                    value={chain.value}
                    className="text-white hover:bg-slate-700"
                  >
                    {chain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-cyan-400 mb-1">Watch-Only Mode</p>
                <p>This wallet will be added for monitoring only. You won't be able to sign transactions with it.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWallet}
              disabled={!address || !!error || isAdding}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wallet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};