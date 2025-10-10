"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useDiscoveryTelemetry } from "./useDiscoveryTelemetry";

const steps: Step[] = [
  {
    target: "[data-tour='header']",
    content: "Welcome to AlphaWhale! Navigate between different intelligence modules here.",
    placement: "bottom"
  },
  {
    target: "[data-tour='market-banner']",
    content: "Get real-time market insights and whale activity summaries.",
    placement: "bottom"
  },
  {
    target: "[data-tour='whale-cards']",
    content: "Explore whale movement patterns and their market impact.",
    placement: "top"
  },
  {
    target: "[data-tour='alert-cta']",
    content: "Set up personalized alerts for whale movements that matter to you.",
    placement: "top"
  },
  {
    target: "[data-tour='raw-data']",
    content: "Access raw whale data and build custom analysis.",
    placement: "top"
  }
];

export function DiscoveryTour() {
  const [run, setRun] = useState(false);
  const { logEvent } = useDiscoveryTelemetry();

  useEffect(() => {
    const completed = localStorage.getItem("discoveryTourCompleted");
    if (!completed) {
      setRun(true);
      logEvent("tour_started", {});
    }
  }, [logEvent]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem("discoveryTourCompleted", "true");
      setRun(false);
      logEvent("tour_completed", { status });
    }

    if (type === "step:after") {
      logEvent("tour_step", { step: data.index });
    }
  };

  const startTour = () => {
    setRun(true);
    logEvent("tour_restarted", {});
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#0ea5e9",
            zIndex: 10000,
          }
        }}
      />
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors z-50"
        aria-label="Start discovery tour"
        data-tour="help-button"
      >
        ?
      </button>
    </>
  );
}