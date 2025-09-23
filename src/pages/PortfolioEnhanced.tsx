import { useState, useEffect } from 'react';
import { Briefcase, Plus, RefreshCw, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureGate, ProFeature, InstitutionalFeature } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Enhanced Portfolio Components
import { PortfolioOverviewCard } from '@/components/portfolio/PortfolioOverviewCard';
import { ChainBreakdownChart } from '@/components/portfolio/ChainBreakdownChart';
import { ConcentrationRiskCard } from '@/components/portfolio/ConcentrationRiskCard';
import { BenchmarkComparison } from '@/components/portfolio/BenchmarkComparison';
import { RiskIntelligenceCard } from '@/components/portfolio/RiskIntelligenceCard';
import { LiquidityUnlockTracker } from '@/components/portfolio/LiquidityUnlockTracker';
import { PortfolioSimulation } from '@/components/portfolio/PortfolioSimulation';
import { WhaleInteractionLog } from '@/components/portfolio/WhaleInteractionLog';
import { ShareableReports } from '@/components/portfolio/ShareableReports';

// Existing Components
import { AddAddressModal } from '@/components/portfolio/AddAddressModal';
import { AddressCard } from '@/components/portfolio/AddressCard';

// Hooks
import { useEnhancedPortfolio } from '@/hooks/useEnhancedPortfolio';

interface MonitoredAddress {
  id: string;
  address: string;
  label: string;
  group?: string;
  totalValue: number;
  pnl: number;
  riskScore: number;
  whaleInteractions: number;
  lastActivity: Date;
  holdings: Array<{
    token: string;
    amount: number;
    value: number;
    change24h: number;
  }>;
}

export default function PortfolioEnhanced() {
  const [addresses, setAddresses] = useState<MonitoredAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');
  const [whaleFilter, setWhaleFilter] = useState('all');
  
  const addressList = addresses.map(a => a.address);
  const { data: portfolioData, loading, error, refetch, simulateScenario } = useEnhancedPortfolio(addressList);
  const { subscription } = useSubscription();

  useEffect(() => {
    // Load saved addresses from localStorage
    const saved = localStorage.getItem('portfolio-addresses');
    if (saved) {
      setAddresses(JSON.parse(saved));
    } else {
      // Add sample addresses for demo
      const sampleAddresses = [
        {
          id: 'sample-1',
          address: '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
          label: 'Main Wallet',
          group: 'personal',
          totalValue: 75000,
          pnl: 5.2,
          riskScore: 7.5,
          whaleInteractions: 3,
          lastActivity: new Date(),
          holdings: []
        },
        {
          id: 'sample-2',
          address: '0x8ba1f109551bD432803012645Hac136c22C57592',
          label: 'Trading Wallet',
          group: 'trading',
          totalValue: 50000,
          pnl: -2.1,
          riskScore: 6.8,
          whaleInteractions: 5,
          lastActivity: new Date(),
          holdings: []
        }
      ];
      setAddresses(sampleAddresses);
    }
  }, []);

  const handleAddAddress = (newAddress: any) => {
    const updated = [...addresses, {
      id: Date.now().toString(),
      ...newAddress,
      totalValue: 0,
      pnl: 0,
      riskScore: 5,
      whaleInteractions: 0,
      lastActivity: new Date(),
      holdings: []
    }];
    setAddresses(updated);
    localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
  };

  const handleRemoveAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
  };

  // Mock functions for report generation
  const generatePDFReport = async (): Promise<Blob> => {
    // In real implementation, this would generate a PDF
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  };

  const generateImageSnapshot = async (): Promise<Blob> => {
    // In real implementation, this would generate an image
    return new Blob(['Mock image content'], { type: 'image/png' });
  };

  if (loading && !portfolioData) {
    return (
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Portfolio Intelligence</h1>
                <p className="text-sm text-muted-foreground">
                  Institutional-grade portfolio analytics with whale intelligence
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={refetch} 
                disabled={loading}
                className="hover:bg-[#14B8A6]/10 flex-shrink-0"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="bg-[#14B8A6] hover:bg-[#0F9488] flex-shrink-0" 
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Address</span>
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Portfolio Overview */}
          {portfolioData && (
            <PortfolioOverviewCard
              totalValue={portfolioData.totalValue}
              pnl24h={portfolioData.pnl24h}
              pnlPercent={portfolioData.pnlPercent}
              riskScore={portfolioData.riskScore}
              riskChange={portfolioData.riskChange}
              whaleActivity={portfolioData.whaleActivity}
            />
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="simulation">Stress Test</TabsTrigger>
              <TabsTrigger value="whale">Whale Activity</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {portfolioData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChainBreakdownChart 
                    data={portfolioData.chainBreakdown}
                    totalValue={portfolioData.totalValue}
                  />
                  <ProFeature>
                    <ConcentrationRiskCard
                      topTokens={portfolioData.topTokens}
                      concentrationScore={portfolioData.concentrationScore}
                      diversificationTrend={portfolioData.diversificationTrend}
                    />
                  </ProFeature>
                </div>
              )}
              
              {portfolioData && (
                <ProFeature>
                  <BenchmarkComparison
                    data={portfolioData.benchmarkData}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    comparisons={[
                      { name: 'Portfolio', performance: portfolioData.pnlPercent, outperformance: 0, color: '#14B8A6' },
                      { name: 'Ethereum', performance: 8.5, outperformance: portfolioData.pnlPercent - 8.5, color: '#627EEA' },
                      { name: 'Bitcoin', performance: 6.2, outperformance: portfolioData.pnlPercent - 6.2, color: '#F7931A' },
                      { name: 'Solana', performance: 12.1, outperformance: portfolioData.pnlPercent - 12.1, color: '#9945FF' }
                    ]}
                  />
                </ProFeature>
              )}
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              {portfolioData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProFeature>
                    <RiskIntelligenceCard
                      overallRiskScore={portfolioData.riskScore}
                      riskTrend={portfolioData.riskChange}
                      riskFactors={portfolioData.riskFactors}
                      whaleInfluence={portfolioData.whaleInfluence}
                      marketCorrelation={portfolioData.marketCorrelation}
                      liquidityRisk={portfolioData.liquidityRisk}
                    />
                  </ProFeature>
                  <ProFeature>
                    <LiquidityUnlockTracker
                      upcomingUnlocks={portfolioData.upcomingUnlocks}
                      liquidityData={portfolioData.liquidityData}
                      totalUnlockValue={portfolioData.upcomingUnlocks.reduce((sum, unlock) => sum + unlock.value, 0)}
                    />
                  </ProFeature>
                </div>
              )}
            </TabsContent>

            <TabsContent value="simulation" className="space-y-6">
              {portfolioData && (
                <InstitutionalFeature>
                  <PortfolioSimulation
                    currentValue={portfolioData.totalValue}
                    onSimulate={simulateScenario}
                  />
                </InstitutionalFeature>
              )}
            </TabsContent>

            <TabsContent value="whale" className="space-y-6">
              {portfolioData && (
                <div className="space-y-6">
                  <WhaleInteractionLog
                    interactions={portfolioData.whaleInteractions.slice(0, subscription.tier === 'free' ? 5 : -1)}
                    onFilterChange={setWhaleFilter}
                    currentFilter={whaleFilter}
                  />
                  
                  <FeatureGate feature="export.pdf">
                    <ShareableReports
                      portfolioData={{
                        totalValue: portfolioData.totalValue,
                        pnl24h: portfolioData.pnlPercent,
                        riskScore: portfolioData.riskScore,
                        topHoldings: portfolioData.topTokens,
                        whaleActivity: portfolioData.whaleActivity,
                        timestamp: new Date()
                      }}
                      onGeneratePDF={generatePDFReport}
                      onGenerateImage={generateImageSnapshot}
                    />
                  </FeatureGate>
                </div>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Monitored Addresses</h2>
                  <Button 
                    onClick={() => setShowAddModal(true)} 
                    className="bg-[#14B8A6] hover:bg-[#0F9488]"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
                
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <AddressCard 
                        key={address.id} 
                        address={address}
                        onRemove={handleRemoveAddress}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Addresses Monitored</h3>
                    <p className="text-muted-foreground mb-4">
                      Add wallet addresses to unlock portfolio intelligence features
                    </p>
                    <Button 
                      onClick={() => setShowAddModal(true)} 
                      className="bg-[#14B8A6] hover:bg-[#0F9488]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Mobile Sticky Add Button */}
          <div className="md:hidden fixed bottom-24 right-4 z-40">
            <Button 
              onClick={() => setShowAddModal(true)} 
              className="bg-[#14B8A6] hover:bg-[#0F9488] shadow-lg h-12 w-12 rounded-full p-0"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          {/* Add Address Modal */}
          <AddAddressModal 
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddAddress}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}