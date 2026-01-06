/**
 * WalletQuotaSection Component
 * 
 * Displays wallet quota usage information using the QuotaDisplay component.
 * Fetches quota data from the useWalletQuota hook and displays it with loading/error states.
 * 
 * Requirement 7.7: The UI SHALL display quota usage (used_addresses, used_rows, total)
 */

import React from 'react'
import { useWalletQuota } from '@/hooks/useWalletQuota'
import { QuotaDisplay } from './QuotaDisplay'

export interface WalletQuotaSectionProps {
  /**
   * Optional CSS class for styling
   */
  className?: string

  /**
   * Optional callback when quota is reached
   */
  onQuotaReached?: () => void

  /**
   * Show loading skeleton while fetching
   */
  showSkeleton?: boolean
}

/**
 * Skeleton loader for quota display
 */
const QuotaDisplaySkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`quota-display-skeleton ${className}`}>
    <div className="quota-header">
      <div className="quota-title-skeleton" />
      <div className="quota-badge-skeleton" />
    </div>

    <div className="quota-stats">
      <div className="quota-stat">
        <div className="quota-label-skeleton" />
        <div className="quota-value-skeleton" />
      </div>
      <div className="quota-stat">
        <div className="quota-label-skeleton" />
        <div className="quota-value-skeleton" />
      </div>
      <div className="quota-stat">
        <div className="quota-label-skeleton" />
        <div className="quota-value-skeleton" />
      </div>
    </div>

    <div className="quota-progress-skeleton" />

    <style>{`
      .quota-display-skeleton {
        padding: 16px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      .quota-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .quota-title-skeleton {
        height: 20px;
        width: 100px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .quota-badge-skeleton {
        height: 24px;
        width: 60px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .quota-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 12px;
      }

      .quota-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .quota-label-skeleton {
        height: 12px;
        width: 80px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .quota-value-skeleton {
        height: 16px;
        width: 60px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .quota-progress-skeleton {
        height: 6px;
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        margin-bottom: 12px;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @media (max-width: 640px) {
        .quota-stats {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  </div>
)

/**
 * Error display for quota fetch failures
 */
const QuotaDisplayError: React.FC<{ error: Error; className?: string }> = ({ error, className = '' }) => (
  <div className={`quota-display-error ${className}`}>
    <div className="quota-error-content">
      <span className="quota-error-icon">⚠️</span>
      <div className="quota-error-text">
        <h3 className="quota-error-title">Failed to Load Quota</h3>
        <p className="quota-error-message">{error.message}</p>
      </div>
    </div>

    <style>{`
      .quota-display-error {
        padding: 16px;
        border-radius: 8px;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
      }

      .quota-error-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .quota-error-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .quota-error-text {
        flex: 1;
      }

      .quota-error-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 107, 107, 0.9);
      }

      .quota-error-message {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: rgba(255, 107, 107, 0.7);
      }
    `}</style>
  </div>
)

/**
 * WalletQuotaSection Component
 * 
 * Displays wallet quota usage with loading and error states.
 * Integrates with useWalletQuota hook to fetch quota data from the server.
 */
export const WalletQuotaSection: React.FC<WalletQuotaSectionProps> = ({
  className = '',
  onQuotaReached,
  showSkeleton = true,
}) => {
  const { quota, isLoading, error } = useWalletQuota()

  // Show skeleton while loading
  if (isLoading && showSkeleton) {
    return <QuotaDisplaySkeleton className={className} />
  }

  // Show error state
  if (error) {
    return <QuotaDisplayError error={error} className={className} />
  }

  // Show quota display if data is available
  if (quota) {
    return (
      <QuotaDisplay
        usedAddresses={quota.used_addresses}
        usedRows={quota.used_rows}
        total={quota.total}
        plan={quota.plan}
        className={className}
        onQuotaReached={onQuotaReached}
      />
    )
  }

  // No data available
  return null
}

export default WalletQuotaSection

