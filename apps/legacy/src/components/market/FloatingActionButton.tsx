import { useState } from 'react';
import { Plus, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';

interface FloatingActionButtonProps {
  visible: boolean;
  onWalletAdded?: (wallet: { address: string; chain: string; label?: string }) => void;
}

export function FloatingActionButton({ visible, onWalletAdded }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateAddress = (addr: string, selectedChain: string) => {
    if (!addr) return false;
    
    switch (selectedChain) {
      case 'ethereum':
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(addr);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
      default:
        return addr.length > 20;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddress(address, chain)) {
      toast({
        title: 'Invalid Address',
        description: `Please enter a valid ${chain} address`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onWalletAdded?.({
        address,
        chain,
        label: label || undefined
      });

      toast({
        title: 'Wallet Added',
        description: `Successfully added ${chain} wallet to portfolio`,
      });

      // Reset form
      setAddress('');
      setChain('ethereum');
      setLabel('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add wallet. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Add wallet to portfolio"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Add Wallet to Portfolio
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chain">Blockchain</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder={`Enter ${chain} address...`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                placeholder="e.g., Main Wallet, Trading Account..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !address}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add Wallet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}