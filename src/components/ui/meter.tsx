'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../src/lib/utils';

interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  animated?: boolean;
  showMarker?: boolean;
}

const Meter = React.forwardRef<HTMLDivElement, MeterProps>(
  ({ className, value, animated = true, showMarker = true, ...props }, ref) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={cn('relative w-full', className)}
        {...props}
      >
        <div className="h-4 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full overflow-hidden">
          {showMarker && (
            <motion.div
              initial={animated ? { left: '0%' } : { left: `${clampedValue}%` }}
              animate={{ left: `${clampedValue}%` }}
              transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
              className="absolute top-0 w-2 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2"
              style={{ left: `${clampedValue}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);

Meter.displayName = 'Meter';

export { Meter };