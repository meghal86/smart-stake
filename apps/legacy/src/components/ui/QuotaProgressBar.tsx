import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuota } from '@/hooks/useQuota';
import { useTier } from '@/hooks/useTier';

export function QuotaProgressBar() {
  const { usage, getPredictionsProgress, predictionsRemaining } = useQuota();
  const { tier, features, isGuest } = useTier();

  if (isGuest || features.predictions_per_day === -1) {
    return null;
  }

  const progress = getPredictionsProgress();
  const isNearLimit = progress > 80;
  const isAtLimit = progress >= 100;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">Daily Predictions</span>
          <Badge variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'} className="text-xs">
            {usage.predictions_used}/{features.predictions_per_day}
          </Badge>
        </div>
        <Progress 
          value={progress} 
          className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`}
        />
      </div>
      
      {isAtLimit && (
        <Badge variant="destructive" className="text-xs">
          Upgrade for unlimited
        </Badge>
      )}
    </div>
  );
}