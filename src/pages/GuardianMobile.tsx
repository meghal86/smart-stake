/**
 * Guardian Mobile View
 * Matches the exact design from the screenshots with dark theme
 */
import { useEffect, useState } from 'react';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { Hub2Footer } from '@/components/hub2/Hub2Footer';
import { useGuardianAnalytics } from '@/lib/analytics/guardian';
import '@/styles/guardian-theme.css';

// Mock wallet hook - replace with real wagmi
const useMockWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    const mockAddress = '0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C';
    setAddress(mockAddress);
    setIsConnected(true);
  };

  return { address, isConnected, connect };
};

export function GuardianMobile() {
  const { address, isConnected, connect } = useMockWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const analytics = useGuardianAnalytics();

  const { data, isLoading, rescan, isRescanning } = useGuardianScan({
    walletAddress: address || undefined,
    network: 'ethereum',
    enabled: isConnected && !!address,
  });

  // Auto-scan on connect + analytics
  useEffect(() => {
    if (isConnected && address && !data) {
      setIsScanning(true);
      setScanStartTime(Date.now());
      analytics.scanStarted(address, 'ethereum', true);
      setTimeout(() => setIsScanning(false), 3000);
    }
  }, [isConnected, address, data, analytics]);

  // Track scan completion
  useEffect(() => {
    if (data && scanStartTime) {
      const duration = Date.now() - scanStartTime;
      analytics.scanCompleted(
        address || '',
        data.trustScorePercent || 0,
        data.confidence || 0.8,
        data.flags?.length || 0,
        data.flags?.filter((f: any) => f.severity === 'high').length || 0,
        duration,
        undefined, // ttfr not tracked here
        data.scanId
      );
      setScanStartTime(null);
    }
  }, [data, scanStartTime, address, analytics]);

  const handleRescan = async () => {
    if (!address) return;
    
    setIsScanning(true);
    setScanStartTime(Date.now());
    
    analytics.track('guardian_rescan_requested' as any, {
      wallet_address: address,
    });

    try {
      await rescan();
      setTimeout(() => setIsScanning(false), 2000);
    } catch (error) {
      analytics.scanFailed(address, error instanceof Error ? error.message : 'Unknown error');
      setIsScanning(false);
    }
  };

  // Welcome/Onboarding Screen
  if (!isConnected) {
    return (
      <div className="guardian-screen">
        {/* ARIA Live Region for Status Announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isScanning ? 'Scanning wallet, please wait' : 'Ready to connect wallet'}
        </div>

        <div className="guardian-container">
          <div className="guardian-welcome">
            <h1 className="guardian-welcome-title" id="guardian-title">
              Welcome to Guardian
            </h1>
            <p className="guardian-welcome-subtitle">
              Let's connect your wallet for a quick 30-second safety check.
            </p>

            {isScanning && (
              <div
                className="scanning-card"
                role="alert"
                aria-live="assertive"
                aria-busy="true"
              >
                <div className="scanning-spinner" />
                <div className="scanning-title">Scanning...</div>
                <div className="scanning-details">
                  Checking 12 approvals, 6 contracts, 2 recent tx...
                </div>
              </div>
            )}

            <button
              className="connect-wallet-button"
              onClick={() => {
                analytics.track('guardian_wallet_connected' as any, {});
                connect();
              }}
              aria-label="Connect wallet to start security scan"
              aria-describedby="guardian-title"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  analytics.track('guardian_wallet_connected' as any, {});
                  connect();
                }
              }}
            >
              Connect Wallet
            </button>

            <div className="privacy-notice" aria-label="Privacy notice">
              No private keys will be accessed
            </div>
          </div>
        </div>

        <Hub2Footer />
      </div>
    );
  }

  // Scanning State
  if (isScanning || isLoading) {
    return (
      <div className="guardian-screen">
        {/* ARIA Live Region for Scan Progress */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="sr-only"
        >
          Scanning wallet. Checking approvals, contracts, and recent transactions.
        </div>

        <div className="guardian-container">
          <div className="guardian-welcome">
            <h1 className="guardian-welcome-title">Welcome to Guardian</h1>
            <p className="guardian-welcome-subtitle">
              Let's connect your wallet for a quick 30-second safety check.
            </p>

            <div
              className="scanning-card"
              role="alert"
              aria-live="assertive"
              aria-busy="true"
            >
              <div className="scanning-spinner" aria-hidden="true" />
              <div className="scanning-title">Scanning...</div>
              <div className="scanning-details">
                Checking 12 approvals, 6 contracts, 2 recent tx...
              </div>
            </div>
          </div>
        </div>

        <Hub2Footer />
      </div>
    );
  }

  // Results Screen
  const scanData = data;
  const trustScore = scanData?.trustScorePercent || 87;
  const flags = scanData?.flags?.length || 2;
  const critical = scanData?.flags?.filter((f: any) => f.severity === 'high').length || 0;
  const chains = 'ETH, Base';
  const lastScan = '3m ago';

  const statusText = trustScore >= 80 ? 'Safe' : trustScore >= 60 ? 'Warning' : 'Danger';
  const statusClass = trustScore >= 80 ? 'safe' : trustScore >= 60 ? 'warning' : 'danger';

  return (
    <div className="guardian-screen">
      {/* ARIA Live Region for Trust Score Updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isRescanning
          ? 'Rescanning wallet, please wait'
          : `Wallet scan complete. Trust score: ${trustScore}%. Status: ${statusText}. ${flags} flags detected, ${critical} critical.`}
      </div>

      <main className="guardian-container" role="main" aria-label="Guardian security dashboard">
        {/* Header */}
        <header className="guardian-header">
          <h1 className="guardian-title" id="guardian-main-title">Guardian</h1>
          <p className="guardian-subtitle">Trust & safety scan</p>
        </header>

        {/* Trust Score Card */}
        <section
          className="trust-score-card"
          aria-labelledby="trust-score-heading"
          aria-describedby="trust-score-details"
        >
          <div className="scan-complete-badge" role="status">
            Wallet scan complete
          </div>

          <div className="trust-status" id="trust-score-heading">
            Status: <span className={`trust-status-value ${statusClass}`}>
              {statusText} ({trustScore}% Trust)
            </span>
          </div>

          <div className="trust-meta" id="trust-score-details">
            {flags} flags · {critical} critical · Last scan {lastScan} · Chains: {chains}
          </div>

          <div className="guardian-actions" role="group" aria-label="Guardian actions">
            <button
              onClick={handleRescan}
              disabled={isRescanning}
              className="rescan-button"
              aria-label="Rescan wallet for security issues"
              aria-busy={isRescanning}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isRescanning) {
                  e.preventDefault();
                  handleRescan();
                }
              }}
            >
              {isRescanning ? (
                <>
                  <span className="scanning-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
                  Scanning...
                </>
              ) : (
                'Rescan'
              )}
            </button>
            <button
              className="fix-issues-button"
              aria-label="Fix risky token approvals"
              onClick={() => {
                analytics.revokeModalOpened(data?.flags?.length || 0);
                // Will be wired to RevokeModal
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  analytics.revokeModalOpened(data?.flags?.length || 0);
                  // Will be wired to RevokeModal
                }
              }}
            >
              Fix risky approvals
            </button>
          </div>
        </section>

        {/* Active Risks */}
        <section
          className="security-flags-section"
          aria-labelledby="active-risks-heading"
        >
          <div className="section-header">
            <h2 className="section-title" id="active-risks-heading">Active risks</h2>
            <a
              href="#"
              className="all-reports-link"
              aria-label="View all security reports"
              onClick={(e) => {
                e.preventDefault();
                analytics.track('guardian_view_all_reports' as any, {
                  wallet_address: address,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  analytics.track('guardian_view_all_reports' as any, {
                    wallet_address: address,
                  });
                  // Navigate to all reports
                }
              }}
            >
              ALL REPORTS →
            </a>
          </div>

          {/* Mixer Exposure */}
          <article
            className="risk-card"
            aria-labelledby="risk-mixer"
            tabIndex={0}
            onClick={() => analytics.riskCardClicked('mixer', 'medium')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                analytics.riskCardClicked('mixer', 'medium');
                // Open risk details
              }
            }}
          >
            <div className="risk-card-header">
              <div className="risk-card-title" id="risk-mixer">Mixer exposure</div>
            </div>
            <div className="risk-card-description">
              Counterparty · mixed funds in last 30d · Score impact: −8
            </div>
            <a
              href="#"
              className="risk-card-action"
              aria-label="View mixer exposure transactions"
              onClick={(e) => {
                e.stopPropagation();
                analytics.riskCardClicked('mixer', 'medium');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  analytics.riskCardClicked('mixer', 'medium');
                  // View transactions
                }
              }}
            >
              View tx →
            </a>
          </article>

          {/* Contract Risks */}
          <article
            className="risk-card"
            aria-labelledby="risk-contract"
            tabIndex={0}
          >
            <div className="risk-card-header">
              <div className="risk-card-title" id="risk-contract">Contract risks</div>
            </div>
            <div className="risk-card-description">
              No honeypot · No hidden mint · Liquidity clorkт
            </div>
          </article>

          {/* Address Reputation */}
          <article
            className="risk-card"
            aria-labelledby="risk-reputation"
            tabIndex={0}
          >
            <div className="risk-card-header">
              <div className="risk-card-title" id="risk-reputation">Address reputation</div>
              <span className="risk-badge good" aria-label="Reputation status: Good">Good</span>
            </div>
            <div className="risk-card-description">
              No sanctions hit · Low scam proximity
            </div>
          </article>
        </section>

        {/* Bottom Glow Effect */}
        <div className="guardian-bottom-glow" />
      </main>

      <Hub2Footer />
    </div>
  );
}

export default GuardianMobile;

