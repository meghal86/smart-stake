import * as React from 'react';
import { cn } from '../../../src/lib/utils';

interface KPIGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
}

const KPIGrid = React.forwardRef<HTMLDivElement, KPIGridProps>(
  ({ className, columns = 3, children, ...props }, ref) => {
    const gridClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }[columns];

    return (
      <div
        ref={ref}
        className={cn(`grid gap-4 ${gridClass}`, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

KPIGrid.displayName = 'KPIGrid';

export { KPIGrid };