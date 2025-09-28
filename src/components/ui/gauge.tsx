import * as React from "react"
import { cn } from "@/lib/utils"

interface GaugeProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function Gauge({ 
  value, 
  max = 100, 
  size = 100, 
  strokeWidth = 8, 
  className 
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / max) * circumference

  const getColor = (val: number) => {
    if (val >= 80) return '#ef4444' // red
    if (val >= 60) return '#f97316' // orange
    if (val >= 40) return '#eab308' // yellow
    return '#22c55e' // green
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
    </div>
  )
}
