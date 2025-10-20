import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Hub2BottomNav from '@/components/hub2/Hub2BottomNav';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  RefreshCw,
  Shield
} from 'lucide-react';
import '@/styles/guardian-theme.css';

// Mock data for Guardian scan results
const mockScanData = {
  trustScore: 87,
  status: 'Safe',
  flagCount: 2,
  criticalCount: 0,
  lastScan: '3m ago',
  chains: 'ETH, Base'
};

const activeRisks = [
  {
    id: 'mixer',
    title: 'Mixer exposure',
    description: 'Counterparty mixed funds in last 30d • Score impact: −8',
    severity: 'medium',
    action: 'View tx →'
  },
  {
    id: 'contracts',
    title: 'Contract risks',
    description: 'No honeypot • No hidden mint • Liquidity locked 180d',
    severity: 'low',
    action: 'OK'
  },
  {
    id: 'approvals',
    title: 'Unlimited approvals (2)',
    description: 'USDT @ xyz-swap • WETH @ old router',
    severity: 'medium',
    action: 'Revoke all'
  },
  {
    id: 'reputation',
    title: 'Address reputation',
    description: 'No sanctions hit • Low scam proximity',
    severity: 'low',
    action: 'Good'
  }
];

export default function Guardian() {
  const [isScanning, setIsScanning] = useState(false);

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  const handleFixApprovals = () => {
    console.log('Fix risky approvals');
  };

  return (
    <div className="guardian-screen">
      <main className="guardian-container">
        {/* Header */}
        <motion.header
          className="guardian-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="guardian-title">Guardian</h1>
          <p className="guardian-subtitle">Trust & safety scan</p>
        </motion.header>

        {/* Trust Score Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="trust-score-card">
            <div className="trust-score-header">
              <div className="trust-index-label">Trust Index</div>
              <div className="trust-score-value">{mockScanData.trustScore}%</div>
              <div className="trust-status-badge">{mockScanData.status}</div>
            </div>

            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <div className="wallet-info-label">Flags</div>
                <div className="wallet-info-value">{mockScanData.flagCount} total</div>
                <div className="wallet-info-meta">{mockScanData.criticalCount} critical</div>
              </div>
              <div className="wallet-info-item">
                <div className="wallet-info-label">Last Scan</div>
                <div className="wallet-info-value">{mockScanData.lastScan}</div>
                <div className="wallet-info-meta">Auto-refresh enabled</div>
              </div>
              <div className="wallet-info-item">
                <div className="wallet-info-label">Chains</div>
                <div className="wallet-info-value">{mockScanData.chains}</div>
                <div className="wallet-info-meta">Multi-chain scan</div>
              </div>
            </div>

            <div className="guardian-actions">
              <button
                onClick={handleRescan}
                disabled={isScanning}
                className="rescan-button"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rescan Wallet
                  </>
                )}
              </button>
              <button
                onClick={handleFixApprovals}
                className="fix-issues-button"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Fix Risky Approvals
              </button>
            </div>
          </div>
        </motion.section>

        {/* Security Flags Section */}
        <motion.section
          className="security-flags-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title">Active risks</h2>
            <Button
              variant="ghost"
              className="all-opportunities-btn"
            >
              ALL REPORTS
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="active-quests-grid">
            {activeRisks.slice(0, 2).map((risk, index) => (
              <motion.div
                key={risk.id}
                className={`security-flag-card flag-${risk.severity}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flag-content">
                  <div className="flag-info">
                    <div className="flag-title">{risk.title}</div>
                    <div className="flag-description">{risk.description}</div>
                    <span className={`flag-severity severity-${risk.severity}`}>
                      {risk.severity} severity
                    </span>
                  </div>
                  <div className="flag-actions">
                    <button className="flag-action-button">
                      {risk.action}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="active-quests-grid" style={{ marginTop: '16px' }}>
            {activeRisks.slice(2, 4).map((risk, index) => (
              <motion.div
                key={risk.id}
                className={`security-flag-card flag-${risk.severity}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flag-content">
                  <div className="flag-info">
                    <div className="flag-title">{risk.title}</div>
                    <div className="flag-description">{risk.description}</div>
                    <span className={`flag-severity severity-${risk.severity}`}>
                      {risk.severity} severity
                    </span>
                  </div>
                  <div className="flag-actions">
                    <button className="flag-action-button">
                      {risk.action}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <Hub2BottomNav />
    </div>
  );
}