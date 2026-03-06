import { Link } from 'react-router-dom';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';
import { Button } from '@/components/ui/button';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const percent = (value: number) => `${value.toFixed(1)}%`;

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function Positions() {
  const {
    snapshot,
    totalValue,
    dailyDelta,
    overallRiskScore,
    trustIndex,
    walletScopeLabel,
    approvals,
    highRiskApprovals,
    actions,
    topPositions,
    isDemo,
    isLoading,
    invalidateAll,
  } = usePortfolioRouteData();

  const positions = snapshot?.positions ?? [];

  return (
    <PortfolioExperienceShell
      title="Positions"
      subtitle="A cleaner read on every live holding in the selected wallet scope, with value, concentration, and protocol context."
      badge="Holdings view"
      guideContext={{
        screenLabel: 'Positions',
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
        <Button
          variant="outline"
          onClick={() => void invalidateAll()}
          className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
      aside={
        <>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Composition</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-sm text-[#9c978f]">Positions</span>
                <span className="text-xl text-[#f6f2ea]">{positions.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-sm text-[#9c978f]">Largest holding</span>
                <span className="text-sm text-[#f6f2ea]">{topPositions[0]?.symbol ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9c978f]">Daily move</span>
                <span className={`text-sm ${dailyDelta >= 0 ? 'text-[#8ec5a2]' : 'text-[#d98f8f]'}`}>
                  {currency(dailyDelta)}
                </span>
              </div>
            </div>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Risk context</p>
            <p
              className="mt-4 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              {(overallRiskScore * 10).toFixed(1)}/10
            </p>
            <p className="mt-2 text-sm text-[#9c978f]">
              Position concentration and approvals should be reviewed together when the score starts rising.
            </p>
            <Link
              to="/portfolio/risk"
              className="mt-5 inline-flex items-center gap-2 text-sm text-[#a7c0ff]"
            >
              <ShieldAlert className="h-4 w-4" />
              Open risk view
            </Link>
          </section>
        </>
      }
    >
      <section className={`${surfaceClass} overflow-hidden`}>
        <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-white/8 px-6 py-4 text-[11px] uppercase tracking-[0.24em] text-[#8f8a82] md:grid">
          <span>Asset</span>
          <span>Protocol</span>
          <span>Chain</span>
          <span>Value</span>
        </div>

        <div className="divide-y divide-white/8">
          {isLoading ? (
            <div className="px-6 py-8 text-sm text-[#8f8a82]">Loading positions</div>
          ) : positions.length ? (
            positions.map((position) => {
              const concentration = totalValue > 0 ? (position.valueUsd / totalValue) * 100 : 0;

              return (
                <div key={position.id} className="px-6 py-5 text-sm">
                  <div className="space-y-4 md:hidden">
                    <div>
                      <p className="text-lg text-[#f6f2ea]">{position.symbol}</p>
                      <p className="mt-1 text-xs text-[#8f8a82]">{position.token}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.16em] text-[#8f8a82]">
                      <div>
                        <p>Protocol</p>
                        <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{position.protocol || 'Direct holding'}</p>
                      </div>
                      <div>
                        <p>Chain</p>
                        <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{position.chainId}</p>
                      </div>
                      <div>
                        <p>Value</p>
                        <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{currency(position.valueUsd)}</p>
                      </div>
                      <div>
                        <p>Weight</p>
                        <p className="mt-1 text-sm tracking-normal text-[#f6f2ea]">{percent(concentration)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] items-start gap-4 md:grid">
                    <div>
                      <p className="text-[#f6f2ea]">{position.symbol}</p>
                      <p className="mt-1 text-xs text-[#8f8a82]">{position.token}</p>
                    </div>
                    <div className="text-[#f6f2ea]">{position.protocol || 'Direct holding'}</div>
                    <div className="text-[#f6f2ea]">{position.chainId}</div>
                    <div className="text-right">
                      <p className="text-[#f6f2ea]">{currency(position.valueUsd)}</p>
                      <p className="mt-1 text-xs text-[#8f8a82]">{percent(concentration)} of scope</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-sm text-[#8f8a82]">
              {isDemo ? 'Demo mode has no live positions for this view yet.' : 'No live positions returned for this wallet scope.'}
            </div>
          )}
        </div>
      </section>
    </PortfolioExperienceShell>
  );
}
