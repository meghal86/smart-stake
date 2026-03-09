import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';
import { Button } from '@/components/ui/button';

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function Addresses() {
  const {
    addresses,
    addressesLoading,
    refetchAddresses,
    walletScopeLabel,
    totalValue,
    dailyDelta,
    overallRiskScore,
    trustIndex,
    approvals,
    highRiskApprovals,
    actions,
    topPositions,
    isDemo,
  } = usePortfolioRouteData();

  return (
    <PortfolioExperienceShell
      title="Addresses"
      subtitle="The live wallet roster that powers portfolio totals, trust readings, and scenario coverage."
      badge="Address registry"
      guideContext={{
        screenLabel: 'Addresses',
        walletScopeLabel,
        totalValue,
        dailyDelta,
        overallRiskScore,
        trustIndex,
        approvalsCount: approvals.length,
        highRiskApprovals,
        actionTitles: actions.map((action) => action.title),
        topPositions: topPositions.map((position) => ({ token: position.token, valueUsd: position.valueUsd })),
        isDemo,
      }}
      guideLabel="Ask Portfolio AI"
      actions={
        <>
          <Link to="/settings/wallets">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Manage addresses
            </Button>
          </Link>
          <Button className="rounded-full bg-[#f6f2ea] px-5 text-black hover:bg-white" onClick={() => void refetchAddresses()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh addresses
          </Button>
        </>
      }
    >
      <section className={`${surfaceClass} p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Registry notes</p>
            <p className="mt-2 text-sm leading-6 text-[#9c978f]">
              Wallets are managed from Wallet Settings. This roster only shows sanitized live addresses that feed portfolio totals.
            </p>
          </div>
          <Link to="/settings/wallets" className="text-sm text-[#a7c0ff]">
            Open wallet settings
          </Link>
        </div>
      </section>

      <section className={`${surfaceClass} overflow-hidden`}>
        <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr] gap-4 border-b border-white/8 px-6 py-4 text-[11px] uppercase tracking-[0.24em] text-[#8f8a82] md:grid">
          <span>Wallet</span>
          <span>Label</span>
          <span>Group</span>
        </div>
        <div className="divide-y divide-white/8">
          {addressesLoading ? (
            <div className="px-6 py-8 text-sm text-[#8f8a82]">Loading addresses</div>
          ) : addresses.length ? (
            addresses.map((row) => (
              <div key={row.id} className="px-6 py-5 text-sm">
                <div className="space-y-3 md:hidden">
                  <div>
                    <p className="text-[#f6f2ea]">{row.address}</p>
                    <p className="mt-1 text-xs text-[#8f8a82]">{row.label || 'Unlabeled wallet'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.16em] text-[#8f8a82]">
                    <div>
                      <p>Label</p>
                      <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{row.label || 'None'}</p>
                    </div>
                    <div>
                      <p>Group</p>
                      <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{row.group || 'Default'}</p>
                    </div>
                  </div>
                </div>

                <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr] gap-4 md:grid">
                  <div>
                    <p className="text-[#f6f2ea]">{row.address}</p>
                    <p className="mt-1 text-xs text-[#8f8a82]">Live portfolio address</p>
                  </div>
                  <div className="text-[#f6f2ea]">{row.label || 'Unlabeled wallet'}</div>
                  <div className="text-[#f6f2ea]">{row.group || 'Default'}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-sm text-[#8f8a82]">
              No addresses added yet. Open wallet settings to connect the first wallet.
            </div>
          )}
        </div>
      </section>
    </PortfolioExperienceShell>
  );
}
