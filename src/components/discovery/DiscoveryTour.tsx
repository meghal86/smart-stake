"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";
import { useDiscoveryTelemetry } from "./useDiscoveryTelemetry";

const tourSteps = [
  {
    target: '[data-tour="header"]',
    content: "Welcome to AlphaWhale! Let's explore the key features.",
    placement: "bottom" as const,
  },
  {
    target: '[data-tour="market-banner"]',
    content: "Monitor real-time whale activity and market intelligence here.",
    placement: "bottom" as const,
  },
  {
    target: '[data-tour="whale-cards"]',
    content: "View live whale transactions and patterns. Click 'Pattern' for analysis.",
    placement: "top" as const,
  },
  {
    target: '[data-tour="alert-cta"]',
    content: "Create custom alerts to get notified of whale movements.",
    placement: "top" as const,
  },
  {
    target: '[data-tour="help-button"]',
    content: "Click here anytime to restart this tour. Happy whale watching! 🐋",
    placement: "bottom" as const,
  },
];

export function DiscoveryTour() {
  const [runTour, setRunTour] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();
  const { logEvent } = useDiscoveryTelemetry();

  useEffect(() => {
    if (!user) return;
    
    const completed = localStorage.getItem("discoveryTourCompleted");
    const currentVersion = "1.1.0";
    const lastVersion = localStorage.getItem("appVersion") || "1.0.0";
    
    // Auto-launch on first login OR version bump
    if (!completed || lastVersion !== currentVersion) {
      setTimeout(() => {
        setShowWelcome(true);
        logEvent("tour_started", { trigger: !completed ? "first_login" : "version_bump" });
      }, 1000);
      localStorage.setItem("appVersion", currentVersion);
    }
  }, [user, logEvent]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (type === EVENTS.STEP_AFTER) {
      logEvent("tour_step", { step: index, stepTarget: tourSteps[index]?.target });
    }
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem("discoveryTourCompleted", "true");
      logEvent("tour_completed", { status, stepsCompleted: index + 1 });
    }
  };

  const startFullTour = () => {
    setShowWelcome(false);
    setRunTour(true);
    logEvent("tour_full_started", {});
  };

  const completeTour = () => {
    localStorage.setItem("discoveryTourCompleted", "true");
    setShowWelcome(false);
    logEvent("tour_completed", { status: "completed" });
  };

  const startTour = () => {
    setShowWelcome(true);
    logEvent("tour_restarted", {});
  };

  if (!showWelcome) {
    return (
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors z-50"
        aria-label="Start discovery tour"
        data-tour="help-button"
      >
        ?
      </button>
    );
  }

  return (
    <>
      {/* Joyride Tour */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6',
          }
        }}
      />
      
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Welcome to AlphaWhale! 🐋</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Discover powerful whale intelligence features:
            </p>
            <ul className="space-y-2 mb-6 text-sm">
              <li>• Real-time whale movement tracking</li>
              <li>• Personalized alerts and notifications</li>
              <li>• Market intelligence and patterns</li>
              <li>• ROI tracking and analytics</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={startFullTour}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Take Tour
              </button>
              <button
                onClick={completeTour}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}