import { Link } from 'react-router-dom';
import { Activity, RefreshCw } from 'lucide-react';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { StressTestTab } from '@/components/portfolio/tabs/StressTestTab';
import { Button } from '@/components/ui/button';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function Stress() {
  const {
    walletScopeLabel,
    walletScope,
    freshness,
    totalValue,
    overallRiskScore,
    trustIndex,
    approvals,
    actions,
    isDemo,
    isLoading,
    invalidateAll,
  } = usePortfolioRouteData();

  return (
    <PortfolioExperienceShell
      title="Stress lab"
      subtitle={
        isDemo
          ? 'Stress lab is using demo portfolio data because demo mode is active.'
          : 'Run downside scenarios against the current live wallet scope.'
      }
      badge="Scenario testing"
      guideContext={{
        screenLabel: 'Stress Lab',
        walletScopeLabel,
        totalValue,
        dailyDelta: 0,
        overallRiskScore,
        trustIndex,
        approvalsCount: approvals.length,
        highRiskApprovals: approvals.filter((approval) => approval.severity === 'critical' || approval.severity === 'high').length,
        actionTitles: actions.map((action) => action.title),
        topPositions: [],
        isDemo,
      }}
      guideLabel="Ask Stress AI"
      actions={
        <Button
          onClick={() => void invalidateAll()}
          className="rounded-full bg-[#f6f2ea] px-5 text-black hover:bg-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh portfolio inputs
        </Button>
      }
      aside={
        <>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Portfolio baseline</p>
            <p
              className="mt-4 text-4xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              ${Math.round(totalValue).toLocaleString()}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#9c978f]">
              Current value before applying the scenario sequence.
            </p>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Live inputs</p>
            <p
              className="mt-4 text-2xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              Scenario context
            </p>
            <p className="mt-3 text-sm leading-6 text-[#9c978f]">
              {approvals.length} approvals and {actions.length} recommended actions are loaded into the current wallet scope.
            </p>
            <Link to="/portfolio/results" className="mt-5 inline-flex items-center gap-2 text-sm text-[#a7c0ff]">
              Open report page
            </Link>
          </section>
        </>
      }
    >
      <section className={`${surfaceClass} p-6`}>
        <div className="mb-5 flex items-center gap-3">
          <Activity className="h-5 w-5 text-[#a7c0ff]" />
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Live stress model</p>
        </div>
        <StressTestTab
          walletScope={walletScope}
          freshness={freshness}
          portfolioValue={totalValue}
          isLoading={isLoading}
        />
      </section>
    </PortfolioExperienceShell>
  );
}
