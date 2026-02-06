import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WalletSwitcherBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletSwitcherBottomSheet: React.FC<WalletSwitcherBottomSheetProps> = ({ isOpen, onClose }) => {
  const { connectedWallets, activeWallet, setActiveWallet } = useWallet();
  const navigate = useNavigate();

  const handleWalletSwitch = (address: string, walletLabel: string) => {
    if (address === activeWallet) {
      onClose();
      return;
    }
    
    setActiveWallet(address);
    toast.success(`Switched to ${walletLabel}`);
    setTimeout(() => onClose(), 300);
  };

  const handleAddAccount = () => {
    onClose();
    navigate('/settings/wallets/add');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900 shadow-2xl z-[99999] rounded-t-2xl"
            style={{ maxHeight: '75vh', minHeight: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Select Account</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {connectedWallets.length > 0 ? (
                <div className="space-y-3">
                  {connectedWallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      className={`rounded-2xl p-5 cursor-pointer transition-all ${
                        wallet.address === activeWallet
                          ? 'bg-slate-800 border-2 border-blue-500'
                          : 'bg-slate-800/60 border-2 border-slate-700 hover:bg-slate-800'
                      }`}
                      onClick={() => handleWalletSwitch(wallet.address, wallet.label || 'Wallet')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            wallet.address === activeWallet ? 'bg-blue-600' : 'bg-slate-700'
                          }`}>
                            🦊
                          </div>
                          <div>
                            <h3 className={`font-semibold text-lg ${
                              wallet.address === activeWallet ? 'text-blue-400' : 'text-white'
                            }`}>
                              {wallet.label || 'Connected Wallet'}
                            </h3>
                            <p className="text-sm text-slate-400 font-mono">
                              {truncateAddress(wallet.address, 6)}
                            </p>
                          </div>
                        </div>
                        {wallet.address === activeWallet && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No accounts available</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-700">
              <button
                onClick={handleAddAccount}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                style={{ minHeight: '56px' }}
              >
                <Plus className="w-5 h-5" />
                Add account
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WalletSwitcherBottomSheet;