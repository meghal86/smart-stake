import { useState, useEffect } from 'react';
import { Brain, History, Settings, Save, Bell, Download, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { ScenarioComparison } from '@/components/predictions/ScenarioComparison';
import { ExplainabilityPanel } from '@/components/predictions/ExplainabilityPanel';
import { AlertIntegration } from '@/components/predictions/AlertIntegration';
import { ModelDocumentation } from '@/components/predictions/ModelDocumentation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface Prediction {
  id: string;
  timestamp: string;
  asset: string;
  chain: string;
  prediction_type: 'price_movement' | 'volume_spike' | 'whale_activity';
  confidence: number;
  predicted_value: number;
  actual_value?: number;
  outcome?: 'correct' | 'incorrect' | 'pending';
  features: Record<string, number>;
  explanation: string;
}

export default function WhalePredictions() {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      // Mock data for demonstration
      const mockPredictions: Prediction[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          asset: 'ETH',
          chain: 'ethereum',
          prediction_type: 'price_movement',
          confidence: 0.85,
          predicted_value: 2450,
          actual_value: 2420,
          outcome: 'correct',
          features: {
            whale_volume: 0.8,
            market_sentiment: 0.6,
            technical_indicators: 0.7,
            on_chain_metrics: 0.9
          },
          explanation: 'High whale accumulation detected with strong on-chain fundamentals'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          asset: 'BTC',
          chain: 'bitcoin',
          prediction_type: 'whale_activity',
          confidence: 0.92,
          predicted_value: 1,
          features: {
            whale_volume: 0.95,
            exchange_flows: 0.8,
            dormant_coins: 0.7,
            network_activity: 0.85
          },
          explanation: 'Large dormant wallet showing signs of activation'
        }
      ];
      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPredictions = predictions.filter(p => !p.outcome || p.outcome === 'pending');
  const historicalPredictions = predictions.filter(p => p.outcome && p.outcome !== 'pending');

  if (!canAccessFeature('whalePredictions')) {
    return (
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4">
          <Card className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">
              Whale Predictions requires a Premium subscription
            </p>
            <Button onClick={() => window.location.href = '/subscription'}>
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Whale Predictions</h1>
              <p className="text-sm text-muted-foreground">AI-powered whale behavior predictions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Current Predictions */}
            <div className="grid gap-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : currentPredictions.map((prediction) => (
                <Card key={prediction.id} className="p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{prediction.asset}</Badge>
                      <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
                        {Math.round(prediction.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedPrediction(prediction)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bell className="h-4 w-4 mr-1" />
                        Alert
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold mb-1">
                        {prediction.prediction_type === 'price_movement' && 'Price Movement Prediction'}
                        {prediction.prediction_type === 'volume_spike' && 'Volume Spike Prediction'}
                        {prediction.prediction_type === 'whale_activity' && 'Whale Activity Prediction'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{prediction.explanation}</p>
                    </div>
                    
                    {prediction.prediction_type === 'price_movement' && (
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Predicted Price: </span>
                          <span className="font-medium">${prediction.predicted_value}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeframe: </span>
                          <span className="font-medium">24h</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <PredictionHistory predictions={historicalPredictions} />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioComparison />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertIntegration />
          </TabsContent>

          <TabsContent value="docs">
            <ModelDocumentation />
          </TabsContent>
        </Tabs>

        {/* Explainability Panel */}
        {selectedPrediction && (
          <ExplainabilityPanel 
            prediction={selectedPrediction}
            onClose={() => setSelectedPrediction(null)}
          />
        )}
      </div>
    </div>
  );
}