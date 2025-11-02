'use client';

import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddWalletModal from '@/components/guardian/AddWalletModal';

export function FixedAddWalletButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] hover:opacity-90"
      >
        <Plus className="w-4 h-4 mr-2" />
        <Wallet className="w-4 h-4 mr-2" />
        Add Wallet
      </Button>

      <AddWalletModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onWalletAdded={(wallet) => {
          console.log('Wallet added:', wallet);
          setIsOpen(false);
        }}
      />
    </>
  );
}