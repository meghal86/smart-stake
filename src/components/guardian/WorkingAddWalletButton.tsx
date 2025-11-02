'use client';

import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleAddWalletModal } from '@/components/guardian/SimpleAddWalletModal';

interface WorkingAddWalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  onWalletAdded?: (wallet: any) => void;
}

export function WorkingAddWalletButton({ 
  className = '', 
  variant = 'default',
  size = 'default',
  onWalletAdded
}: WorkingAddWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    console.log('Opening working add wallet modal...');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Closing working add wallet modal...');
    setIsModalOpen(false);
  };

  const handleWalletAdded = (wallet: any) => {
    console.log('Wallet added successfully:', wallet);
    onWalletAdded?.(wallet);
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

      <SimpleAddWalletModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onWalletAdded={handleWalletAdded}
      />
    </>
  );
}