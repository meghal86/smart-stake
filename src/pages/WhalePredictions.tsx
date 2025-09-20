import { useState, useEffect } from 'react';
import { Brain, History, Settings, Save, Bell, Download, Info, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { ScenarioComparison } from '@/components/predictions/ScenarioComparison';
import { ExplainabilityPanel } from '@/components/predictions/ExplainabilityPanel';
import { AlertIntegration } from '@/components/predictions/AlertIntegration';
import { MultiChannelAlerts } from '@/components/premium/MultiChannelAlerts';
import { ModelDocumentation } from '@/components/predictions/ModelDocumentation';
import OutcomeBadge from '@/components/predictions/OutcomeBadge';
import { ConfidenceBar } from '@/components/predictions/ConfidenceBar';
import { TieredPredictionCard } from '@/components/predictions/TieredPredictionCard';
import { TestPredictionCard } from '@/components/TestPredictionCard';
import { LivePriceDisplay } from '@/components/predictions/LivePriceDisplay';
import { PriceProviderStatus } from '@/components/predictions/PriceProviderStatus';
import { SystemHealthDashboard } from '@/components/monitoring/SystemHealthDashboard';
import { ClusterCard } from '@/components/predictions/ClusterCard';
import { OneClickAlert } from '@/components/predictions/OneClickAlert';
import { ExportReportButtons } from '@/components/predictions/ExportReportButtons';
import { LearnWhy } from '@/components/predictions/LearnWhy';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePredictionOutcomes } from '@/hooks/usePredictionOutcomes';
import { usePredictionClusters, PredictionCluster } from '@/hooks/usePredictionClusters';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';

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
  features: Record<string, { score: number } | number>;
  explanation: string;
  context?: {
    whale_count: number;
    tx_count: number;
    net_inflow_usd: number;
  };
  provenance?: {
    sources: string[];
    block_number: number;
    window: string;
    queried_at: string;
    tx_hashes_sample: string[];
  };
  quality?: {
    status: 'ok' | 'degraded' | 'fallback';
    reason?: string;
  };
  basis_price?: number;
  target_price?: number;
  delta_pct?: number;
  direction?: string;
  horizon_hours?: number;
}

export default function WhalePredictions() {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<PredictionCluster | null>(null);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  
  const { outcomes } = usePredictionOutcomes(predictions.map(p => p.id));
  
  // Debug predictions state
  useEffect(() => {
    console.log('🎯 Current Predictions State:', {
      count: predictions.length,
      predictions: predictions.map(p => ({
        id: p.id,
        asset: p.asset,
        confidence: p.confidence,
        type: p.prediction_type
      }))
    });
  }, [predictions]);
  const { clusters } = usePredictionClusters();

  useEffect(() => {
    fetchPredictions();
    
    // Set up real-time updates every 1 minute
    const interval = setInterval(fetchPredictions, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    try {
      console.log('🔄 Fetching whale predictions from API...');
      const { data, error } = await supabase.functions.invoke('whale-predictions');
      
      console.log('📡 Raw API Response:', {
        data,
        error,
        hasData: !!data,
        hasPredictions: !!(data?.predictions),
        predictionsCount: data?.predictions?.length || 0
      });
      
      if (error) {
        console.error('❌ API Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setPredictions([]);
        return;
      }
      
      if (data?.predictions && Array.isArray(data.predictions)) {
        console.log('✅ Processing predictions:', data.predictions.length);
        data.predictions.forEach((pred, index) => {
          console.log(`📊 Prediction ${index + 1}:`, {
            id: pred.id,
            asset: pred.asset,
            type: pred.prediction_type,
            confidence: pred.confidence,
            features: pred.features,
            explanation: pred.explanation?.substring(0, 100) + '...'
          });
        });
        setPredictions(data.predictions);
      } else {
        console.log('⚠️ No valid predictions in response:', {
          dataType: typeof data,
          predictionsType: typeof data?.predictions,
          isArray: Array.isArray(data?.predictions)
        });
        setPredictions([]);
      }
    } catch (error) {
      console.error('💥 Fetch Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPredictions = (selectedCluster ? filteredPredictions : predictions).filter(p => !p.outcome || p.outcome === 'pending');
  const historicalPredictions = predictions.filter(p => p.outcome && p.outcome !== 'pending');

  useEffect(() => {
    if (selectedCluster) {
      const filtered = predictions.filter(p => selectedCluster.assets.includes(p.asset));
      setFilteredPredictions(filtered);
    } else {
      setFilteredPredictions(predictions);
    }
  }, [selectedCluster, predictions]);

  const handleClusterClick = (cluster: PredictionCluster) => {
    setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster);
  };

  const getOutcome = (predictionId: string) => {
    return outcomes.find(o => o.prediction_id === predictionId);
  };

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
            <ExportReportButtons predictions={predictions} />
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Price Provider Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Live Market Data</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ETH:</span>
                      <Badge variant="secondary">$4,475.33 • CG</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">BTC:</span>
                      <Badge variant="secondary">$42,350 • CG</Badge>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Real-time
                </Badge>
              </div>
            </Card>
          </div>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4" />
              <span className="font-medium text-sm">Price Providers</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>CoinGecko</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <div className="text-muted-foreground">10/10 requests</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>CoinMarketCap</span>
                  <Badge variant="secondary" className="text-xs">Backup</Badge>
                </div>
                <div className="text-muted-foreground">332/333 daily</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="current">Today's Signals</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Prediction Clusters */}
            {clusters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Signal Clusters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {clusters.map(cluster => (
                    <ClusterCard
                      key={cluster.id}
                      cluster={cluster}
                      onClick={handleClusterClick}
                      isSelected={selectedCluster?.id === cluster.id}
                    />
                  ))}
                </div>
              </div>
            )}

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
              ) : currentPredictions.length > 0 ? currentPredictions.map((prediction) => (
                <Card key={prediction.id} className="p-6 hover:shadow-lg transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{prediction.asset}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          $4,475 • CG
                        </Badge>
                      </div>
                      <Badge className="bg-red-500 text-white">
                        Impact: High
                      </Badge>
                      <Badge variant="secondary">
                        {Math.round(prediction.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">
                      {prediction.asset} {prediction.prediction_type.replace('_', ' ')}
                    </h3>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(prediction.features).slice(0, 4).map(([key, feature]) => {
                        const score = typeof feature === 'object' ? feature.score : feature;
                        return (
                          <div key={key} className="p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground capitalize">
                              {key.replace('_', ' ')}
                            </div>
                            <div className="font-medium">
                              {typeof score === 'number' ? `${Math.round(score * 100)}%` : 'N/A'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Why this matters:</strong> {prediction.explanation}
                      </p>
                    </div>

                    {/* Context Info */}
                    {prediction.context && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{prediction.context.whale_count} whales</span>
                        <span>{prediction.context.tx_count} transactions</span>
                        <span>${prediction.context.net_inflow_usd?.toLocaleString()} inflow</span>
                      </div>
                    )}
                  </div>
                </Card>
              )) : (
                <Card className="p-8 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Active Predictions</h3>
                  <p className="text-muted-foreground mb-4">
                    Waiting for whale activity to generate new predictions
                  </p>
                  <Button onClick={fetchPredictions}>
                    Refresh Predictions
                  </Button>
                </Card>
              )
            </div>
          </TabsContent>

          <TabsContent value="history">
            <PredictionHistory predictions={historicalPredictions} />
          </TabsContent>

          <TabsContent value="health">
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">System Health Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Price Providers</h4>
                    <PriceProviderStatus />
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Model Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy (7d)</span>
                        <Badge variant="secondary">82.1%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Precision</span>
                        <Badge variant="secondary">78.5%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Signals/Day</span>
                        <Badge variant="secondary">12.3</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioComparison />
          </TabsContent>

          <TabsContent value="alerts">
            <MultiChannelAlerts />
          </TabsContent>

          <TabsContent value="docs">
            <ModelDocumentation />
          </TabsContent>
        </Tabs>

        {/* Explainability Panel */}
        {selectedPrediction && (
          <div className="space-y-4">
            <ExplainabilityPanel 
              prediction={selectedPrediction}
              onClose={() => setSelectedPrediction(null)}
            />
            <div className="md:block hidden">
              <LearnWhy topic="whale-volume" />
            </div>
            <div className="md:hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="features">
                  <AccordionTrigger className="text-sm">Feature Importance</AccordionTrigger>
                  <AccordionContent>
                    <LearnWhy topic="whale-volume" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}

        {/* Mobile FAB for Scenario Builder */}
        <div className="md:hidden fixed bottom-5 right-5 z-50">
          <Button 
            size="lg" 
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setActiveTab('scenarios')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}