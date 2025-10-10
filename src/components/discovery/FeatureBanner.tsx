"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { useDiscoveryTelemetry } from "./useDiscoveryTelemetry";

const features = [
  { name: "Whale Patterns", link: "/hub", description: "AI-detected movement patterns" },
  { name: "Backtests", link: "/reports", description: "Historical performance analysis" },
  { name: "Raw Data", link: "/hub?tab=data", description: "Direct blockchain insights" },
  { name: "Outcome Digest", link: "/insights", description: "Track your prediction accuracy" },
  { name: "Smart Alerts", link: "/alerts", description: "Personalized notifications" }
];

export function FeatureBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { logEvent } = useDiscoveryTelemetry();

  useEffect(() => {
    const dismissed = localStorage.getItem("featureBannerDismissed");
    const version = localStorage.getItem("appVersion") || "1.0.0";
    
    // Auto-expand on new version and show banner
    if (version !== "1.1.0") {
      setIsExpanded(true);
      setIsVisible(true);
      localStorage.setItem("appVersion", "1.1.0");
      localStorage.removeItem("featureBannerDismissed"); // Reset dismissal on version bump
    } else if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    logEvent("banner_toggled", { expanded: !isExpanded });
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("featureBannerDismissed", "true");
    logEvent("banner_dismissed", {});
  };

  const handleFeatureClick = (feature: string) => {
    logEvent("banner_feature_clicked", { feature });
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-blue-900 dark:text-blue-100">
            Did you know?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
            aria-label={isExpanded ? "Collapse features" : "Expand features"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-blue-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600" />
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((feature) => (
            <a
              key={feature.name}
              href={feature.link}
              onClick={() => handleFeatureClick(feature.name)}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {feature.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {feature.description}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}