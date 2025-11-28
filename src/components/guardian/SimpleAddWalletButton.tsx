'use client';

import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddWalletModal from '@/components/guardian/AddWalletModal';

interface SimpleAddWalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function SimpleAddWalletButton({ 
  className = '', 
  variant = 'default',
  size = 'default'
}: SimpleAddWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    console.log('Opening add wallet modal...');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Closing add wallet modal...');
    setIsModalOpen(false);
  };

  const handleWalletAdded = (wallet: unknown) => {
    console.log('Wallet added:', wallet);
    // Modal will close automatically after success animation
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        className={`${className} flex items-center gap-2`}
      >
        <Plus className="h-4 w-4" />
        <Wallet className="h-4 w-4" />
        Add Wallet
      </Button>

      <AddWalletModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onWalletAdded={handleWalletAdded}
      />
    </>
  );
}