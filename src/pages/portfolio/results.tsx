import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PortfolioExperienceShell } from '@/components/portfolio/PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export default function Results() {
  const {
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
      title="Stress report"
      subtitle="A dedicated readout of the latest scenario output."
      badge="Scenario output"
      guideContext={{
        screenLabel: 'Stress Report',
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
        <Link
          to="/portfolio/stress"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-[#f6f2ea] transition-colors hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to stress lab
        </Link>
      }
    >
      <section className={`${surfaceClass} p-10 text-center`}>
        <p
          className="text-3xl text-[#f6f2ea]"
          style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
        >
          Stress reports are now generated inside the live Stress lab.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#9c978f]">
          This route no longer renders placeholder scenario output. Use the Stress lab to run a live scenario against the current wallet scope.
        </p>
      </section>
    </PortfolioExperienceShell>
  );
}
