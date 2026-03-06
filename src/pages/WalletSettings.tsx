import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Edit3,
  ExternalLink,
  GripVertical,
  Plus,
  Star,
  Trash2,
  Wallet2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { WalletBalanceDisplay } from '@/components/wallet/WalletBalanceDisplay';
import { Button } from '@/components/ui/button';

interface WalletDisplayData {
  address: string;
  label: string;
  provider: string;
  icon: string;
  isActive: boolean;
  isPrimary: boolean;
}

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function WalletSettings() {
  const navigate = useNavigate();
  const { connectedWallets, activeWallet, setActiveWallet, disconnectWallet } = useWallet();
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const walletDisplayData: WalletDisplayData[] = connectedWallets.map((wallet, index) => ({
    address: wallet.address,
    label: getWalletLabel(wallet),
    provider: getWalletProvider(wallet),
    icon: getWalletIcon(wallet),
    isActive: wallet.address === activeWallet,
    isPrimary: index === 0,
  }));

  const activeWalletData = walletDisplayData.find((wallet) => wallet.isActive) ?? walletDisplayData[0] ?? null;
  const providerCount = new Set(walletDisplayData.map((wallet) => wallet.provider)).size;

  function getWalletLabel(wallet: { label?: string }) {
    if (wallet.label && wallet.label !== 'Connected Wallet') {
      return wallet.label;
    }

    const provider = getWalletProvider(wallet);
    return `${provider} Account`;
  }

  function getWalletProvider(wallet: { label?: string }) {
    const label = wallet.label?.toLowerCase() ?? '';
    if (label.includes('metamask')) return 'MetaMask';
    if (label.includes('rainbow')) return 'Rainbow';
    if (label.includes('base')) return 'Base';
    if (label.includes('coinbase')) return 'Coinbase';
    return 'Wallet';
  }

  function getWalletIcon(wallet: { label?: string }) {
    const provider = getWalletProvider(wallet);
    const iconMap: Record<string, string> = {
      MetaMask: '🦊',
      Rainbow: '🌈',
      Base: '🔵',
      Coinbase: '💙',
      Wallet: '◌',
    };
    return iconMap[provider] ?? '◌';
  }

  const handleSetActive = (address: string, label: string) => {
    setActiveWallet(address);
    toast.success(`${label} is now your active wallet`);
  };

  const handleStartEdit = (address: string, currentLabel: string) => {
    setEditingWallet(address);
    setEditLabel(currentLabel);
  };

  const handleSaveEdit = () => {
    if (!editingWallet || !editLabel.trim()) return;

    toast.success('Wallet renamed successfully');
    setEditingWallet(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingWallet(null);
    setEditLabel('');
  };

  const handleRemoveWallet = async (address: string, label: string) => {
    if (!window.confirm(`Are you sure you want to remove ${label}?`)) return;

    try {
      await disconnectWallet(address);
      toast.success(`${label} removed successfully`);
    } catch {
      toast.error('Failed to remove wallet');
    }
  };

  const handleViewOnExplorer = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f6f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_35%)]" />
      <GlobalHeader className="border-white/8 bg-[#050505]/94" />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[28px] border border-white/8 bg-[#0b0b0c] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
              <div className="mb-6 px-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Settings</p>
                <p
                  className="mt-3 text-[28px] leading-none text-[#f6f2ea]"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  Wallets
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Primary wallet</p>
                  <p className="mt-3 text-lg text-[#f6f2ea]">{activeWalletData?.label ?? 'No active wallet'}</p>
                  <p className="mt-2 text-sm text-[#9c978f]">
                    {activeWalletData ? truncateAddress(activeWalletData.address, 6) : 'Connect a wallet to begin.'}
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#b7c8f0]">Control</p>
                  <p
                    className="mt-3 text-2xl text-[#f6f2ea]"
                    style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                  >
                    Keep your roster clean.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#b8b2a7]">
                    Set the default wallet, rename connected accounts, and remove anything you no longer want in the app.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
                  <Wallet2 className="h-3.5 w-3.5" />
                  Wallet administration
                </div>
                <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">Manage Wallets</h1>
                <p className="mt-2 max-w-3xl text-sm text-[#9c978f] sm:text-base">
                  Review every connected wallet, choose which account drives the app, and keep your setup organized.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => navigate('/settings/wallets/add')}
                  className="rounded-full bg-[#f6f2ea] px-5 text-black hover:bg-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add wallet
                </Button>
              </div>
            </div>

            <section className="mb-6 grid gap-4 md:grid-cols-3">
              <div className={`${surfaceClass} p-5`}>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Connected</p>
                <p className="mt-4 text-4xl text-[#f6f2ea]">{walletDisplayData.length}</p>
                <p className="mt-2 text-sm text-[#9c978f]">Wallets currently available across the app.</p>
              </div>
              <div className={`${surfaceClass} p-5`}>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Active</p>
                <p className="mt-4 text-4xl text-[#f6f2ea]">{activeWalletData ? 1 : 0}</p>
                <p className="mt-2 text-sm text-[#9c978f]">
                  {activeWalletData ? `${activeWalletData.label} is the current wallet.` : 'No wallet selected yet.'}
                </p>
              </div>
              <div className={`${surfaceClass} p-5`}>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Providers</p>
                <p className="mt-4 text-4xl text-[#f6f2ea]">{providerCount}</p>
                <p className="mt-2 text-sm text-[#9c978f]">Distinct connection sources in your wallet roster.</p>
              </div>
            </section>

            {walletDisplayData.length > 0 ? (
              <section className={`${surfaceClass} overflow-hidden`}>
                <div className="border-b border-white/8 px-6 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Wallet roster</p>
                </div>

                <div className="divide-y divide-white/8">
                  {walletDisplayData.map((wallet) => (
                    <motion.div key={wallet.address} layout className="px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div className="hidden text-[#5e5a53] xl:block">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-2xl">
                            {wallet.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            {editingWallet === wallet.address ? (
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                  type="text"
                                  value={editLabel}
                                  onChange={(event) => setEditLabel(event.target.value)}
                                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#f6f2ea] outline-none placeholder:text-[#8f8a82] focus:border-[#7ea3f2]/40 sm:max-w-sm"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 transition-colors hover:bg-emerald-400/20"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#9c978f] transition-colors hover:bg-white/[0.08] hover:text-[#f6f2ea]"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg text-[#f6f2ea]">{wallet.label}</p>
                                  {wallet.isPrimary ? <Star className="h-4 w-4 text-[#d9b86a]" /> : null}
                                  {wallet.isActive ? (
                                    <span className="rounded-full border border-[#7ea3f2]/30 bg-[#7ea3f2]/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#c7d7ff]">
                                      Active
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-1 break-all text-sm text-[#9c978f]">{truncateAddress(wallet.address, 6)}</p>
                                <div className="mt-3 flex flex-col gap-2 text-sm text-[#b8b2a7] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                  <span>{wallet.provider}</span>
                                  <span className="hidden text-[#5e5a53] sm:inline">•</span>
                                  <WalletBalanceDisplay address={wallet.address} className="text-sm text-[#b8b2a7]" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {editingWallet !== wallet.address ? (
                          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:items-center xl:justify-end">
                            {wallet.isActive ? (
                              <div className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[#7ea3f2]/24 bg-[#7ea3f2]/12 px-4 text-sm text-[#d2defd]">
                                <Check className="h-4 w-4" />
                                Active wallet
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSetActive(wallet.address, wallet.label)}
                                className="min-h-[44px] rounded-2xl bg-[#f6f2ea] px-4 text-sm font-medium text-black transition-colors hover:bg-white"
                              >
                                Set active
                              </button>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleStartEdit(wallet.address, wallet.label)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#9c978f] transition-colors hover:bg-white/[0.08] hover:text-[#f6f2ea]"
                                title="Rename wallet"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleViewOnExplorer(wallet.address)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#9c978f] transition-colors hover:bg-white/[0.08] hover:text-[#f6f2ea]"
                                title="View on explorer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveWallet(wallet.address, wallet.label)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-red-400/14 bg-red-400/[0.03] text-red-200 transition-colors hover:bg-red-400/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                                title="Remove wallet"
                                disabled={wallet.isActive}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : (
              <section className={`${surfaceClass} px-6 py-16 text-center`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/8 bg-white/[0.03]">
                  <Plus className="h-7 w-7 text-[#8f8a82]" />
                </div>
                <h2
                  className="mt-6 text-3xl text-[#f6f2ea]"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  No wallets connected
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#9c978f]">
                  Connect your first wallet to unlock portfolio totals, Guardian scans, and the shared app experience.
                </p>
                <Button
                  onClick={() => navigate('/settings/wallets/add')}
                  className="mt-6 rounded-full bg-[#f6f2ea] px-6 text-black hover:bg-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first wallet
                </Button>
              </section>
            )}
          </main>
        </div>
      </div>

      <FooterNav currentRoute="/settings/wallets" />
    </div>
  );
}
