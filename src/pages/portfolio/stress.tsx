import React, { useEffect } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { StressTest } from '@/components/portfolio/StressTest';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useStress } from '@/hooks/portfolio/useStress';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';

export default function Stress() {
  const { data: summary } = usePortfolioSummary();
  const { params, setParams, run, isRunning } = useStress();
  const { mode } = useUIMode() || { mode: 'novice' };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  const handleStressTest = async (scenarios: any) => {
    setParams(scenarios);
    return await run(scenarios);
  };

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <PortfolioLayout>
          <div style={{ 
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            <div className="space-y-6">
              <PortfolioHeader summary={summary} />
              
              <StressTest
                currentValue={summary?.totalValue || 100000}
                onRunStressTest={handleStressTest}
              />
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}