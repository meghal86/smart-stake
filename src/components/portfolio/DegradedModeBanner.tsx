/**
 * Degraded Mode Banner Component
 * 
 * Displays a banner when portfolio data confidence is below threshold.
 * Requirements: R6.2
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DegradedModeBannerProps {
  confidence: number;
  confidenceThreshold: number;
  reasons: string[];
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function DegradedModeBanner({
  confidence,
  confidenceThreshold,
  reasons,
  onRetry,
  isRetrying = false,
}: DegradedModeBannerProps) {
  const confidencePercent = Math.round(confidence * 100);
  const thresholdPercent = Math.round(confidenceThreshold * 100);

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="font-semibold mb-1">
            Limited Preview Mode: Data Confidence {confidencePercent}%
          </div>
          <div className="text-sm opacity-90">
            Confidence below {thresholdPercent}% threshold. Some actions may be restricted.
            {reasons.length > 0 && (
              <div className="mt-1 text-xs">
                Reasons: {reasons.join(', ')}
              </div>
            )}
          </div>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-yellow-600 hover:bg-yellow-600/20 flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
