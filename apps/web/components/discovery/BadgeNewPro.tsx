"use client";

import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDiscoveryTelemetry } from "./useDiscoveryTelemetry";

interface BadgeProps {
  type: "new" | "pro" | "updated";
  feature: string;
  tooltip?: string;
  className?: string;
}

export function BadgeNewPro({ type, feature, tooltip, className = "" }: BadgeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { logEvent } = useDiscoveryTelemetry();

  useEffect(() => {
    const key = `badge_${type}_${feature}_dismissed`;
    const dismissed = localStorage.getItem(key);
    const sessionCount = parseInt(localStorage.getItem("sessionCount") || "0");
    
    if (dismissed || sessionCount > 3) {
      setIsVisible(false);
    }
  }, [type, feature]);

  const handleClick = () => {
    logEvent("badge_clicked", { type, feature });
    
    // Auto-dismiss after interaction
    const key = `badge_${type}_${feature}_dismissed`;
    localStorage.setItem(key, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const badgeConfig = {
    new: {
      text: "New",
      className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      tooltip: tooltip || "Recently added feature"
    },
    pro: {
      text: "Pro",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      tooltip: tooltip || "Available in Pro plan"
    },
    updated: {
      text: "Updated",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      tooltip: tooltip || "Recently improved"
    }
  };

  const config = badgeConfig[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            onClick={handleClick}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${config.className} ${className}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            aria-label={`${config.text} badge for ${feature}`}
          >
            {config.text}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}