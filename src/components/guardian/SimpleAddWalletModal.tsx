'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleAddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletAdded?: (wallet: unknown) => void;
}

export function SimpleAddWalletModal({ isOpen, onClose, onWalletAdded }: SimpleAddWalletModalProps) {
  const [address, setAddress] = useState('');
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockWallet = {
      id: Date.now().toString(),
      address: address.toLowerCase(),
      alias: alias.trim() || null,
      trust_score: Math.floor(Math.random() * 40) + 60,
      risk_count: Math.floor(Math.random() * 5),
      short: `${address.slice(0, 6)}...${address.slice(-4)}`,
    };

    console.log('Wallet added:', mockWallet);
    onWalletAdded?.(mockWallet);

    setIsSubmitting(false);
    setShowSuccess(true);

    // Auto close after success animation
    setTimeout(() => {
      setShowSuccess(false);
      setAddress('');
      setAlias('');
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setAddress('');
    setAlias('');
    setShowSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md border border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#00C9A7]" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Wallet Added!</h3>
              <p className="text-gray-400">Successfully added to Guardian</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#00C9A7]" />
                  Add Wallet
                </DialogTitle>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="absolute right-4 top-4 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogHeader>

              <div className="mt-4 p-3 bg-[#00C9A7]/10 border border-[#00C9A7]/20 rounded-lg">
                <p className="text-xs text-[#00C9A7]">
                  🔒 Guardian never requests private keys — all scans are read-only
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-300">
                    Wallet Address or ENS Name
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x... or vitalik.eth"
                    className="mt-1 border-white/20 bg-black/40 text-white placeholder:text-gray-500"
                    disabled={isSubmitting}
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
                    placeholder="Trading Wallet, Cold Storage, etc."
                    className="mt-1 border-white/20 bg-black/40 text-white placeholder:text-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}