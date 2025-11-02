'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Globe,
  Smartphone,
  Shield,
  Banknote,
  Brain,
  UserPlus,
  Wallet,
  X,
  Loader2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { useAccount } from 'wagmi';
import type { GuardianWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletContext } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { resolveEns } from '@/lib/guardian/ens';
import { normalizeAddress, shortAddress } from '@/lib/guardian/address';

type WalletType = 'browser' | 'mobile' | 'hardware' | 'exchange' | 'smart' | 'social' | 'readonly';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletAdded?: (wallet: GuardianWallet) => void;
}

type FlowState = 'main' | 'success' | 'scanning';

const walletTypes = [
  { type: 'browser' as WalletType, icon: Globe, title: 'Browser Wallet', description: 'MetaMask • Coinbase • Brave' },
  { type: 'mobile' as WalletType, icon: Smartphone, title: 'Mobile Wallet', description: 'Trust • Rainbow • Phantom' },
  { type: 'hardware' as WalletType, icon: Shield, title: 'Hardware Wallet', description: 'Ledger • Trezor • GridPlus' },
  { type: 'exchange' as WalletType, icon: Banknote, title: 'Exchange Wallet', description: 'Binance • Coinbase • OKX' },
];

const advancedTypes = [
  { type: 'smart' as WalletType, icon: Brain, title: 'Smart Wallet', description: 'Safe • Argent • UniPass' },
  { type: 'social' as WalletType, icon: UserPlus, title: 'Social Wallet', description: 'Privy • Web3Auth • Coinbase' },
];

export default function AddWalletModal({ isOpen, onClose, onWalletAdded }: AddWalletModalProps) {
  const { addWallet } = useWalletContext();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

  const [flowState, setFlowState] = useState<FlowState>('main');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedWallet, setAddedWallet] = useState<GuardianWallet | null>(null);

  const resetState = useCallback(() => {
    setFlowState('main');
    setShowAdvanced(false);
    setAddressInput('');
    setAlias('');
    setIsSubmitting(false);
    setAddedWallet(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleAddWallet = useCallback(
    async (input: string, walletType: WalletType) => {
      if (!input.trim()) {
        toast({ title: 'Address Required', description: 'Please enter a wallet address or ENS name.', variant: 'destructive' });
        return;
      }

      setIsSubmitting(true);
      setFlowState('scanning');

      try {
        const wallet = await addWallet({ input, walletType, alias: alias.trim() || undefined });
        setAddedWallet(wallet);
        onWalletAdded?.(wallet);
        
        toast({ title: 'Wallet added securely! Starting first scan…' });
        setFlowState('success');
        
        setTimeout(() => handleClose(), 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not add wallet';
        if (message.toLowerCase().includes('already')) {
          toast({ title: 'Wallet already added.', variant: 'destructive' });
        } else {
          toast({ title: 'Failed to add wallet', description: message, variant: 'destructive' });
        }
        setFlowState('main');
      } finally {
        setIsSubmitting(false);
      }
    },
    [addWallet, alias, onWalletAdded, toast, handleClose],
  );

  const handleManualSubmit = useCallback(async () => {
    await handleAddWallet(addressInput, 'readonly');
  }, [handleAddWallet, addressInput]);

  const handleWalletTypeClick = useCallback(async (walletType: WalletType) => {
    if (walletType === 'exchange') {
      toast({ title: 'Coming Soon', description: 'Exchange wallet integration is coming soon.' });
      return;
    }
    if (walletType === 'browser' && isConnected && address) {
      await handleAddWallet(address, 'browser');
    } else {
      toast({ title: walletType === 'browser' ? 'Connect your wallet first' : 'Feature coming soon' });
    }
  }, [handleAddWallet, isConnected, address, toast]);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen, resetState]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 bg-black/70 text-gray-100 backdrop-blur-xl rounded-2xl p-6">
        <AnimatePresence initial={false} mode="wait">
          {flowState === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Wallet Added Successfully!</h3>
                <p className="text-gray-400">Starting security scan...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex flex-row items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg text-white">
                    <Wallet className="h-4 w-4 text-[#00C9A7]" />
                    Add Wallet
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Close add wallet modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
                🔒 Read-only scans — no private keys needed
              </div>

              {addedWallet && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[#00C9A7]/30 bg-[#00C9A7]/10 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#00F5A0]">
                      <CheckCircle2 className="h-4 w-4" />
                      Connected {addedWallet.ens_name ? addedWallet.ens_name : shortAddress(addedWallet.address)}
                    </div>
                    <div className="text-xs text-[#A5F6E6]">
                      Status: Auto-scan running • {flowState === 'scanning' ? 'Analyzing exposures' : 'Ready'}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Label htmlFor="wallet-alias" className="text-xs text-gray-200">
                        Add Alias
                      </Label>
                      <Input
                        id="wallet-alias"

                        value={alias}
                        onChange={(event) => setAlias(event.target.value)}
                        placeholder="Trading Wallet / Cold Storage"
                        className="w-full border-white/20 bg-black/40 text-white placeholder:text-gray-500"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Connect new wallet</Label>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={() => {
                        if (!openConnectModal || isSubmitting) return;

                        toast({
                          title: 'Connecting securely…',
                        });
                        openConnectModal();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] px-4 py-4 text-left text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSubmitting}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">Connect Wallet</div>
                        <div className="text-xs opacity-90">RainbowKit • MetaMask • Coinbase • Ledger</div>
                        <div className="mt-1 text-xs opacity-70">Auto-start scan once connected</div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-80" />
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-300">Wallet types</Label>
                  <button
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex items-center gap-1 text-xs text-[#A5F6E6] transition hover:text-white"
                  >
                    Advanced types
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {walletTypes.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleWalletTypeClick(item.type)}
                      disabled={isSubmitting}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <item.icon className="h-5 w-5 text-[#00C9A7]" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="text-xs text-gray-400">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {advancedTypes.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleWalletTypeClick(item.type)}
                        disabled={isSubmitting}
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        <item.icon className="h-5 w-5 text-[#00C9A7]" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          <div className="text-xs text-gray-400">{item.description}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
                <div className="h-px flex-1 bg-white/10" />
                <span>or monitor read-only</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">
                  Wallet Address
                </Label>
                <Input
                  value={addressInput}
                  onChange={(event) => setAddressInput(event.target.value)}
                  placeholder="0x... or vitalik.eth"
                  className="w-full border-white/20 bg-black/40 text-white placeholder:text-gray-500 text-sm"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={() => void handleManualSubmit()}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white hover:opacity-90 py-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Add Wallet
                    </>
                  )}
                </Button>
              </div>

              {flowState === 'scanning' && (
                <div className="flex items-center gap-2 rounded-lg border border-[#7B61FF]/40 bg-[#7B61FF]/10 px-3 py-2 text-sm text-[#C8B8FF]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardian is scanning for risks…
                </div>
              )}

              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-gray-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-[#FFD166]" />
                <div>
                  Duplicate prevention is active for 30 seconds per wallet. Guardian logs every action in{' '}
                  <span className="font-semibold text-white">guardian_logs</span>.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
