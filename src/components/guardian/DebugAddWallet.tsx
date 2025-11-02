'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, X } from 'lucide-react';

export function DebugAddWallet() {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [alias, setAlias] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding wallet:', { address, alias });
    alert(`Would add wallet: ${address} with alias: ${alias}`);
    setIsOpen(false);
    setAddress('');
    setAlias('');
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] hover:opacity-90"
      >
        <Plus className="w-4 h-4 mr-2" />
        <Wallet className="w-4 h-4 mr-2" />
        Debug Add Wallet
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md border border-white/10 bg-black/90 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#00C9A7]" />
              Add Wallet (Debug)
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-300">
                Wallet Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or ENS name"
                className="mt-1 border-white/20 bg-black/40 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="alias" className="text-sm font-medium text-gray-300">
                Alias (Optional)
              </Label>
              <Input
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="My Trading Wallet"
                className="mt-1 border-white/20 bg-black/40 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] hover:opacity-90"
              >
                Add Wallet
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              🔧 Debug Mode: This will only log to console and show an alert
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}