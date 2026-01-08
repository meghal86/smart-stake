/**
 * WalletNetworkGuard Component - Usage Examples
 * 
 * This file demonstrates how to use the WalletNetworkGuard component
 * to display "Not added on this network" UI when appropriate.
 */

import { WalletNetworkGuard } from './WalletNetworkGuard';
import { useRouter } from 'next/navigation';

/**
 * Example 1: Basic Usage
 * 
 * Shows the guard with default behavior (navigates to /settings?tab=wallets&action=add)
 */
export function BasicExample() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Guardian Security Scan</h2>
      
      {/* WalletNetworkGuard will show if wallet is not on current network */}
      <WalletNetworkGuard />
      
      {/* Rest of Guardian content */}
      <div className="mt-6">
        <p>Guardian scan results would appear here...</p>
      </div>
    </div>
  );
}

/**
 * Example 2: Custom Add Network Handler
 * 
 * Shows the guard with a custom callback for the "Add to [Network]" button
 */
export function CustomHandlerExample() {
  const router = useRouter();

  const handleAddNetwork = () => {
    // Custom logic: navigate to a specific add wallet page
    router.push('/wallets/add?network=polygon');
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Hunter Screen Feed</h2>
      
      <WalletNetworkGuard onAddNetwork={handleAddNetwork} />
      
      <div className="mt-6">
        <p>Hunter opportunities would appear here...</p>
      </div>
    </div>
  );
}

/**
 * Example 3: With Custom Styling
 * 
 * Shows the guard with custom CSS classes
 */
export function StyledExample() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">HarvestPro Tax Opportunities</h2>
      
      <WalletNetworkGuard 
        className="mb-6 border-2 border-amber-500"
      />
      
      <div className="mt-6">
        <p>Tax opportunities would appear here...</p>
      </div>
    </div>
  );
}

/**
 * Example 4: Only Show When Missing
 * 
 * Shows the guard only when wallet is actually missing on the network
 * (not when no wallet is selected)
 */
export function OnlyShowWhenMissingExample() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Portfolio Dashboard</h2>
      
      <WalletNetworkGuard 
        onlyShowWhenMissing={true}
      />
      
      <div className="mt-6">
        <p>Portfolio data would appear here...</p>
      </div>
    </div>
  );
}

/**
 * Example 5: Complete Integration
 * 
 * Shows how to integrate WalletNetworkGuard into a full page
 */
export function CompleteIntegrationExample() {
  const router = useRouter();

  const handleAddNetwork = () => {
    // Navigate to wallet settings with specific network
    router.push('/settings/wallets?action=add');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Guardian</h1>
          <p className="text-slate-400">
            Security scanning for your connected wallets
          </p>
        </div>

        {/* Network Guard - Shows if wallet not on current network */}
        <WalletNetworkGuard 
          onAddNetwork={handleAddNetwork}
          className="mb-8"
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Security Score
            </h2>
            <p className="text-slate-400">
              Your wallet security analysis would appear here
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Recent Approvals
            </h2>
            <p className="text-slate-400">
              Your recent approvals would appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage Notes:
 * 
 * 1. The WalletNetworkGuard component automatically detects if the active wallet
 *    is available on the active network using the useWalletNetworkAvailability hook.
 * 
 * 2. It only renders when:
 *    - Active wallet exists
 *    - Wallet is not available on the current network
 *    - Wallet has at least one supported network
 * 
 * 3. The component displays:
 *    - Warning icon and message
 *    - Wallet address
 *    - Network name
 *    - "Add to [Network]" action button
 * 
 * 4. Accessibility:
 *    - ARIA labels for screen readers
 *    - Keyboard navigation support
 *    - High contrast colors
 *    - Touch-friendly button (44px minimum)
 * 
 * 5. Customization:
 *    - Pass onAddNetwork callback for custom behavior
 *    - Pass className for custom styling
 *    - Pass onlyShowWhenMissing to control visibility
 * 
 * 6. Integration Points:
 *    - Works with WalletContext for active wallet/network
 *    - Works with useWalletNetworkAvailability hook
 *    - Works with NotAddedOnNetwork component
 */
