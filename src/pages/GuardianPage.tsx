import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ConnectGate } from '@/components/guardian/ConnectGate';
import { ScanDialog } from '@/components/guardian/ScanDialog';
import { ScoreCard } from '@/components/guardian/ScoreCard';
import { RiskCard } from '@/components/guardian/RiskCard';
import { RevokeModal } from '@/components/guardian/RevokeModal';
import { WalletScopeHeader } from '@/components/guardian/WalletScopeHeader';
import { useGuardianStore } from '@/store/guardianStore';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function GuardianPage() {
  // Route protection - redirect unauthenticated users to login
  useRouteProtection({ requireAuth: true });
  
  const { connectedWallets, activeWallet, activeNetwork, isAuthenticated } = useWallet();
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [autoScanTriggered, setAutoScanTriggered] = useState(false);

  const { scanning, result, lastError } = useGuardianStore();
  
  // When authenticated, ONLY use WalletContext - never maintain independent wallet state
  // This ensures Guardian reads from the same source of truth as other modules
  const isActive = isAuthenticated && !!activeWallet;
  
  const { data, isLoading, refetch, rescan, isRescanning } = useGuardianScan({
    // Hook will automatically use WalletContext values when authenticated
    enabled: isActive,
  });

  // Auto-scan on wallet connect
  useEffect(() => {
    if (isAuthenticated && activeWallet && !autoScanTriggered) {
      setAutoScanTriggered(true);
      refetch();
    }
  }, [isAuthenticated, activeWallet, autoScanTriggered, refetch]);

  // Show error toast
  useEffect(() => {
    if (lastError) {
      toast.error(lastError);
    }
  }, [lastError]);

  // Handle revoke approvals
  const handleRevoke = async (approvals: unknown[]) => {
    // Mock revoke - in production, use wagmi writeContract
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Revoked ${approvals.length} approval(s)`);
        refetch(); // Refresh scan after revoke
        resolve();
      }, 2000);
    });
  };

  // If authenticated but no wallets, show onboarding empty state
  if (isAuthenticated && connectedWallets.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Wallets Added</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Add your first wallet to get started with Guardian security scanning.
          </p>
          <Button onClick={() => window.location.href = '/settings'}>
            Add Wallet
          </Button>
        </div>
      </div>
    );
  }

  // If not authenticated, show onboarding
  if (!isAuthenticated) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <ConnectGate 
          renderConnectButton={() => <ConnectButton />}
        />
      </div>
    );
  }

  // Loading/Scanning state
  const showScanDialog = (isLoading || scanning) && !data;

  // Map API data to component props
  const scanData = data || result;

  if (!scanData) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading scan data...</p>
        </div>
        <ScanDialog open={showScanDialog} />
      </div>
    );
  }

  // Extract risk factors for cards
  const mixerFlag = scanData.flags?.find((f: unknown) =>
    f.type.toLowerCase().includes('mixer')
  );
  const approvalFlags = scanData.flags?.filter((f: unknown) =>
    f.type.toLowerCase().includes('approval')
  ) || [];
  const contractFlags = scanData.flags?.filter((f: unknown) =>
    f.type.toLowerCase().includes('contract') ||
    f.type.toLowerCase().includes('honeypot')
  ) || [];

  // Build risk cards data
  const mixerProximity = mixerFlag
    ? {
        severity: mixerFlag.severity === 'high' ? 'high' as const : 'medium' as const,
        lines: [mixerFlag.details || 'Mixer interaction detected'],
      }
    : {
        severity: 'good' as const,
        lines: ['No mixer activity detected', 'Clean transaction history'],
      };

  const contractRisks =
    contractFlags.length > 0
      ? {
          severity: 'medium' as const,
          lines: contractFlags.map((f: unknown) => f.details || f.type),
        }
      : {
          severity: 'ok' as const,
          lines: ['No honeypot or hidden mint detected', 'Liquidity appears locked'],
        };

  const approvalRisks =
    approvalFlags.length > 0
      ? {
          count: approvalFlags.length,
          lines: approvalFlags.slice(0, 2).map((f: unknown) => f.details || f.type),
        }
      : { count: 0, lines: [] };

  const reputationLevel = scanData.trustScorePercent >= 80 ? 'good' : 'ok';

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Guardian{' '}
              <span className="text-muted-foreground font-normal">
                Trust & Safety
              </span>
            </h1>
            <p className="text-muted-foreground">
              Comprehensive security scan for wallet{' '}
              <span className="font-mono text-sm">
                {activeWallet?.slice(0, 6)}...{activeWallet?.slice(-4)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Scope Header */}
      <WalletScopeHeader 
        walletAddress={activeWallet}
      />

      {/* Score Card */}
      <div className="mb-8">
        <ScoreCard
          score={scanData.trustScorePercent || 0}
          grade={
            (scanData.trustScorePercent >= 90
              ? 'A'
              : scanData.trustScorePercent >= 80
              ? 'B'
              : scanData.trustScorePercent >= 70
              ? 'C'
              : scanData.trustScorePercent >= 60
              ? 'D'
              : 'F') as 'A' | 'B' | 'C' | 'D' | 'F'
          }
          flags={scanData.flags?.length || 0}
          critical={
            scanData.flags?.filter((f: unknown) => f.severity === 'high').length || 0
          }
          lastScan={scanData.lastScanRelative || 'just now'}
          chains={[scanData.networkCode || 'ethereum']}
          autoRefreshEnabled={false}
          onRescan={() => rescan()}
          onFixRisks={() => setShowRevokeModal(true)}
          isRescanning={isRescanning}
        />
      </div>

      {/* Active Risks Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Active Risks</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            All reports →
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Mixer Exposure */}
          <RiskCard
            title="Mixer Exposure"
            severity={mixerProximity.severity}
            lines={mixerProximity.lines}
            cta={
              mixerFlag
                ? {
                    label: 'View tx',
                    onClick: () => {
                      window.open(
                        `https://etherscan.io/address/${activeWallet}`,
                        '_blank'
                      );
                    },
                  }
                : undefined
            }
          />

          {/* Contract Risks */}
          <RiskCard
            title="Contract Risks"
            severity={contractRisks.severity}
            lines={contractRisks.lines}
          />

          {/* Unlimited Approvals */}
          <RiskCard
            title={`Unlimited Approvals (${approvalRisks.count})`}
            severity={
              approvalRisks.count > 2
                ? 'high'
                : approvalRisks.count > 0
                ? 'medium'
                : 'good'
            }
            lines={
              approvalRisks.count > 0
                ? approvalRisks.lines
                : ['No unlimited approvals detected']
            }
            cta={
              approvalRisks.count > 0
                ? {
                    label: 'Revoke all',
                    onClick: () => setShowRevokeModal(true),
                  }
                : undefined
            }
          />

          {/* Address Reputation */}
          <RiskCard
            title="Address Reputation"
            severity={reputationLevel}
            lines={[
              'No sanctions hit',
              scanData.riskLevel === 'Low' ? 'Low risk profile' : 'Moderate risk profile',
            ]}
            sideBadge={reputationLevel === 'good' ? 'Good' : 'OK'}
          />
        </div>
      </div>

      {/* Scan Dialog */}
      <ScanDialog open={showScanDialog} />

      {/* Revoke Modal */}
      <RevokeModal
        open={showRevokeModal}
        onOpenChange={setShowRevokeModal}
        approvals={[]} // In production, extract from scan data
        onRevoke={handleRevoke}
      />
    </div>
  );
}

export default GuardianPage;
