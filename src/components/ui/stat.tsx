'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../src/lib/utils';

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  animated?: boolean;
}

const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, label, value, sublabel, icon, animated = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(animated ? 0 : value);

    React.useEffect(() => {
      if (animated && typeof value === 'number') {
        const duration = 600;
        const steps = 30;
        const increment = value / steps;
        let current = 0;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(timer);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }, [value, animated]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1', className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-alpha-gray">{icon}</span>}
          <span className="text-sm font-medium text-alpha-gray">{label}</span>
        </div>
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-2xl font-bold text-white"
        >
          {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
        </motion.div>
        {sublabel && (
          <span className="text-xs text-alpha-gray">{sublabel}</span>
        )}
      </div>
    );
  }
);

Stat.displayName = 'Stat';

export { Stat };