import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeAddress } from '@/lib/guardian/address';

const isNextRuntime = () => typeof window !== 'undefined' && Boolean((window as any).__NEXT_DATA__);

type GuardianWalletStatus = 'connected' | 'linked' | 'readonly';
type GuardianWalletType = 'browser' | 'mobile' | 'hardware' | 'exchange' | 'smart' | 'social' | 'readonly';

export interface GuardianWallet {
  id: string;
  address: string;
  alias?: string | null;
  trust_score?: number | null;
  risk_count?: number | null;
  last_scan?: string | null;
  status: GuardianWalletStatus;
  wallet_type: GuardianWalletType;
  ens_name?: string | null;
  added_at?: string | null;
  short: string;
}

interface WalletContextType {
  wallets: GuardianWallet[];
  activeWallet: GuardianWallet | null;
  setActiveWallet: (address: string) => void;
  addWallet: (params: { input: string; alias?: string; walletType?: GuardianWalletType }) => Promise<GuardianWallet>;
  removeWallet: (address: string) => Promise<void>;
  updateWallet: (address: string, updates: Partial<GuardianWallet>) => void;
  updateWalletAlias: (address: string, alias: string | null) => Promise<void>;
  refreshWallets: () => Promise<void>;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<GuardianWallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<GuardianWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const refreshWallets = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('guardian_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if ((error as any)?.code === 'PGRST205') {
          console.warn('guardian_wallets table not found; ensure migration 20241027000000_guardian_multi_wallet.sql is applied.');
          setWallets([]);
          return;
        }
        throw error;
      }

      const formattedWallets = (data || []).map(wallet => ({
        ...wallet,
        status: (wallet.status ?? 'readonly') as GuardianWalletStatus,
        wallet_type: (wallet.wallet_type ?? 'readonly') as GuardianWalletType,
        short: formatAddress(wallet.address),
      }));

      setWallets(formattedWallets);
      
      // Set first wallet as active if none selected
      if (formattedWallets.length > 0 && !activeWallet) {
        setActiveWalletState(formattedWallets[0]);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveWallet = (address: string) => {
    const wallet = wallets.find(w => w.address === address);
    if (wallet) {
      setActiveWalletState(wallet);
    }
  };

  const addWallet = async ({
    input,
    alias,
    walletType = 'readonly',
  }: {
    input: string;
    alias?: string;
    walletType?: GuardianWalletType;
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    let wallet: GuardianWallet | null = null;

    if (isNextRuntime()) {
      try {
        const response = await fetch('/api/guardian/add-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input,
            alias,
            walletType,
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          wallet = payload.wallet as GuardianWallet;
        } else if (response.status === 409) {
          throw new Error('Wallet already added.');
        } else if (response.status !== 404) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.error || 'Failed to add wallet');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Failed to add wallet')) {
          throw error;
        }
        // fall through to Supabase fallback
      }
    }

    const normalizedAddress = normalizeAddress(wallet ? wallet.address : input);
    const resolvedAlias = alias?.trim() || null;

    if (!wallet) {
      const existing = wallets.find((w) => w.address === normalizedAddress);
      if (existing) {
        const label = existing.alias || existing.ens_name || existing.short;
        throw new Error(`Wallet already added (${label})`);
      }

      const { data, error } = await supabase
        .from('guardian_wallets')
        .insert({
          user_id: user.id,
          address: normalizedAddress,
          alias: resolvedAlias,
          wallet_type: walletType,
          status: walletType === 'browser' ? 'connected' : walletType === 'readonly' ? 'readonly' : 'linked',
        })
        .select()
        .single();

      if (error) {
        const code = (error as any)?.code;
        if (code === '23505') {
          throw new Error('Wallet already added.');
        }
        throw error;
      }

      wallet = {
        ...data,
        status: (data.status ?? 'readonly') as GuardianWalletStatus,
        wallet_type: (data.wallet_type ?? walletType) as GuardianWalletType,
        short: formatAddress(data.address),
      } as GuardianWallet;

      await supabase.from('guardian_logs').insert({
        user_id: user.id,
        event_type: 'wallet_add',
        metadata: {
          address: normalizedAddress,
          wallet_type: wallet.wallet_type,
          alias: resolvedAlias,
        },
      });

      await supabase.functions.invoke('guardian-scan-v2', {
        body: {
          wallet_address: normalizedAddress,
          user_id: user.id,
          trigger: 'add-wallet-fallback',
        },
      });
    }

    await refreshWallets();

    const nextWallet: GuardianWallet = {
      ...wallet,
      address: normalizedAddress,
      status: (wallet.status ?? 'readonly') as GuardianWalletStatus,
      wallet_type: (wallet.wallet_type ?? walletType) as GuardianWalletType,
      short: formatAddress(normalizedAddress),
    };

    setActiveWalletState(nextWallet);
    return nextWallet;
  };

  const removeWallet = async (address: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('guardian_wallets')
        .delete()
        .eq('user_id', user.id)
        .eq('address', address.toLowerCase());

      if (error) throw error;

      setWallets(prev => prev.filter(w => w.address !== address));
      
      // If removing active wallet, set new active
      if (activeWallet?.address === address) {
        const remaining = wallets.filter(w => w.address !== address);
        setActiveWalletState(remaining[0] || null);
      }
    } catch (error) {
      console.error('Error removing wallet:', error);
      throw error;
    }
  };

  const updateWallet = (address: string, updates: Partial<GuardianWallet>) => {
    setWallets(prev => prev.map(w => 
      w.address === address ? { ...w, ...updates } : w
    ));
    
    if (activeWallet?.address === address) {
      setActiveWalletState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const updateWalletAlias = async (address: string, alias: string | null) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('guardian_wallets')
      .update({ alias })
      .eq('user_id', user.id)
      .eq('address', address.toLowerCase());

    if (error) {
      throw error;
    }

    updateWallet(address.toLowerCase(), { alias });
  };

  useEffect(() => {
    if (user) {
      refreshWallets();
    } else {
      setWallets([]);
      setActiveWalletState(null);
    }
  }, [user]);

  return (
    <WalletContext.Provider value={{
      wallets,
      activeWallet,
      setActiveWallet,
      addWallet,
      removeWallet,
      updateWallet,
      updateWalletAlias,
      refreshWallets,
      isLoading
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}
