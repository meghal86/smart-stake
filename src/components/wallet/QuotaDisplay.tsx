/**
 * QuotaDisplay Component
 * 
 * Displays wallet quota usage for the user, showing:
 * - Number of unique addresses used
 * - Total quota limit
 * - Remaining quota
 * - Plan information
 * 
 * Requirement 7.7: The UI SHALL display quota usage (used_addresses, used_rows, total)
 */

import React from 'react'

export interface QuotaDisplayProps {
  /**
   * Number of unique addresses used
   */
  usedAddresses: number

  /**
   * Total number of wallet rows (address + network combinations)
   */
  usedRows: number

  /**
   * Total quota limit for the user's plan
   */
  total: number

  /**
   * User's plan (free, pro, enterprise)
   */
  plan: string

  /**
   * Optional CSS class for styling
   */
  className?: string

  /**
   * Optional callback when quota is reached
   */
  onQuotaReached?: () => void
}

/**
 * QuotaDisplay Component
 * 
 * Shows the user's wallet quota usage with a progress indicator.
 * Displays warning when quota is nearly full or reached.
 */
export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  usedAddresses,
  usedRows,
  total,
  plan,
  className = '',
  onQuotaReached,
}) => {
  const remaining = total - usedAddresses
  const percentageUsed = (usedAddresses / total) * 100
  const isQuotaReached = usedAddresses >= total
  const isQuotaNearlyFull = usedAddresses >= total * 0.8

  // Trigger callback when quota is reached
  React.useEffect(() => {
    if (isQuotaReached && onQuotaReached) {
      onQuotaReached()
    }
  }, [isQuotaReached, onQuotaReached])

  return (
    <div className={`quota-display ${className}`}>
      <div className="quota-header">
        <h3 className="quota-title">Wallet Quota</h3>
        <span className="quota-plan-badge">{plan}</span>
      </div>

      <div className="quota-stats">
        <div className="quota-stat">
          <span className="quota-label">Unique Addresses</span>
          <span className="quota-value">
            {usedAddresses} / {total}
          </span>
        </div>

        <div className="quota-stat">
          <span className="quota-label">Wallet Rows</span>
          <span className="quota-value">{usedRows}</span>
        </div>

        <div className="quota-stat">
          <span className="quota-label">Remaining</span>
          <span className={`quota-value ${isQuotaReached ? 'quota-reached' : ''}`}>
            {remaining}
          </span>
        </div>
      </div>

      <div className="quota-progress">
        <div className="quota-progress-bar">
          <div
            className={`quota-progress-fill ${
              isQuotaReached
                ? 'quota-progress-full'
                : isQuotaNearlyFull
                  ? 'quota-progress-warning'
                  : ''
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
        <span className="quota-percentage">{Math.round(percentageUsed)}%</span>
      </div>

      {isQuotaReached && (
        <div className="quota-alert quota-alert-error">
          <span className="quota-alert-icon">⚠️</span>
          <span className="quota-alert-text">
            You have reached your wallet quota limit. Upgrade your plan to add more wallets.
          </span>
        </div>
      )}

      {isQuotaNearlyFull && !isQuotaReached && (
        <div className="quota-alert quota-alert-warning">
          <span className="quota-alert-icon">ℹ️</span>
          <span className="quota-alert-text">
            You are approaching your wallet quota limit ({remaining} remaining).
          </span>
        </div>
      )}

      <style>{`
        .quota-display {
          padding: 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quota-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .quota-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .quota-plan-badge {
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid rgba(0, 255, 200, 0.3);
          font-size: 12px;
          color: rgba(0, 255, 200, 0.8);
          text-transform: capitalize;
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

        .quota-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quota-value {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .quota-value.quota-reached {
          color: #ff6b6b;
        }

        .quota-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .quota-progress-bar {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .quota-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffc8, #00d9ff);
          border-radius: 3px;
          transition: width 0.3s ease, background 0.3s ease;
        }

        .quota-progress-fill.quota-progress-warning {
          background: linear-gradient(90deg, #ffa500, #ff8c00);
        }

        .quota-progress-fill.quota-progress-full {
          background: linear-gradient(90deg, #ff6b6b, #ff4444);
        }

        .quota-percentage {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          min-width: 35px;
          text-align: right;
        }

        .quota-alert {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
        }

        .quota-alert-icon {
          flex-shrink: 0;
          font-size: 14px;
        }

        .quota-alert-text {
          color: rgba(255, 255, 255, 0.8);
        }

        .quota-alert-warning {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid rgba(255, 165, 0, 0.2);
        }

        .quota-alert-error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
        }

        @media (max-width: 640px) {
          .quota-stats {
            grid-template-columns: 1fr;
          }

          .quota-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}

export default QuotaDisplay
