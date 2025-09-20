import { Badge } from '@/components/ui/badge';

interface MetricsScrollerProps {
  features: Record<string, any>;
  isMobile?: boolean;
}

export function MetricsScroller({ features, isMobile = false }: MetricsScrollerProps) {
  if (isMobile) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(features).map(([key, value]) => {
          const score = typeof value === 'object' ? value.score : value;
          const percentage = Math.round((score || 0.5) * 100);
          
          return (
            <Badge 
              key={key} 
              variant="secondary" 
              className="h-7 px-3 flex-shrink-0 whitespace-nowrap"
            >
              {key.replace('_', ' ')} {percentage}%
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(features).slice(0, 4).map(([key, value]) => {
        const score = typeof value === 'object' ? value.score : value;
        const percentage = Math.round((score || 0.5) * 100);
        
        return (
          <div key={key} className="p-2 bg-muted rounded text-xs">
            <div className="capitalize text-muted-foreground">{key.replace('_', ' ')}</div>
            <div className="font-semibold text-sm">{percentage}%</div>
          </div>
        );
      })}
    </div>
  );
}