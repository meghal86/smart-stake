/**
 * AnimatedConfidenceBar - Smooth 0 → value confidence animation
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimatedConfidenceBarProps {
  value: number; // 0-100
  label?: string;
  showIcon?: boolean;
  delay?: number;
}

export function AnimatedConfidenceBar({ 
  value, 
  label = 'AI Confidence',
  showIcon = true,
  delay = 0
}: AnimatedConfidenceBarProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const getColor = (val: number) => {
    if (val >= 80) return '#10B981'; // Green
    if (val >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {showIcon && <Sparkles className="h-3 w-3 text-[var(--brand-teal,#14B8A6)]" />}
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {label}: {Math.round(animatedValue)}%
          </span>
        </div>
      </div>
      
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getColor(value) }}
          initial={!reducedMotion ? { width: 0 } : { width: `${value}%` }}
          animate={{ width: `${animatedValue}%` }}
          transition={!reducedMotion ? { 
            duration: 0.8,
            delay: delay / 1000,
            ease: [0.4, 0, 0.2, 1]
          } : { duration: 0 }}
        />
      </div>
    </div>
  );
}