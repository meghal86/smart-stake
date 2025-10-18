import React, { useEffect } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import Section from '@/components/portfolio/Section';
import { GuardianWidget } from '@/components/portfolio/GuardianWidget';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useRisk } from '@/hooks/portfolio/useRisk';
import { useGuardian } from '@/hooks/portfolio/useGuardian';
import { Progress } from '@/components/ui/progress';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';

export default function Overview() {
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { metrics, isLoading: riskLoading } = useRisk();
  const { data: guardian } = useGuardian();
  const { mode } = useUIMode() || { mode: 'novice' };
  
  useEffect(() => {
    // Apply cinematic theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  if (summaryLoading) {
    return (
      <LegendaryLayout mode={mode}>
        <Hub2Layout>
          <PortfolioLayout>
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-xl"></div>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="h-64 bg-muted rounded-xl"></div>
                <div className="h-64 bg-muted rounded-xl"></div>
                <div className="h-64 bg-muted rounded-xl"></div>
              </div>
            </div>
          </PortfolioLayout>
        </Hub2Layout>
      </LegendaryLayout>
    );
  }

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
              
              <div className="grid gap-6 lg:grid-cols-3">
                <Section 
                  title="Data Provenance & Lineage" 
                  subtitle="Institutional grade sources"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Real Data Coverage</span>
                      <span className="font-medium">87.5%</span>
                    </div>
                    <Progress value={87.5} className="h-2" />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Etherscan API</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>95%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>CoinGecko Prices</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>DeFi Protocols</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>75%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section 
                  title="Risk Snapshot" 
                  subtitle="Liquidity • Concentration • Correlation"
                >
                  {riskLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Liquidity</span>
                        <span className="font-medium text-green-600">{metrics?.liquidity}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Concentration</span>
                        <span className="font-medium text-yellow-600">{metrics?.concentration}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Correlation</span>
                        <span className="font-medium text-blue-600">{metrics?.correlation}/10</span>
                      </div>
                    </div>
                  )}
                </Section>

                <Section 
                  title="Guardian Scan" 
                  subtitle="Trust & compliance"
                >
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{guardian?.trust || 0}%</div>
                      <div className="text-sm text-muted-foreground">Trust Score</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {guardian?.flags?.length || 0} security flags detected
                    </div>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}