import { useState } from "react";
import { BottomNav } from "./shared/BottomNav";
import { PortfolioOverview } from "./PortfolioOverview";
import { RiskAnalysis } from "./RiskAnalysis";

interface PortfolioContainerProps {
  initialMode?: "novice" | "pro" | "institutional";
}

export function PortfolioContainer({ initialMode = "pro" }: PortfolioContainerProps) {
  const [activeSection, setActiveSection] = useState("portfolio");
  const [activeScreen, setActiveScreen] = useState("overview");
  const [mode, setMode] = useState(initialMode);

  const portfolioScreens = {
    overview: PortfolioOverview,
    risk: RiskAnalysis,
    // Add other screens: StressTest, Results, Addresses
  };

  const CurrentScreen = portfolioScreens[activeScreen as keyof typeof portfolioScreens] || PortfolioOverview;

  if (activeSection !== "portfolio") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
        <div className="p-6 text-center text-gray-400">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section
        </div>
        <BottomNav 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Portfolio Tabs */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="flex overflow-x-auto p-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "risk", label: "Risk" },
            { id: "stress", label: "Stress Test" },
            { id: "results", label: "Results" },
            { id: "addresses", label: "Addresses" }
          ].map((screen) => (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(screen.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeScreen === screen.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {screen.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Toggle (for testing) */}
      <div className="absolute top-4 right-4 z-50">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          <option value="novice">Novice</option>
          <option value="pro">Pro</option>
          <option value="institutional">Institutional</option>
        </select>
      </div>

      <CurrentScreen mode={mode} />
      
      <BottomNav 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </div>
  );
}