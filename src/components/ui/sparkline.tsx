import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({ 
  data, 
  width = 60, 
  height = 20, 
  color = 'currentColor',
  className = '' 
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={`w-[${width}px] h-[${height}px] ${className}`} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositiveTrend = data[data.length - 1] > data[0];

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        className={isPositiveTrend ? 'text-green-500' : 'text-red-500'}
      />
    </svg>
  );
}