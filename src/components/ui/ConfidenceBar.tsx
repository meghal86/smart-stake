import React, { useEffect, useState } from 'react';
import { animations } from '@/lib/motion-tokens';

interface ConfidenceBarProps {
  confidence: number; // 0-100
  className?: string;
}

export function ConfidenceBar({ confidence, className = '' }: ConfidenceBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Data charging animation effect
    const timer = setTimeout(() => {
      setAnimatedWidth(confidence);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidence]);

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 80) return { level: 'High', color: 'bg-green-500' };
    if (conf >= 60) return { level: 'Medium', color: 'bg-orange-500' };
    return { level: 'Low', color: 'bg-red-500' };
  };

  const { level, color } = getConfidenceLevel(confidence);

  return (
    <div className={`group relative ${className}`}>
      {/* Background bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* Animated fill */}
        <div
          className={`h-full ${color} transition-all duration-300 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        AI Confidence {confidence}% → {level} reliability
      </div>
    </div>
  );
}