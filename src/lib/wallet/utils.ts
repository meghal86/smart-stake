/**
 * Wallet Utilities - Apple-Level Quality
 * 
 * Provides utilities for wallet labeling, provider detection, and display formatting
 * to ensure unique, user-friendly wallet identification.
 */

import type { ConnectedWallet } from '@/contexts/WalletContext';

// Wallet provider icons mapping
export const WALLET_PROVIDER_ICONS: Record<string, string> = {
  metamask: '🦊',
  rainbow: '🌈',
  coinbase: '💙',
  'coinbase wallet': '💙',
  walletconnect: '🔗',
  'wallet connect': '🔗',
  manual: '👁️',
  'manual address': '👁️',
  base: '🔵',
  'base wallet': '🔵',
  default: '💼'
};

/**
 * Get wallet provider icon from label or address
 */
export function getWalletIcon(wallet: ConnectedWallet): string {
  if (!wallet.label) return WALLET_PROVIDER_ICONS.default;
  
  const label = wallet.label.toLowerCase();
  
  // Check for provider keywords in label
  for (const [provider, icon] of Object.entries(WALLET_PROVIDER_ICONS)) {
    if (label.includes(provider)) {
      return icon;
    }
  }
  
  return WALLET_PROVIDER_ICONS.default;
}

/**
 * Extract provider name from wallet label
 */
export function getWalletProvider(wallet: ConnectedWallet): string {
  if (!wallet.label) return 'Unknown';
  
  const label = wallet.label.toLowerCase();
  
  if (label.includes('metamask')) return 'MetaMask';
  if (label.includes('rainbow')) return 'Rainbow';
  if (label.includes('coinbase')) return 'Coinbase';
  if (label.includes('walletconnect') || label.includes('wallet connect')) return 'WalletConnect';
  if (label.includes('base')) return 'Base';
  if (label.includes('manual')) return 'Manual';
  
  // Extract first word as provider name
  const firstWord = wallet.label.split(' ')[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

/**
 * Format address to short format: 0x1234...abcd
 */
export function formatShortAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get unique wallet display label using hierarchy:
 * 1. Custom label (if user set one): "Trading Wallet"
 * 2. ENS name (if available): "vitalik.eth" 
 * 3. Provider + short address: "MetaMask (0x1234...abcd)"
 */
export function getWalletDisplayLabel(wallet: ConnectedWallet): string {
  // Priority 1: Custom label (but not generic provider labels)
  if (wallet.label && !isGenericLabel(wallet.label)) {
    return wallet.label;
  }
  
  // Priority 2: ENS name
  if (wallet.ens) {
    return wallet.ens;
  }
  
  // Priority 3: Lens Protocol handle
  if (wallet.lens) {
    return wallet.lens;
  }
  
  // Priority 4: Unstoppable Domains
  if (wallet.unstoppable) {
    return wallet.unstoppable;
  }
  
  // Priority 5: Provider + short address
  const provider = getWalletProvider(wallet);
  const shortAddress = formatShortAddress(wallet.address);
  return `${provider} (${shortAddress})`;
}

/**
 * Check if label is generic (like "MetaMask Account 1")
 */
function isGenericLabel(label: string): boolean {
  const genericPatterns = [
    /^(metamask|rainbow|coinbase|base|wallet)\s+(account|wallet)\s+\d+$/i,
    /^connected\s+wallet$/i,
    /^wallet\s+\d+$/i,
    /^account\s+\d+$/i
  ];
  
  return genericPatterns.some(pattern => pattern.test(label));
}

/**
 * Get wallet short label for header display (max 15 chars)
 */
export function getWalletShortLabel(wallet: ConnectedWallet): string {
  const fullLabel = getWalletDisplayLabel(wallet);
  
  // If it's a custom label, truncate if needed
  if (wallet.label && !isGenericLabel(wallet.label)) {
    return fullLabel.length > 15 ? `${fullLabel.slice(0, 12)}...` : fullLabel;
  }
  
  // If it's ENS/Lens/UD, truncate if needed
  if (wallet.ens || wallet.lens || wallet.unstoppable) {
    return fullLabel.length > 15 ? `${fullLabel.slice(0, 12)}...` : fullLabel;
  }
  
  // For provider + address, just show short address
  return formatShortAddress(wallet.address);
}

/**
 * Ensure all wallets have unique display labels
 * If duplicates exist, append (2), (3), etc.
 */
export function ensureUniqueLabels(wallets: ConnectedWallet[]): Array<ConnectedWallet & { uniqueLabel: string }> {
  const labelCounts = new Map<string, number>();
  const result: Array<ConnectedWallet & { uniqueLabel: string }> = [];
  
  // First pass: count label occurrences
  wallets.forEach(wallet => {
    const label = getWalletDisplayLabel(wallet);
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  });
  
  // Second pass: assign unique labels
  const usedLabels = new Map<string, number>();
  
  wallets.forEach(wallet => {
    const baseLabel = getWalletDisplayLabel(wallet);
    const count = labelCounts.get(baseLabel) || 1;
    
    let uniqueLabel = baseLabel;
    
    if (count > 1) {
      const occurrence = (usedLabels.get(baseLabel) || 0) + 1;
      usedLabels.set(baseLabel, occurrence);
      
      if (occurrence > 1) {
        uniqueLabel = `${baseLabel} (${occurrence})`;
      }
    }
    
    result.push({
      ...wallet,
      uniqueLabel
    });
  });
  
  return result;
}

/**
 * Sort wallets with active wallet first, then by last used, then by label
 */
export function sortWalletsForDisplay(
  wallets: ConnectedWallet[], 
  activeWalletAddress: string | null
): ConnectedWallet[] {
  return [...wallets].sort((a, b) => {
    // Active wallet always first
    if (activeWalletAddress) {
      if (a.address === activeWalletAddress) return -1;
      if (b.address === activeWalletAddress) return 1;
    }
    
    // Then by last used (most recent first)
    if (a.lastUsed && b.lastUsed) {
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    }
    if (a.lastUsed && !b.lastUsed) return -1;
    if (!a.lastUsed && b.lastUsed) return 1;
    
    // Finally by label alphabetically
    const labelA = getWalletDisplayLabel(a);
    const labelB = getWalletDisplayLabel(b);
    return labelA.localeCompare(labelB);
  });
}

/**
 * Check if wallet has ENS resolution in progress
 */
export function isENSLoading(wallet: ConnectedWallet): boolean {
  // This would be set by the ENS resolution hook
  return (wallet as any).ensLoading === true;
}