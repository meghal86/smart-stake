import React, { useEffect } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useStress } from '@/hooks/portfolio/useStress';
import { Card } from '@/components/ui/card';
import { AlertTriangle, BarChart3, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';

export default function Results() {
  const { data: summary } = usePortfolioSummary();
  const { result } = useStress();
  const { mode } = useUIMode() || { mode: 'novice' };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  if (!result) {
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
                
                <Card className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Stress Test Results</h3>
                  <p className="text-muted-foreground">
                    Run a stress test to see detailed analysis and projections
                  </p>
                </Card>
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
              
              {/* KPI Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-red-500/10 border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Worst Case</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    ${result.worstCase.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Maximum potential loss
                  </div>
                </Card>

                <Card className="p-6 bg-yellow-500/10 border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Expected Loss</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-500">
                    ${result.expectedLoss.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Probability-weighted average
                  </div>
                </Card>

                <Card className="p-6 bg-blue-500/10 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Recovery Time</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">
                    {result.recoveryMonths} months
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated recovery period
                  </div>
                </Card>
              </div>

              {/* Impact Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Impact by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.impacts}>
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pct" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}