import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Filter, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Prediction {
  id: string;
  timestamp: string;
  asset: string;
  prediction_type: string;
  confidence: number;
  predicted_value: number;
  actual_value?: number;
  outcome?: 'correct' | 'incorrect' | 'pending';
  explanation: string;
}

interface PredictionHistoryProps {
  predictions: Prediction[];
}

export function PredictionHistory({ predictions }: PredictionHistoryProps) {
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');

  const filteredPredictions = predictions
    .filter(p => filterAsset === 'all' || p.asset === filterAsset)
    .filter(p => filterOutcome === 'all' || p.outcome === filterOutcome)
    .sort((a, b) => {
      if (sortBy === 'timestamp') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return 0;
    });

  const accuracy = predictions.length > 0 
    ? (predictions.filter(p => p.outcome === 'correct').length / predictions.filter(p => p.outcome !== 'pending').length) * 100 
    : 0;

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'correct': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">{Math.round(accuracy)}%</div>
          <div className="text-sm text-muted-foreground">Accuracy Rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{predictions.length}</div>
          <div className="text-sm text-muted-foreground">Total Predictions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{predictions.filter(p => p.confidence > 0.8).length}</div>
          <div className="text-sm text-muted-foreground">High Confidence</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterAsset} onValueChange={setFilterAsset}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
            <SelectItem value="BTC">BTC</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="correct">Correct</SelectItem>
            <SelectItem value="incorrect">Incorrect</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Date</SelectItem>
            <SelectItem value="confidence">Confidence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {filteredPredictions.map((prediction) => (
          <Card key={prediction.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getOutcomeIcon(prediction.outcome)}
                <Badge variant="outline">{prediction.asset}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(prediction.timestamp).toLocaleDateString()}
                </span>
              </div>
              <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
                {Math.round(prediction.confidence * 100)}%
              </Badge>
            </div>
            
            <div className="text-sm space-y-1">
              <p>{prediction.explanation}</p>
              <div className="flex gap-4 text-muted-foreground">
                <span>Predicted: {prediction.predicted_value}</span>
                {prediction.actual_value && (
                  <span>Actual: {prediction.actual_value}</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}