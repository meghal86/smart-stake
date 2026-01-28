/**
 * Portfolio Empty State Components
 * 
 * Reusable empty states for portfolio sections.
 * Extends ActionableEmptyState pattern for portfolio use cases.
 * 
 * Validates: Requirements 10.2
 */

'use client';

import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Wallet,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  className?: string;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * No Actions Empty State
 * When there are no recommended actions
 */
export function NoActionsEmptyState({ className, onAction, actionLabel = 'Refresh' }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        All Clear!
      </h3>
      
      <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
        Your portfolio looks healthy. We'll notify you if any actions are recommended.
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * No Approvals Empty State
 * When there are no token approvals
 */
export function NoApprovalsEmptyState({ className, onAction, actionLabel = 'Connect Wallet' }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        No Approvals Found
      </h3>
      
      <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
        We couldn't find any token approvals for this wallet. Connect a wallet with DeFi activity to see approval risks.
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * No Positions Empty State
 * When there are no positions
 */
export function NoPositionsEmptyState({ className, onAction, actionLabel = 'Add Wallet' }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-purple-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        No Positions Yet
      </h3>
      
      <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
        Connect a wallet to start tracking your portfolio positions across chains and protocols.
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * No Transactions Empty State
 * When there are no transactions in audit tab
 */
export function NoTransactionsEmptyState({ className, onAction, actionLabel = 'View Activity' }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <Activity className="w-8 h-8 text-cyan-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        No Transactions
      </h3>
      
      <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
        No transaction history found for this wallet. Activity will appear here once you start transacting.
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Degraded Mode Banner
 * When confidence is below threshold
 */
interface DegradedModeBannerProps {
  confidence: number;
  threshold: number;
  reasons?: string[];
  className?: string;
}

export function DegradedModeBanner({ 
  confidence, 
  threshold, 
  reasons = [],
  className 
}: DegradedModeBannerProps) {
  return (
    <div className={cn(
      'bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-yellow-500 mb-1">
            Limited Preview Mode
          </h4>
          <p className="text-sm text-white/80 mb-2">
            Data confidence is below threshold ({(confidence * 100).toFixed(0)}% &lt; {(threshold * 100).toFixed(0)}%). 
            Some features are temporarily restricted for your safety.
          </p>
          {reasons.length > 0 && (
            <ul className="text-xs text-white/70 space-y-1">
              {reasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Error State
 * Generic error display for failed data loads
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className 
}: ErrorStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors duration-150"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
