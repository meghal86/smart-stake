'use client';

import * as React from 'react';
import { cn } from '../../../src/lib/utils';

interface LastUpdatedProps extends React.HTMLAttributes<HTMLDivElement> {
  timestamp?: Date;
}

const LastUpdated = React.forwardRef<HTMLDivElement, LastUpdatedProps>(
  ({ className, timestamp = new Date(), ...props }, ref) => {
    const [timeAgo, setTimeAgo] = React.useState('');

    React.useEffect(() => {
      const updateTimeAgo = () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
        
        if (diff < 60) {
          setTimeAgo(`${diff}s ago`);
        } else if (diff < 3600) {
          setTimeAgo(`${Math.floor(diff / 60)}m ago`);
        } else {
          setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 30000); // Update every 30s

      return () => clearInterval(interval);
    }, [timestamp]);

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-1 text-xs text-alpha-gray', className)}
        {...props}
      >
        <div className="w-1.5 h-1.5 bg-alpha-teal rounded-full animate-pulse-dot" />
        <span>Updated {timeAgo}</span>
      </div>
    );
  }
);

LastUpdated.displayName = 'LastUpdated';

export { LastUpdated };