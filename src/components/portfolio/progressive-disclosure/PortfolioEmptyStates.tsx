/**
 * Portfolio-Specific Empty State Components
 * 
 * User-friendly empty states for portfolio views.
 * Provides clear guidance and actionable next steps.
 * 
 * REUSES: Design patterns from src/components/ux/ActionableEmptyState.tsx
 * 
 * Validates: Requirements 10.1, 10.2
 */

import React from 'react';
import { 
  AlertCircle, 
  Shield, 
  TrendingUp, 
  Wallet, 
  FileText,
  Activity,
  DollarSign,
  Link as LinkIcon,
  Zap,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  className?: string;
}

/**
 * No Actions Empty State
 * Shown when there are no recommended actions
 */
export const NoActionsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
      <Shield className="w-8 h-8 text-green-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      All Clear!
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      Your portfolio is in great shape. No immediate actions needed right now.
      We'll notify you when new opportunities arise.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-3">
      <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
        Explore Opportunities
      </button>
      <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150">
        View Settings
      </button>
    </div>
  </div>
);

/**
 * No Approvals Empty State
 * Shown when there are no approval risks
 */
export const NoApprovalsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
      <Shield className="w-8 h-8 text-green-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Risky Approvals
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      Great news! We haven't detected any risky token approvals in your wallets.
      Keep up the good security practices.
    </p>
    
    <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
      Learn About Approvals
    </button>
  </div>
);

/**
 * No Assets Empty State
 * Shown when there are no assets in the portfolio
 */
export const NoAssetsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
      <Wallet className="w-8 h-8 text-blue-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Assets Found
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      We couldn't find any assets in your connected wallets.
      Make sure your wallets are properly connected and synced.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-3">
      <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
        Add Wallet
      </button>
      <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150">
        Refresh Data
      </button>
    </div>
  </div>
);

/**
 * No Transactions Empty State
 * Shown when there are no transactions
 */
export const NoTransactionsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
      <Activity className="w-8 h-8 text-purple-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Recent Transactions
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      No transaction history found for your connected wallets.
      Start using your wallets to see activity here.
    </p>
    
    <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
      Explore DeFi
    </button>
  </div>
);

/**
 * No Protocol Exposure Empty State
 * Shown when there is no protocol exposure
 */
export const NoProtocolExposureEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
      <LinkIcon className="w-8 h-8 text-cyan-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Protocol Exposure
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      You're not currently exposed to any DeFi protocols.
      Explore opportunities to start earning yield on your assets.
    </p>
    
    <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
      Discover Protocols
    </button>
  </div>
);

/**
 * No Plans Empty State
 * Shown when there are no intent plans
 */
export const NoPlansEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
      <FileText className="w-8 h-8 text-orange-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Execution Plans
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      You haven't created any execution plans yet.
      Plans help you safely execute complex DeFi operations.
    </p>
    
    <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150">
      Create Plan
    </button>
  </div>
);

/**
 * No Audit Events Empty State
 * Shown when there are no audit events
 */
export const NoAuditEventsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center mb-4">
      <Eye className="w-8 h-8 text-gray-400" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      No Audit Events
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      No audit events recorded yet. Events will appear here as you interact
      with your portfolio and execute transactions.
    </p>
  </div>
);

/**
 * Data Loading Failed Empty State
 * Shown when data fails to load (different from error boundary)
 */
export const DataLoadFailedEmptyState: React.FC<EmptyStateProps & { onRetry?: () => void }> = ({ 
  className,
  onRetry 
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      Failed to Load Data
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      We couldn't load your portfolio data. This might be a temporary issue.
      Please try again in a moment.
    </p>
    
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * Wallet Not Connected Empty State
 * Shown when user needs to connect a wallet
 */
export const WalletNotConnectedEmptyState: React.FC<EmptyStateProps & { onConnect?: () => void }> = ({ 
  className,
  onConnect 
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
      <Wallet className="w-8 h-8 text-cyan-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      Connect Your Wallet
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      Connect your wallet to view your portfolio, track assets,
      and get personalized recommendations.
    </p>
    
    {onConnect && (
      <button 
        onClick={onConnect}
        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150"
      >
        Connect Wallet
      </button>
    )}
  </div>
);

/**
 * Sync In Progress Empty State
 * Shown when portfolio is syncing
 */
export const SyncInProgressEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 text-center',
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 animate-pulse">
      <Zap className="w-8 h-8 text-cyan-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">
      Syncing Your Portfolio
    </h3>
    
    <p className="text-white/70 text-sm max-w-md mb-6">
      We're fetching the latest data from the blockchain.
      This usually takes a few seconds.
    </p>
    
    <div className="flex items-center space-x-2 text-cyan-400 text-sm">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/**
 * Export all empty states for easy import
 */
export const PortfolioEmptyStates = {
  NoActions: NoActionsEmptyState,
  NoApprovals: NoApprovalsEmptyState,
  NoAssets: NoAssetsEmptyState,
  NoTransactions: NoTransactionsEmptyState,
  NoProtocolExposure: NoProtocolExposureEmptyState,
  NoPlans: NoPlansEmptyState,
  NoAuditEvents: NoAuditEventsEmptyState,
  DataLoadFailed: DataLoadFailedEmptyState,
  WalletNotConnected: WalletNotConnectedEmptyState,
  SyncInProgress: SyncInProgressEmptyState
};
