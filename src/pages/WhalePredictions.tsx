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
              ) : currentPredictions.map((prediction) => (
                <TestPredictionCard key={prediction.id} />
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