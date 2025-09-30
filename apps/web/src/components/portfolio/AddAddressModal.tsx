import { useState } from 'react';
import { X, Plus, Info, Eye, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (address: { address: string; label: string; group?: string }) => void;
}

export function AddAddressModal({ isOpen, onClose, onAdd }: AddAddressModalProps) {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim() || !label.trim()) return;
    
    setIsValidating(true);
    
    // Simulate address validation
    setTimeout(() => {
      onAdd({
        address: address.trim(),
        label: label.trim(),
        group: group.trim() || undefined
      });
      
      // Reset form
      setAddress('');
      setLabel('');
      setGroup('');
      setIsValidating(false);
      onClose();
    }, 1000);
  };

  const isValidAddress = (addr: string) => {
    return addr.length === 42 && addr.startsWith('0x') || addr.endsWith('.eth');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Add Address to Monitor</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address">Wallet Address or ENS</Label>
              <Input
                id="address"
                placeholder="0x742d35Cc... or vitalik.eth"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`mt-1 ${address && !isValidAddress(address) ? 'border-red-500' : ''}`}
                required
              />
              {address && !isValidAddress(address) && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid Ethereum address or ENS name</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="My Trading Wallet"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="group">Group (Optional)</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select or create group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Wallets</SelectItem>
                  <SelectItem value="trading">Trading Wallets</SelectItem>
                  <SelectItem value="defi">DeFi Positions</SelectItem>
                  <SelectItem value="cold">Cold Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-[#14B8A6] hover:bg-[#0F9488]"
                disabled={!address.trim() || !label.trim() || !isValidAddress(address) || isValidating}
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
          
          <div className="mt-6 space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Getting Started:</strong> Add any Ethereum address or ENS name to start monitoring
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                <Eye className="h-3 w-3 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">Portfolio Tracking</p>
                  <p className="text-muted-foreground">Monitor token holdings and portfolio value changes</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                <Shield className="h-3 w-3 mt-0.5 text-yellow-500" />
                <div>
                  <p className="font-medium">Risk Analysis</p>
                  <p className="text-muted-foreground">Get risk scores based on transaction patterns</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                <TrendingUp className="h-3 w-3 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">Whale Interactions</p>
                  <p className="text-muted-foreground">Track interactions with large holders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}