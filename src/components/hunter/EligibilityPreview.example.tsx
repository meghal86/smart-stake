/**
 * Example: Integrating EligibilityPreview into OpportunityCard
 * 
 * This example shows how to add eligibility checking to opportunity cards
 * with automatic wallet switching support.
 */

import React from 'react';
import { EligibilityPreview } from './EligibilityPreview';
import { useWallet } from '@/contexts/WalletContext';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  chains: string[];
  reward: string;
  // ... other fields
}

interface OpportunityCardWithEligibilityProps {
  opportunity: Opportunity;
  isDarkTheme?: boolean;
}

/**
 * Example OpportunityCard with integrated EligibilityPreview
 */
export function OpportunityCardWithEligibility({
  opportunity,
  isDarkTheme = true,
}: OpportunityCardWithEligibilityProps) {
  const { activeWallet } = useWallet();

  return (
    <div className="opportunity-card">
      {/* Card Header */}
      <div className="card-header">
        <h3>{opportunity.title}</h3>
        <p>{opportunity.description}</p>
      </div>

      {/* Reward Info */}
      <div className="reward-info">
        <span>Reward: {opportunity.reward}</span>
      </div>

      {/* Eligibility Preview - Only shown when wallet is connected */}
      {activeWallet && (
        <EligibilityPreview
          opportunityId={opportunity.id}
          chain={opportunity.chains[0]} // Use primary chain
          isDarkTheme={isDarkTheme}
          className="mt-4"
        />
      )}

      {/* CTA Button */}
      <button className="cta-button">
        {activeWallet ? 'Join Quest' : 'Connect Wallet'}
      </button>
    </div>
  );
}

/**
 * Example: Conditional CTA based on eligibility
 */
export function OpportunityCardWithConditionalCTA({
  opportunity,
  isDarkTheme = true,
}: OpportunityCardWithEligibilityProps) {
  const { activeWallet } = useWallet();
  const [eligibilityStatus, setEligibilityStatus] = React.useState<string | null>(null);

  return (
    <div className="opportunity-card">
      {/* Card Content */}
      <div className="card-content">
        <h3>{opportunity.title}</h3>
        <p>{opportunity.description}</p>
      </div>

      {/* Eligibility Preview with status callback */}
      {activeWallet && (
        <EligibilityPreview
          opportunityId={opportunity.id}
          chain={opportunity.chains[0]}
          isDarkTheme={isDarkTheme}
        />
      )}

      {/* Conditional CTA based on eligibility */}
      <button
        className={`cta-button ${
          eligibilityStatus === 'unlikely' ? 'cta-disabled' : ''
        }`}
        disabled={eligibilityStatus === 'unlikely'}
      >
        {!activeWallet && 'Connect Wallet'}
        {activeWallet && eligibilityStatus === 'likely' && 'Join Quest'}
        {activeWallet && eligibilityStatus === 'maybe' && 'Try Anyway'}
        {activeWallet && eligibilityStatus === 'unlikely' && 'Not Eligible'}
        {activeWallet && eligibilityStatus === 'unknown' && 'Check Eligibility'}
      </button>
    </div>
  );
}

/**
 * Example: Grid of opportunities with eligibility
 */
export function OpportunityGridWithEligibility({
  opportunities,
  isDarkTheme = true,
}: {
  opportunities: Opportunity[];
  isDarkTheme?: boolean;
}) {
  const { activeWallet } = useWallet();

  return (
    <div className="opportunity-grid">
      {opportunities.map((opportunity) => (
        <div key={opportunity.id} className="opportunity-card">
          <h3>{opportunity.title}</h3>
          <p>{opportunity.description}</p>

          {/* Show eligibility for connected wallet */}
          {activeWallet && (
            <EligibilityPreview
              opportunityId={opportunity.id}
              chain={opportunity.chains[0]}
              isDarkTheme={isDarkTheme}
            />
          )}

          <button className="cta-button">
            {activeWallet ? 'Join Quest' : 'Connect Wallet'}
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Eligibility filter toggle
 */
export function OpportunityFeedWithEligibilityFilter({
  opportunities,
  isDarkTheme = true,
}: {
  opportunities: Opportunity[];
  isDarkTheme?: boolean;
}) {
  const { activeWallet } = useWallet();
  const [showOnlyEligible, setShowOnlyEligible] = React.useState(false);

  // Note: In production, filtering should be done server-side
  // This is just for demonstration purposes
  const filteredOpportunities = showOnlyEligible
    ? opportunities // Would filter based on eligibility status
    : opportunities;

  return (
    <div>
      {/* Filter Toggle */}
      {activeWallet && (
        <div className="filter-controls">
          <label>
            <input
              type="checkbox"
              checked={showOnlyEligible}
              onChange={(e) => setShowOnlyEligible(e.target.checked)}
            />
            Show only opportunities I'm likely eligible for
          </label>
        </div>
      )}

      {/* Opportunity Grid */}
      <div className="opportunity-grid">
        {filteredOpportunities.map((opportunity) => (
          <div key={opportunity.id} className="opportunity-card">
            <h3>{opportunity.title}</h3>

            {activeWallet && (
              <EligibilityPreview
                opportunityId={opportunity.id}
                chain={opportunity.chains[0]}
                isDarkTheme={isDarkTheme}
              />
            )}

            <button className="cta-button">Join Quest</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Wallet switching with eligibility updates
 */
export function WalletSwitcherWithEligibility({
  opportunity,
  isDarkTheme = true,
}: OpportunityCardWithEligibilityProps) {
  const { activeWallet, connectedWallets, setActiveWallet } = useWallet();

  return (
    <div className="card-with-wallet-switcher">
      {/* Wallet Selector */}
      {connectedWallets.length > 1 && (
        <div className="wallet-selector">
          <label>Check eligibility for:</label>
          <select
            value={activeWallet || ''}
            onChange={(e) => setActiveWallet(e.target.value)}
          >
            {connectedWallets.map((wallet) => (
              <option key={wallet.address} value={wallet.address}>
                {wallet.label || wallet.address.slice(0, 10)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Opportunity Card */}
      <div className="opportunity-card">
        <h3>{opportunity.title}</h3>
        <p>{opportunity.description}</p>

        {/* Eligibility automatically updates when wallet changes */}
        {activeWallet && (
          <EligibilityPreview
            opportunityId={opportunity.id}
            chain={opportunity.chains[0]}
            isDarkTheme={isDarkTheme}
          />
        )}

        <button className="cta-button">Join Quest</button>
      </div>
    </div>
  );
}
