import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface BacktestAccuracyProps {
  asset: string;
  predictionType: string;
  accuracy: number;
  period: string;
}

export function BacktestAccuracy({ asset, predictionType, accuracy, period }: BacktestAccuracyProps) {
  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return 'text-green-500';
    if (acc >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <TrendingUp className="h-3 w-3" />
      <span>
        {asset} {predictionType}: 
        <span className={`font-medium ml-1 ${getAccuracyColor(accuracy)}`}>
          {accuracy}% accuracy
        </span>
        <span className="ml-1">({period})</span>
      </span>
    </div>
  );
}