import { X, Info, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Prediction {
  id: string;
  asset: string;
  confidence: number;
  features: Record<string, number>;
  explanation: string;
}

interface ExplainabilityPanelProps {
  prediction: Prediction;
  onClose: () => void;
}

export function ExplainabilityPanel({ prediction, onClose }: ExplainabilityPanelProps) {
  const featureLabels: Record<string, string> = {
    whale_volume: 'Whale Trading Volume',
    market_sentiment: 'Market Sentiment',
    technical_indicators: 'Technical Analysis',
    on_chain_metrics: 'On-Chain Metrics',
    exchange_flows: 'Exchange Flows',
    dormant_coins: 'Dormant Coin Movement',
    network_activity: 'Network Activity'
  };

  const sortedFeatures = Object.entries(prediction.features)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Model Explainability</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Prediction Summary */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">Prediction Summary</h3>
              <p className="text-sm text-muted-foreground mb-2">{prediction.explanation}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Confidence:</span>
                <Progress value={prediction.confidence * 100} className="flex-1" />
                <span className="text-sm font-medium">{Math.round(prediction.confidence * 100)}%</span>
              </div>
            </div>

            {/* Feature Importance */}
            <div>
              <h3 className="font-semibold mb-4">Key Contributing Factors</h3>
              <div className="space-y-3">
                {sortedFeatures.map(([feature, importance]) => (
                  <div key={feature} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {featureLabels[feature] || feature}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(importance * 100)}% impact
                      </span>
                    </div>
                    <Progress value={importance * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Model Details */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">How This Prediction Was Made</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Analyzed {Object.keys(prediction.features).length} key market indicators</p>
                <p>• Processed real-time whale transaction data</p>
                <p>• Applied ensemble ML models trained on 2+ years of data</p>
                <p>• Cross-validated with historical pattern matching</p>
              </div>
            </div>

            {/* Limitations */}
            <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Important Limitations
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Predictions are based on historical patterns and may not account for unprecedented market events, 
                    regulatory changes, or black swan events. Always use as one factor in your decision-making process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}