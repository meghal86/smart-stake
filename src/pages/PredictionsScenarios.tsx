import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Plus, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AppLayout } from '@/components/layout/AppLayout';
import OutcomeBadge from '@/components/predictions/OutcomeBadge';
import { ConfidenceBar } from '@/components/predictions/ConfidenceBar';
import { ClusterCard } from '@/components/predictions/ClusterCard';
import { OneClickAlert } from '@/components/predictions/OneClickAlert';
import { ExportReportButtons } from '@/components/predictions/ExportReportButtons';
import { LearnWhy } from '@/components/predictions/LearnWhy';
import { PriorityBadge } from '@/components/predictions/PriorityBadge';
import { BacktestAccuracy } from '@/components/predictions/BacktestAccuracy';
import { EnterpriseTeaser } from '@/components/predictions/EnterpriseTeaser';
import { ImpactLabel } from '@/components/predictions/ImpactLabel';
import { PredictionTypeCard } from '@/components/predictions/PredictionTypeCard';
import { ModelPerformanceSummary } from '@/components/predictions/ModelPerformanceSummary';
import { ScenarioResults } from '@/components/predictions/ScenarioResults';
import { TodaysSignals } from '@/components/predictions/TodaysSignals';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { AlertsManager } from '@/components/predictions/AlertsManager';
import { ScenarioComparison } from '@/components/predictions/ScenarioComparison';
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
  features: Record<string, number>;
  explanation: string;
  isDelayed?: boolean;
}

export default function PredictionsScenarios() {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeTab, setActiveTab] = useState('predictions');
  const [predictionsSubTab, setPredictionsSubTab] = useState<'today' | 'history'>('today');
  const [scenarioResults, setScenarioResults] = useState([
    { asset: 'ETH', predictedImpact: 5.2, riskScore: 'Medium' as const, confidence: 0.78 },
    { asset: 'BTC', predictedImpact: 3.1, riskScore: 'Low' as const, confidence: 0.82 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<PredictionCluster | null>(null);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  
  const { outcomes } = usePredictionOutcomes(predictions.map(p => p.id));
  const { clusters } = usePredictionClusters();

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCluster) {
      const filtered = predictions.filter(p => selectedCluster.assets.includes(p.asset));
      setFilteredPredictions(filtered);
    } else {
      setFilteredPredictions(predictions);
    }
  }, [selectedCluster, predictions]);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whale-predictions');
      
      if (error) {
        console.error('Error fetching live predictions:', error);
        setPredictions([]);
        return;
      }
      
      if (data?.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClusterClick = (cluster: PredictionCluster) => {
    setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster);
    track('cluster_clicked', {
      cluster_id: cluster.id,
      assets: cluster.assets,
      direction: cluster.direction
    });
  };

  const getFilteredPredictions = () => {
    let filtered = (selectedCluster ? filteredPredictions : predictions)
      .filter(p => !p.outcome || p.outcome === 'pending');
    
    // Tier-based filtering
    if (!canAccessFeature('whalePredictions')) {
      return [];
    }
    
    // Free tier: limited predictions
    if (!canAccessFeature('premiumPredictions')) {
      filtered = filtered.slice(0, 3);
    }
    
    return filtered;
  };

  // Add delay for free tier
  const processedPredictions = getFilteredPredictions().map(p => ({
    ...p,
    isDelayed: !canAccessFeature('realTimePredictions')
  }));

  if (!canAccessFeature('whalePredictions')) {
    return (
      <AppLayout>
        <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
          <div className="p-4">
            <Card className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-4">
                Whale Predictions & Scenarios requires a Premium subscription
              </p>
              <Button onClick={() => window.location.href = '/subscription'}>
                Upgrade to Premium
              </Button>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false}>
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Predictions & Scenarios</h1>
                <p className="text-sm text-muted-foreground">AI-powered whale behavior analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <ModelPerformanceSummary />
              </div>
              <ExportReportButtons predictions={predictions} />
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="predictions">
                Predictions
                <span className="ml-2 text-xs opacity-75 hidden md:inline">What's happening now?</span>
              </TabsTrigger>
              <TabsTrigger value="scenarios">
                Scenarios
                <span className="ml-2 text-xs opacity-75 hidden md:inline">What could happen if...?</span>
              </TabsTrigger>
              <TabsTrigger value="alerts">
                Alerts
                <span className="ml-2 text-xs opacity-75 hidden md:inline">Stay notified</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="space-y-4">
              {/* Sub-tabs for Today vs History */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
                <Button
                  variant={predictionsSubTab === 'today' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPredictionsSubTab('today')}
                  className="px-4"
                >
                  Today's Signals
                </Button>
                <Button
                  variant={predictionsSubTab === 'history' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPredictionsSubTab('history')}
                  className="px-4"
                >
                  History
                </Button>
              </div>

              {predictionsSubTab === 'today' ? (
                <TodaysSignals 
                  predictions={processedPredictions}
                  isFreeTier={!canAccessFeature('realTimePredictions')}
                />
              ) : (
                <PredictionHistory />
              )}

              {/* Enterprise Teaser */}
              <EnterpriseTeaser />
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-4">
              {canAccessFeature('scenarioBuilder') ? (
                <>
                  <ScenarioComparison />
                  <ScenarioResults results={scenarioResults} />
                </>
              ) : (
                <Card className="p-8 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Pro Feature</h3>
                  <p className="text-muted-foreground mb-4">
                    Scenario Builder requires a Pro subscription
                  </p>
                  <Button onClick={() => window.location.href = '/subscription'}>
                    Upgrade to Pro
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsManager />
            </TabsContent>
          </Tabs>

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
    </AppLayout>
  );
}