import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePredictions, Prediction } from '@/hooks/usePredictions';

interface SignalsListProps {
  onSelectPrediction: (prediction: Prediction) => void;
}

export function SignalsList({ onSelectPrediction }: SignalsListProps) {
  const { predictions, loading } = usePredictions({ limit: 10 });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today's Signals</h3>
        <Badge variant="outline">{predictions.length} active</Badge>
      </div>
      
      {predictions.map((prediction) => (
        <Card key={prediction.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                prediction.direction === 'long' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {prediction.direction === 'long' ? 
                  <TrendingUp className="h-4 w-4" /> : 
                  <TrendingDown className="h-4 w-4" />
                }
              </div>
              <div>
                <div className="font-medium">{prediction.asset}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {prediction.direction} signal
                </div>
              </div>
            </div>
            <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
              {Math.round(prediction.confidence * 100)}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.round(prediction.horizonMin / 60)}h horizon
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              High confidence
            </div>
          </div>
          
          {prediction.rationale && (
            <p className="text-sm mb-3">{prediction.rationale}</p>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelectPrediction(prediction)}
            className="w-full"
          >
            View Details
          </Button>
        </Card>
      ))}
    </div>
  );
}