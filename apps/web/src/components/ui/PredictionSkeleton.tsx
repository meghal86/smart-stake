import { Card } from '@/components/ui/card';

export function PredictionSkeleton() {
  return (
    <Card className="p-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-12 bg-muted rounded animate-pulse"></div>
          <div className="h-7 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-7 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-12 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
        
        {/* Metrics grid skeleton */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2 bg-muted rounded">
              <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-12 bg-muted-foreground/20 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Impact bar skeleton with shimmer */}
        <div className="mt-4">
          <div className="h-2 w-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}