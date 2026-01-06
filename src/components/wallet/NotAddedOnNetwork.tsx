/**
 * NotAddedOnNetwork Component
 * 
 * Displays when user switches to a network where their active wallet is not registered.
 * Offers option to add the wallet to the current network.
 * 
 * Requirement 6.2: If the active wallet is not registered on the selected network, 
 * the UI SHALL show "Not added on this network".
 * Requirement 6.3: The UI SHALL offer "Add network" for missing wallet-network combinations.
 */

import { AlertCircle, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NotAddedOnNetworkProps {
  walletAddress: string;
  networkName: string;
  chainNamespace: string;
  onAddNetwork?: () => void;
  compact?: boolean;
}

export function NotAddedOnNetwork({
  walletAddress,
  networkName,
  chainNamespace,
  onAddNetwork,
  compact = false,
}: NotAddedOnNetworkProps) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const displayAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-3 rounded-lg border ${
          isDark
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}
      >
        <AlertCircle size={16} className="flex-shrink-0" />
        <span className="text-sm font-medium">Not added on {networkName}</span>
        {onAddNetwork && (
          <button
            onClick={onAddNetwork}
            className={`ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            }`}
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        isDark
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}
        >
          <AlertCircle
            size={24}
            className={isDark ? 'text-amber-400' : 'text-amber-600'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold mb-1 ${
              isDark ? 'text-amber-400' : 'text-amber-900'
            }`}
          >
            Wallet not added on {networkName}
          </h3>

          <p
            className={`text-sm mb-4 ${
              isDark ? 'text-amber-300/80' : 'text-amber-800'
            }`}
          >
            Your wallet <span className="font-mono">{displayAddress}</span> is not
            registered on the {networkName} network. Add it to start monitoring this
            wallet on {networkName}.
          </p>

          {onAddNetwork && (
            <button
              onClick={onAddNetwork}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
              }`}
            >
              <Plus size={16} />
              Add wallet to {networkName}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
