import { useState } from "react";
import { DollarSign, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { HeaderBar } from "./shared/HeaderBar";
import { MetricCard } from "./shared/MetricCard";
import { TabbedSection } from "./shared/TabbedSection";
import { usePortfolioData } from "@/hooks/usePortfolioData";

interface PortfolioOverviewProps {
  mode: "novice" | "pro" | "institutional";
}

export function PortfolioOverview({ mode }: PortfolioOverviewProps) {
  const [timeRange, setTimeRange] = useState("24h");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Preserve existing API integration
  const { portfolioData, loading, error } = usePortfolioData();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "assets", label: "Assets", count: portfolioData?.assets?.length || 0 },
    { id: "performance", label: "Performance" }
  ];

  const timeRanges = ["24h", "7d", "30d", "90d"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <HeaderBar title="Portfolio Overview" />
        <div className="p-6 text-center text-gray-400">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
      <HeaderBar 
        title="Portfolio Overview" 
        lastUpdated={portfolioData?.lastUpdated}
      >
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </HeaderBar>

      <div className="p-6 space-y-6">
        <TabbedSection
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Value"
                value={`$${portfolioData?.totalValue?.toLocaleString() || "0"}`}
                description="Current portfolio value"
                icon={DollarSign}
                trend={{ 
                  value: `${portfolioData?.change24h || 0}%`, 
                  direction: (portfolioData?.change24h || 0) >= 0 ? "up" : "down" 
                }}
                variant="default"
              />

              <MetricCard
                title="24h P&L"
                value={`$${portfolioData?.pnl24h?.toLocaleString() || "0"}`}
                description="Profit & Loss"
                icon={TrendingUp}
                variant={(portfolioData?.pnl24h || 0) >= 0 ? "success" : "danger"}
              />

              <MetricCard
                title="Risk Score"
                value={`${portfolioData?.riskScore || 0}/100`}
                description="Portfolio risk level"
                icon={Shield}
                variant={
                  (portfolioData?.riskScore || 0) > 70 ? "danger" :
                  (portfolioData?.riskScore || 0) > 40 ? "warning" : "success"
                }
                action={{
                  label: "Run Analysis",
                  onClick: () => console.log("Navigate to risk analysis")
                }}
              />

              {mode !== "novice" && (
                <MetricCard
                  title="Stress Test"
                  value={portfolioData?.stressTestStatus || "Not Run"}
                  description="Last stress test result"
                  icon={AlertTriangle}
                  action={{
                    label: "Run Test",
                    onClick: () => console.log("Navigate to stress test")
                  }}
                />
              )}
            </div>
          )}

          {activeTab === "assets" && (
            <div className="space-y-4">
              {portfolioData?.assets?.map((asset: any, index: number) => (
                <div
                  key={asset.symbol}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {asset.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{asset.symbol}</div>
                        <div className="text-sm text-gray-400">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        ${asset.value?.toLocaleString()}
                      </div>
                      <div className={`text-sm ${
                        asset.change >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {asset.change >= 0 ? "+" : ""}{asset.change}%
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-400 py-8">
                  No assets in portfolio
                </div>
              )}
            </div>
          )}

          {activeTab === "performance" && mode !== "novice" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-4">Performance Chart</h3>
                <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center text-gray-400">
                  Chart Component (preserve existing chart integration)
                </div>
              </div>
              
              <div className="space-y-4">
                <MetricCard
                  title="Sharpe Ratio"
                  value={portfolioData?.sharpeRatio?.toFixed(2) || "N/A"}
                  description="Risk-adjusted returns"
                />
                <MetricCard
                  title="Max Drawdown"
                  value={`${portfolioData?.maxDrawdown || 0}%`}
                  description="Largest peak-to-trough decline"
                  variant="warning"
                />
              </div>
            </div>
          )}
        </TabbedSection>
      </div>
    </div>
  );
}