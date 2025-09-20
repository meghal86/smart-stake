import { useState, useEffect } from 'react';
import { Brain, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductionPredictionCard } from './ProductionPredictionCard';
import { SystemHealthDashboard } from '@/components/monitoring/SystemHealthDashboard';
import { PriceProviderStatus } from './PriceProviderStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface ProductionPrediction {
  id: string;
  asset: string;
  prediction_type: string;
  confidence: number;
  features: Record<string, { score: number }>;
  explanation: string;
  context: {
    whale_count: number;
    tx_count: number;
    net_inflow_usd: number;
  };
  provenance: {
    sources: string[];
    block_number: number;
    window: string;
    queried_at: string;
    tx_hashes_sample: string[];
  };
  quality: {
    status: 'ok' | 'degraded' | 'fallback';
    reason?: string;
  };
}

export function ProductionPredictionsPage() {
  const { user } = useAuth();
  const { userPlan, canAccessFeature } = useSubscription();
  const [predictions, setPredictions] = useState<ProductionPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchPredictions();
    
    // Set refresh interval based on user tier
    const refreshInterval = getRefreshInterval();
    const interval = setInterval(fetchPredictions, refreshInterval);
    
    return () => clearInterval(interval);
  }, [userPlan]);

  const getRefreshInterval = () => {
    switch (userPlan) {
      case 'premium':
      case 'enterprise':
        return 30000; // 30 seconds
      case 'pro':
        return 60000; // 1 minute
      default:
        return 300000; // 5 minutes
    }
  };

  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('whale-predictions', {
        body: { userTier: userPlan }
      });
      
      if (error) throw error;
      
      if (data?.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredPredictions = () => {
    let filtered = predictions;
    
    // Apply tier-based filtering
    if (userPlan === 'free') {
      filtered = filtered.slice(0, 3); // Limit to 3 predictions
    } else if (userPlan === 'pro') {
      filtered = filtered.slice(0, 10); // Limit to 10 predictions
    }
    
    return filtered;
  };

  if (!canAccessFeature('whalePredictions')) {
    return (
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4">
          <div className="max-w-md mx-auto text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">
              Advanced whale predictions require a Premium subscription
            </p>
            <Button onClick={() => window.location.href = '/subscription'}>
              Upgrade to Premium
            </Button>
          </div>
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
              <h1 className="text-xl font-bold">Production Predictions</h1>
              <p className="text-sm text-muted-foreground">
                Institutional-grade whale intelligence • Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPredictions}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier Status */}
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">
                  {userPlan?.toUpperCase()} Plan Active
                </div>
                <div className="text-sm text-blue-700">
                  Refresh rate: {getRefreshInterval() / 1000}s • 
                  Predictions: {userPlan === 'free' ? '3' : userPlan === 'pro' ? '10' : 'Unlimited'} • 
                  Features: {userPlan === 'free' ? 'Basic' : userPlan === 'pro' ? 'Advanced' : 'Enterprise'}
                </div>
              </div>
              {userPlan === 'free' && (
                <Button size="sm">
                  Upgrade for Real-time
                </Button>
              )}
            </div>
          </div>
          
          {/* Price Provider Status */}
          <PriceProviderStatus />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions">Live Predictions</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy Tracking</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            {/* Predictions Grid */}
            <div className="grid gap-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : getFilteredPredictions().length > 0 ? (
                getFilteredPredictions().map((prediction) => (
                  <ProductionPredictionCard 
                    key={prediction.id} 
                    prediction={prediction} 
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Waiting for whale activity data to generate predictions
                  </p>
                  <Button onClick={fetchPredictions} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="accuracy">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Accuracy Tracking</h3>
              <p className="text-muted-foreground">
                Historical prediction accuracy and model performance metrics
              </p>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Deep dive into prediction patterns and market insights
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}