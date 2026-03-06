import { CheckCircle2, RefreshCw, Shield } from 'lucide-react';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';
import { Button } from '@/components/ui/button';

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function Guardian() {
  const {
    actions,
    approvals,
    trustIndex,
    freshness,
    totalValue,
    walletScopeLabel,
    overallRiskScore,
    topPositions,
    snapshot,
    isDemo,
    isLoading,
    invalidateAll,
  } = usePortfolioRouteData();

  return (
    <PortfolioExperienceShell
      title="Guardian"
      subtitle={
        isDemo
          ? 'Guardian is using demo portfolio data because demo mode is active.'
          : 'Live trust posture derived from current approvals and portfolio risk.'
      }
      badge="Portfolio security"
      guideContext={{
        screenLabel: 'Guardian',
        walletScopeLabel,
        totalValue,
        dailyDelta: snapshot?.delta24h ?? 0,
        overallRiskScore,
        trustIndex,
        approvalsCount: approvals.length,
        highRiskApprovals: approvals.filter((approval) => approval.severity === 'critical' || approval.severity === 'high').length,
        actionTitles: actions.map((action) => action.title),
        topPositions: topPositions.map((position) => ({ token: position.token, valueUsd: position.valueUsd })),
        isDemo,
      }}
      guideLabel="Ask Portfolio AI"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => void invalidateAll()}
            className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Rescan
          </Button>
        </>
      }
      aside={
        <>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Portfolio confidence</p>
            <p
              className="mt-4 text-4xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              {trustIndex}%
            </p>
            <p className="mt-3 text-sm leading-6 text-[#9c978f]">
              Trust index blends Guardian findings with overall portfolio quality.
            </p>
          </section>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Live state</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#9c978f]">Portfolio value</p>
                <p className="mt-2 text-2xl text-[#f6f2ea]">${Math.round(totalValue).toLocaleString()}</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#9c978f]">Freshness</p>
                <p className="mt-2 text-2xl text-[#f6f2ea]">{Math.round(freshness.confidence * 100)}%</p>
              </div>
            </div>
          </section>
        </>
      }
    >
      <section className={`${surfaceClass} p-6`}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Current reading</p>
            <p
              className="mt-4 text-5xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              {trustIndex}%
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9c978f]">
              Guardian reads the portfolio as calm when trust stays high and the flag list stays short, explainable, and current.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 text-center">
            <Shield className="mx-auto h-7 w-7 text-[#a7c0ff]" />
            <p className="mt-3 text-sm text-[#9c978f]">Flags detected</p>
            <p className="mt-2 text-3xl text-[#f6f2ea]">{approvals.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className={`${surfaceClass} p-6`}>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Signals</p>
          <div className="mt-6 space-y-3">
            {approvals.length ? (
              approvals.slice(0, 8).map((approval) => (
                <div key={approval.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg text-[#f6f2ea]">{approval.token}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-[#8f8a82]">{approval.severity}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#9c978f]">
                    {approval.riskReasons?.[0] ?? 'Approval should be reviewed.'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-8 text-sm text-[#9c978f]">
                No active flags. Guardian is not seeing any elevated findings right now.
              </div>
            )}
          </div>
        </article>

        <article className={`${surfaceClass} p-6`}>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Status</p>
          <div className="mt-6 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.18),rgba(255,255,255,0.02))] p-5">
            <CheckCircle2 className="h-6 w-6 text-[#a7c0ff]" />
            <p
              className="mt-4 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              {isLoading ? 'Scanning...' : 'Reading complete'}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#9c978f]">
              Last updated {snapshot?.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleString() : 'not yet'}.
            </p>
          </div>
        </article>
      </section>

      <section className={`${surfaceClass} p-6`}>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Recommended actions</p>
        <div className="mt-6 space-y-3">
          {actions.length ? (
            actions.slice(0, 4).map((action) => (
              <div key={action.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#f6f2ea]">{action.title}</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#8f8a82]">{action.severity}</span>
                </div>
                <p className="mt-2 text-sm text-[#9c978f]">{action.why?.[0] ?? 'Review this recommendation.'}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#9c978f]">
              No current Guardian actions.
            </div>
          )}
        </div>
      </section>
    </PortfolioExperienceShell>
  );
}
