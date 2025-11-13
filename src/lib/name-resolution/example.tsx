/**
 * ENS Name Resolution - Usage Examples
 * 
 * Examples showing how to use the name resolution service
 * with ENS, Lens Protocol, and Unstoppable Domains
 * 
 * @see src/lib/name-resolution/index.ts
 * @see src/lib/name-resolution/README.md
 */

import React, { useEffect, useState } from 'react';
import { resolveName, resolveNames, preloadNames } from './index';
import { useWallet } from '@/contexts/WalletContext';

// ============================================================================
// Example 1: Basic Name Resolution
// ============================================================================

export function BasicResolutionExample() {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResolve = async (address: string) => {
    setIsLoading(true);
    try {
      const result = await resolveName(address);
      setName(result?.name || null);
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleResolve('0x1234...')}>
        Resolve Name
      </button>
      {isLoading && <p>Resolving...</p>}
      {name && <p>Name: {name}</p>}
    </div>
  );
}

// ============================================================================
// Example 2: Wallet List with Names
// ============================================================================

export function WalletListExample() {
  const { connectedWallets } = useWallet();
  const [resolvedNames, setResolvedNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function resolveAllNames() {
      const addresses = connectedWallets.map(w => w.address);
      const results = await resolveNames(addresses);
      
      const nameMap = new Map<string, string>();
      results.forEach((result, address) => {
        if (result?.name) {
          nameMap.set(address, result.name);
        }
      });
      
      setResolvedNames(nameMap);
    }

    if (connectedWallets.length > 0) {
      resolveAllNames();
    }
  }, [connectedWallets]);

  return (
    <ul>
      {connectedWallets.map(wallet => (
        <li key={wallet.address}>
          {resolvedNames.get(wallet.address) || wallet.address}
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// Example 3: Preload Names on Mount
// ============================================================================

export function PreloadExample() {
  const knownAddresses = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  useEffect(() => {
    // Preload names into cache
    preloadNames(knownAddresses);
  }, []);

  return <div>Names preloaded in background</div>;
}

// ============================================================================
// Example 4: Display Name with Priority
// ============================================================================

export function DisplayNameExample() {
  const { connectedWallets, activeWallet } = useWallet();
  
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  
  // Priority: ENS > Lens > Unstoppable > Label > Truncated Address
  const displayName = activeWalletData?.ens 
    || activeWalletData?.lens 
    || activeWalletData?.unstoppable 
    || activeWalletData?.label 
    || truncateAddress(activeWalletData?.address);

  return (
    <div>
      <p>Active Wallet: {displayName}</p>
      {activeWalletData?.ens && <span className="badge">ENS</span>}
      {activeWalletData?.lens && <span className="badge">Lens</span>}
      {activeWalletData?.unstoppable && <span className="badge">UD</span>}
    </div>
  );
}

// ============================================================================
// Example 5: Provider-Specific Resolution
// ============================================================================

export function ProviderSpecificExample() {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [lensHandle, setLensHandle] = useState<string | null>(null);

  const resolveWithProviders = async (address: string) => {
    // Try only ENS
    const ensResult = await resolveName(address, { providers: ['ens'] });
    setEnsName(ensResult?.name || null);

    // Try only Lens
    const lensResult = await resolveName(address, { providers: ['lens'] });
    setLensHandle(lensResult?.name || null);
  };

  return (
    <div>
      <button onClick={() => resolveWithProviders('0x1234...')}>
        Resolve
      </button>
      {ensName && <p>ENS: {ensName}</p>}
      {lensHandle && <p>Lens: {lensHandle}</p>}
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function truncateAddress(address: string | undefined, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
