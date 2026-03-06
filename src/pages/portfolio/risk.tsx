import { Link } from 'react-router-dom';
import { ArrowUpRight, Droplets, Link2, Target } from 'lucide-react';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

const factorsMeta = [
  {
    key: 'liquidity',
    label: 'Liquidity',
    description: 'How quickly positions can exit without harming price.',
    icon: Droplets,
  },
  {
    key: 'concentration',
    label: 'Concentration',
    description: 'How much portfolio weight is concentrated in a few assets.',
    icon: Target,
  },
  {
    key: 'correlation',
    label: 'Correlation',
    description: 'How likely holdings are to move together under pressure.',
    icon: Link2,
  },
] as const;

export default function Risk() {
  const { snapshot, approvals, totalValue, trustIndex, overallRiskScore, chainExposure, topPositions, walletScopeLabel, isDemo, isLoading } =
    usePortfolioRouteData();

  const positions = snapshot?.positions ?? [];
  const liquidValue = positions
    .filter((position) => position.category === 'token' || position.category === 'lp')
    .reduce((sum, position) => sum + position.valueUsd, 0);
  const topThreeValue = [...positions]
    .sort((left, right) => right.valueUsd - left.valueUsd)
    .slice(0, 3)
    .reduce((sum, position) => sum + position.valueUsd, 0);
  const largestChainValue = chainExposure[0]?.value ?? 0;

  const factorRows = factorsMeta.map((item) => {
    if (item.key === 'liquidity') {
      return {
        ...item,
        value: totalValue > 0 ? (liquidValue / totalValue) * 10 : 0,
      };
    }

    if (item.key === 'concentration') {
      return {
        ...item,
        value: totalValue > 0 ? (topThreeValue / totalValue) * 10 : 0,
      };
    }

    return {
      ...item,
      value: totalValue > 0 ? (largestChainValue / totalValue) * 10 : 0,
    };
  });

  return (
    <PortfolioExperienceShell
      title="Risk posture"
      subtitle={
        isDemo
          ? 'Risk posture is using demo portfolio data because demo mode is active.'
          : 'A live read on concentration, liquidity, and correlation across the current wallet scope.'
      }
      badge="Risk analysis"
      guideContext={{
        screenLabel: 'Risk',
        walletScopeLabel,
        totalValue,
        dailyDelta: snapshot?.delta24h ?? 0,
        overallRiskScore,
        trustIndex,
        approvalsCount: approvals.length,
        highRiskApprovals: approvals.filter((approval) => approval.severity === 'critical' || approval.severity === 'high').length,
        actionTitles: ['Pressure-test the downside.'],
        topPositions: topPositions.map((position) => ({ token: position.token, valueUsd: position.valueUsd })),
        isDemo,
      }}
      guideLabel="Ask Risk AI"
      aside={
        <>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Summary</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-[#9c978f]">Overall risk</p>
                <p className="mt-2 text-4xl text-[#f6f2ea]">{(overallRiskScore * 10).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-[#9c978f]">Trust index</p>
                <p className="mt-2 text-2xl text-[#f6f2ea]">{trustIndex}%</p>
              </div>
            </div>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Recommended next step</p>
            <p
              className="mt-4 text-2xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              Pressure-test the downside.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#9c978f]">
              A risk score without a scenario is incomplete. Run a stress sequence against the current portfolio mix.
            </p>
            <Link to="/portfolio/stress" className="mt-5 inline-flex items-center gap-2 text-sm text-[#a7c0ff]">
              Open stress lab
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
        </>
      }
    >
      <section className={`${surfaceClass} p-6`}>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Exposure by chain</p>
        <div className="mt-6 space-y-3">
          {chainExposure.length > 0 ? (
            chainExposure.slice(0, 6).map((row) => (
              <div key={row.chain} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#f6f2ea]">{row.chain}</p>
                  <p className="text-sm text-[#f6f2ea]">${Math.round(row.value).toLocaleString()}</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#7ea3f2]"
                    style={{ width: `${Math.min(100, totalValue > 0 ? (row.value / totalValue) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-[120px] items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.03] text-sm text-[#8f8a82]">
              {isLoading ? 'Loading exposure' : 'Exposure unavailable'}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {factorRows.map((factor) => {
          const Icon = factor.icon;
          return (
            <article key={factor.key} className={`${surfaceClass} p-5`}>
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <Icon className="h-5 w-5 text-[#a7c0ff]" />
                </div>
                <p className="text-3xl text-[#f6f2ea]">{factor.value.toFixed(1)}</p>
              </div>
              <p
                className="mt-5 text-2xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {factor.label}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#9c978f]">{factor.description}</p>
              <div className="mt-5 h-1.5 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[#7ea3f2]" style={{ width: `${Math.min(100, factor.value * 10)}%` }} />
              </div>
            </article>
          );
        })}
      </section>

      <section className={`${surfaceClass} p-6`}>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Top approval risks</p>
        <div className="mt-6 space-y-3">
          {approvals.length > 0 ? (
            approvals.slice(0, 5).map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div>
                  <p className="text-sm text-[#f6f2ea]">{approval.token}</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">{approval.severity} • {approval.riskReasons?.[0] ?? 'Review approval'}</p>
                </div>
                <p className="text-sm text-[#f6f2ea]">${Math.round(approval.valueAtRisk).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#8f8a82]">
              No approval risks returned for this scope.
            </div>
          )}
        </div>
      </section>
    </PortfolioExperienceShell>
  );
}
