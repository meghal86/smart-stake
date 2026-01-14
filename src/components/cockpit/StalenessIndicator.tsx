/**
 * Staleness Indicator Component
 * 
 * Displays staleness indicators and retry CTAs when the system is in degraded mode.
 * Shows warning or error states based on provider status.
 * 
 * Requirements: 15.1, 15.2, 15.4
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProviderStatus } from '@/lib/cockpit/types';

// ============================================================================
// Types
// ============================================================================

interface StalenessIndicatorProps {
  /** Provider status from API */
  providerStatus: ProviderStatus;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as banner (full width) or inline */
  variant?: 'banner' | 'inline';
}

// ============================================================================
// Component
// ============================================================================

export const StalenessIndicator: React.FC<StalenessIndicatorProps> = ({
  providerStatus,
  showRetry = true,
  onRetry,
  size = 'md',
  variant = 'banner',
}) => {
  // Don't render if system is online
  if (providerStatus.state === 'online') {
    return null;
  }

  const isOffline = providerStatus.state === 'offline';
  const isDegraded = providerStatus.state === 'degraded';

  // Icon based on status
  const StatusIcon = isOffline ? WifiOff : isDegraded ? Wifi : AlertTriangle;
  
  // Colors based on status
  const colorClasses = isOffline 
    ? 'border-red-500/30 bg-red-500/10 text-red-100'
    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100';

  // Message
  let message = 'System status: ';
  if (isOffline) {
    message += 'Some services are offline';
  } else if (isDegraded) {
    message += 'Some services are experiencing delays';
  }

  if (providerStatus.detail) {
    message += ` (${providerStatus.detail})`;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  };

  // Variant classes
  const variantClasses = variant === 'banner' 
    ? 'w-full' 
    : 'inline-flex items-center gap-2';

  if (variant === 'inline') {
    return (
      <div className={`${variantClasses} ${colorClasses} ${sizeClasses[size]} rounded-lg border backdrop-blur-md`}>
        <StatusIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{message}</span>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="ml-2 h-6 px-2 text-xs hover:bg-white/10"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className={`${colorClasses} ${sizeClasses[size]} border backdrop-blur-md`}>
      <StatusIcon className="w-4 h-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="ml-4 h-8 px-3 text-sm hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Banner staleness indicator for top of page
 */
export const StalenessIndicatorBanner: React.FC<{
  providerStatus: ProviderStatus;
  onRetry?: () => void;
}> = ({ providerStatus, onRetry }) => (
  <StalenessIndicator
    providerStatus={providerStatus}
    onRetry={onRetry}
    variant="banner"
    size="md"
  />
);

/**
 * Inline staleness indicator for components
 */
export const StalenessIndicatorInline: React.FC<{
  providerStatus: ProviderStatus;
  onRetry?: () => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ providerStatus, onRetry, size = 'sm' }) => (
  <StalenessIndicator
    providerStatus={providerStatus}
    onRetry={onRetry}
    variant="inline"
    size={size}
  />
);

export default StalenessIndicator;