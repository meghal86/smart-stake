/**
 * SparklineChart - Animated vertical sparkline for 6h drift
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  animated?: boolean;
  drift?: number; // ±X%
}

export function SparklineChart({ 
  data, 
  width = 60, 
  height = 40, 
  color = '#14B8A6',
  animated = true,
  drift = 0
}: SparklineChartProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [animatedData, setAnimatedData] = useState<number[]>([]);

  useEffect(() => {
    if (animated) {
      // Animate data points in sequence
      data.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, data[index]]);
        }, index * 50);
      });
    } else {
      setAnimatedData(data);
    }
  }, [data, animated]);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = animatedData.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  const driftColor = drift >= 0 ? '#10B981' : '#EF4444';
  const driftSign = drift >= 0 ? '+' : '';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={!reducedMotion && animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={!reducedMotion && animated ? { duration: 0.8, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={color}
            initial={!reducedMotion && animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={!reducedMotion && animated ? { 
              delay: index * 0.05,
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            } : { duration: 0 }}
          />
        ))}
      </svg>
      
      <div className="text-xs text-center">
        <div className="text-slate-500 dark:text-slate-400">6h drift</div>
        <div 
          className="font-medium tabular-nums"
          style={{ color: driftColor }}
        >
          {driftSign}{drift.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}