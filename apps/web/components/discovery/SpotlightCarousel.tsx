"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3, Bell, Target } from "lucide-react";
import { useDiscoveryTelemetry } from "./useDiscoveryTelemetry";

const spotlights = [
  {
    id: "patterns",
    title: "Pattern Backtest",
    description: "See how whale patterns performed historically",
    icon: TrendingUp,
    cta: "View Backtests",
    link: "/reports"
  },
  {
    id: "analytics",
    title: "Market Intelligence",
    description: "AI-powered insights from whale behavior",
    icon: BarChart3,
    cta: "Explore Analytics",
    link: "/hub"
  },
  {
    id: "alerts",
    title: "Smart Alerts",
    description: "Get notified when whales make significant moves",
    icon: Bell,
    cta: "Setup Alerts",
    link: "/alerts"
  },
  {
    id: "roi",
    title: "ROI Tracking",
    description: "Track your prediction accuracy and profits",
    icon: Target,
    cta: "View ROI",
    link: "/insights"
  }
];

export function SpotlightCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { logEvent } = useDiscoveryTelemetry();

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % spotlights.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlights.length) % spotlights.length);
    setIsAutoPlaying(false);
    logEvent("spotlight_navigation", { direction: "previous" });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlights.length);
    setIsAutoPlaying(false);
    logEvent("spotlight_navigation", { direction: "next" });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    logEvent("spotlight_dot_clicked", { index });
  };

  const handleSpotlightClick = (spotlight: typeof spotlights[0]) => {
    logEvent("spotlight_viewed", { 
      spotlight_id: spotlight.id,
      title: spotlight.title 
    });
  };

  const currentSpotlight = spotlights[currentIndex];
  const Icon = currentSpotlight.icon;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Previous spotlight"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Icon className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Today's Feature: {currentSpotlight.title}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {currentSpotlight.description}
          </p>
          <a
            href={currentSpotlight.link}
            onClick={() => handleSpotlightClick(currentSpotlight)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentSpotlight.cta}
          </a>
        </div>

        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Next spotlight"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {spotlights.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? "bg-blue-500"
                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`Go to spotlight ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}