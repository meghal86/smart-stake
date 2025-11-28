import { useState } from "react";
import { Shield, AlertTriangle, TrendingDown, Activity } from "lucide-react";
import { HeaderBar } from "./shared/HeaderBar";
import { MetricCard } from "./shared/MetricCard";
import { TabbedSection } from "./shared/TabbedSection";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";

interface RiskAnalysisProps {
  mode: "novice" | "pro" | "institutional";
}

export function RiskAnalysis({ mode }: RiskAnalysisProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Preserve existing API integration
  const { riskData, loading, runAnalysis } = useRiskAnalysis();

  const tabs = [
    { id: "overview", label: "Risk Overview" },
    { id: "breakdown", label: "Risk Breakdown" },
    ...(mode !== "novice" ? [{ id: "correlations", label: "Correlations" }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <HeaderBar title="Risk Analysis" />
        <div className="p-6 text-center text-gray-400">Analyzing portfolio risk...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
      <HeaderBar 
        title="Risk Analysis" 
        lastUpdated={riskData?.lastAnalysis}
      />

      <div className="p-6 space-y-6">
        <TabbedSection
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Overall Risk Score"
                  value={`${riskData?.overallScore || 0}/100`}
                  description="Portfolio risk assessment"
                  icon={Shield}
                  variant={
                    (riskData?.overallScore || 0) > 70 ? "danger" :
                    (riskData?.overallScore || 0) > 40 ? "warning" : "success"
                  }
                  action={{
                    label: "Refresh Analysis",
                    onClick: runAnalysis
                  }}
                />

                <MetricCard
                  title="Value at Risk (VaR)"
                  value={`$${riskData?.var?.toLocaleString() || "0"}`}
                  description="95% confidence, 1-day"
                  icon={TrendingDown}
                  variant="warning"
                />

                <MetricCard
                  title="Volatility"
                  value={`${riskData?.volatility || 0}%`}
                  description="30-day annualized"
                  icon={Activity}
                />
              </div>

              {mode === "novice" && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-1">Risk Explanation</h4>
                      <p className="text-sm text-blue-200">
                        Your portfolio has a {riskData?.overallScore > 50 ? "moderate to high" : "low to moderate"} risk level. 
                        This means your investments may experience {riskData?.overallScore > 50 ? "significant" : "moderate"} price fluctuations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "breakdown" && (
            <div className="space-y-4">
              {riskData?.riskFactors?.map((factor: unknown, index: number) => (
                <div
                  key={factor.name}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{factor.name}</h4>
                    <span className={`text-sm font-medium ${
                      factor.level === "high" ? "text-red-400" :
                      factor.level === "medium" ? "text-yellow-400" : "text-emerald-400"
                    }`}>
                      {factor.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        factor.level === "high" ? "bg-red-500" :
                        factor.level === "medium" ? "bg-yellow-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{factor.description}</p>
                </div>
              )) || (
                <div className="text-center text-gray-400 py-8">
                  No risk factors analyzed yet
                </div>
              )}
            </div>
          )}

          {activeTab === "correlations" && mode !== "novice" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-4">Asset Correlations</h3>
                <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center text-gray-400">
                  Correlation Matrix (preserve existing component)
                </div>
              </div>
              
              <div className="space-y-4">
                <MetricCard
                  title="Portfolio Beta"
                  value={riskData?.beta?.toFixed(2) || "N/A"}
                  description="Sensitivity to market movements"
                />
                <MetricCard
                  title="Diversification Ratio"
                  value={riskData?.diversificationRatio?.toFixed(2) || "N/A"}
                  description="Portfolio diversification effectiveness"
                />
              </div>
            </div>
          )}
        </TabbedSection>
      </div>
    </div>
  );
}