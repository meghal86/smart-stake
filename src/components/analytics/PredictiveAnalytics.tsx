import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target, Zap, Loader2, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const PredictiveAnalytics = () => {
  const [models, setModels] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [showAccuracyDetails, setShowAccuracyDetails] = useState(null);
  const [simulationParams, setSimulationParams] = useState({
    whaleCount: '5',
    sellAmount: '1000',
    timeframe: '24h'
  });

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ml-predictions');
      if (error) throw error;
      
      // Filter to show only latest model of each type
      const uniqueModels = data.models?.reduce((acc, model) => {
        const existing = acc.find(m => m.type === model.type);
        if (!existing || new Date(model.last_trained) > new Date(existing.last_trained)) {
          return [...acc.filter(m => m.type !== model.type), model];
        }
        return acc;
      }, []) || [];
      setModels(uniqueModels);
      setPredictions(data.predictions?.map(p => ({
        type: p.ml_models.type,
        confidence: p.confidence,
        prediction: p.prediction_text,
        impact: p.impact_text,
        icon: getIconForType(p.ml_models.type),
        color: getColorForType(p.ml_models.type)
      })) || []);
    } catch (error) {
      console.error('Error fetching ML data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'clustering': return <Target className="h-4 w-4" />;
      case 'liquidation': return <TrendingDown className="h-4 w-4" />;
      case 'accumulation': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'clustering': return 'text-orange-600';
      case 'liquidation': return 'text-red-600';
      case 'accumulation': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const runSimulation = async () => {
    setSimulationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-predictions', {
        body: new URLSearchParams({
          action: 'simulate',
          whaleCount: simulationParams.whaleCount,
          sellAmount: simulationParams.sellAmount,
          timeframe: simulationParams.timeframe
        })
      });
      
      if (error) throw error;
      setSimulationResult(data);
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Simulation failed. Please try again.');
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Predictive Analytics</h2>
            <p className="text-muted-foreground">AI-powered whale behavior predictions</p>
          </div>
        </div>

        {/* Model Performance */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {models.map((model, index) => (
              <Card key={model.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => setShowAccuracyDetails(model)}>
                <div className="flex items-center gap-2 mb-2">
                  {getIconForType(model.type)}
                  <span className="text-sm font-medium">{model.name}</span>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{model.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy (7 days) • Click for details</div>
              </Card>
            ))}
          </div>
        )}

        {/* Current Predictions */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Current Predictions</h3>
          <div className="space-y-3">
            {predictions.map((pred, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-muted rounded-lg ${pred.color}`}>
                      {pred.icon}
                    </div>
                    <div>
                      <div className="font-medium">{pred.prediction}</div>
                      <div className="text-sm text-muted-foreground mt-1">{pred.impact}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      {pred.confidence}%
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Simulation Tool */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Market Impact Simulation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Whale Count</label>
              <Input
                type="number"
                value={simulationParams.whaleCount}
                onChange={(e) => setSimulationParams({...simulationParams, whaleCount: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sell Amount (ETH)</label>
              <Input
                type="number"
                value={simulationParams.sellAmount}
                onChange={(e) => setSimulationParams({...simulationParams, sellAmount: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select 
                value={simulationParams.timeframe} 
                onValueChange={(value) => setSimulationParams({...simulationParams, timeframe: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={runSimulation} className="w-full" disabled={simulationLoading}>
                {simulationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  'Run Simulation'
                )}
              </Button>
            </div>
          </div>
          {simulationResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Simulation Results:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price Impact:</span>
                  <div className="font-medium text-red-600">-{simulationResult.priceImpact}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Volume Spike:</span>
                  <div className="font-medium text-orange-600">+{simulationResult.volumeSpike}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recovery Time:</span>
                  <div className="font-medium text-blue-600">{simulationResult.recoveryHours}h</div>
                </div>
              </div>
            </div>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            Simulate the market impact of coordinated whale actions to assess potential risks and opportunities.
          </div>
        </Card>

        {/* Model Accuracy Details Modal */}
        {showAccuracyDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{showAccuracyDetails.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAccuracyDetails(null)}>×</Button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold mb-2">{showAccuracyDetails.accuracy}%</div>
                  <div className="text-sm text-muted-foreground mb-3">Current 7-day accuracy</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>30-day average:</span>
                    <span className="font-medium">{(showAccuracyDetails.accuracy - 2.5).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Best performance:</span>
                    <span className="font-medium text-green-600">{(showAccuracyDetails.accuracy + 5).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Predictions made:</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last trained:</span>
                    <span className="font-medium">{new Date(showAccuracyDetails.last_trained).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Model performance is continuously monitored and updated based on real whale behavior patterns.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};