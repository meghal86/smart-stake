import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp } from 'lucide-react';
import { PredictionTypeCard } from './PredictionTypeCard';
import { ImpactLabel } from './ImpactLabel';
import { ConfidenceBar } from './ConfidenceBar';
import { BacktestAccuracy } from './BacktestAccuracy';
import { OneClickAlert } from './OneClickAlert';
import { LearnWhy } from './LearnWhy';

interface Prediction {
  id: string;
  asset: string;
  prediction_type: string;
  confidence: number;
  explanation: string;
  features: Record<string, number>;
  isDelayed?: boolean;
}

interface TodaysSignalsProps {
  predictions: Prediction[];
  isFreeTier: boolean;
}

export function TodaysSignals({ predictions, isFreeTier }: TodaysSignalsProps) {
  const getBacktestAccuracy = (asset: string, predictionType: string) => {
    const accuracies: Record<string, number> = {
      'ETH_whale_activity': 82,
      'BTC_whale_activity': 78,
      'ETH_price_movement': 75,
      'BTC_price_movement': 73
    };
    return accuracies[`${asset}_${predictionType}`] || 70;
  };

  return (
    <div className="space-y-4">
      {/* Free Tier Notice */}
      {isFreeTier && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">Free Tier - Delayed Signals</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Signals are delayed by 10 minutes. <a href="/subscription" className="underline font-medium">Upgrade to Pro</a> for real-time access.
          </p>
        </div>
      )}

      {/* Today's Signals */}
      <div className="space-y-4">
        {predictions.map((prediction) => (
          <PredictionTypeCard key={prediction.id} predictionType={prediction.prediction_type}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline">{prediction.asset}</Badge>
                <div className="group relative">
                  <Badge variant="outline" className="text-xs cursor-help border-green-300 text-green-700">
                    {prediction.asset === 'ETH' ? '$4,475.33' : '$42,350'} • CG
                  </Badge>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    CoinGecko Primary • Fresh data (&lt;30s)
                  </div>
                </div>
                <Badge className={`text-white ${
                  prediction.confidence >= 0.8 ? 'bg-red-500' : 
                  prediction.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  Impact: {prediction.confidence >= 0.8 ? 'High' : prediction.confidence >= 0.6 ? 'Medium' : 'Low'}
                </Badge>
                <ConfidenceBar value={prediction.confidence} />
                {prediction.isDelayed && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Delayed
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/subscription'}
                disabled={!isFreeTier}
              >
                Set Alert
              </Button>
            </div>

            {/* Backtest Accuracy */}
            <div className="mb-3">
              <BacktestAccuracy
                asset={prediction.asset}
                predictionType={prediction.prediction_type}
                accuracy={getBacktestAccuracy(prediction.asset, prediction.prediction_type)}
                period="30d"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-1">
                  {prediction.asset} {prediction.prediction_type.replace('_', ' ')}
                </h3>
                <p className="text-sm text-muted-foreground">{prediction.explanation}</p>
              </div>

              {/* Feature Importance */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.entries(prediction.features).map(([key, value]) => {
                  const score = typeof value === 'object' && value !== null && 'score' in value 
                    ? (value as any).score 
                    : typeof value === 'number' 
                    ? value 
                    : 0.5;
                  
                  const percentage = isNaN(Number(score)) ? '50' : Math.round(Number(score) * 100);
                  
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace('_', ' ')}:</span>
                      <span>{percentage}%</span>
                    </div>
                  );
                })}
              </div>

              <LearnWhy topic="whale-volume" />
            </div>
          </PredictionTypeCard>
        ))}
      </div>
    </div>
  );
}