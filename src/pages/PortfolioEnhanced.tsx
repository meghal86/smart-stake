import { useState, useEffect } from 'react';
import { Briefcase, Plus, RefreshCw, Settings, TrendingUp, Shield, Download, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureGate, ProFeature, InstitutionalFeature } from '@/components/subscription/FeatureGate';

// Portfolio Intelligence Components
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { DataLineageCard } from '@/components/portfolio/DataLineageCard';
import { RiskAnalysisPanel } from '@/components/portfolio/RiskAnalysisPanel';
import { StressTest } from '@/components/portfolio/StressTest';
import { GuardianWidget } from '@/components/portfolio/GuardianWidget';
import { ExportProofModal } from '@/components/portfolio/ExportProofModal';
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
import { useProductionPortfolio } from '@/hooks/useProductionPortfolio';
import { LiveDataIndicator } from '@/components/portfolio/LiveDataIndicator';
import { DataSourceBadge } from '@/components/portfolio/DataSourceBadge';
import { SystemHealthIndicator } from '@/components/portfolio/SystemHealthIndicator';
import { TokenSourceChip } from '@/components/portfolio/TokenSourceChip';
import { DataSourceBreakdown } from '@/components/portfolio/DataSourceBreakdown';
import { LiveChainDistribution } from '@/components/portfolio/LiveChainDistribution';
import { LiveConcentrationRisk } from '@/components/portfolio/LiveConcentrationRisk';
import { LiveBenchmarkComparison } from '@/components/portfolio/LiveBenchmarkComparison';
import { LiveRiskIntelligence } from '@/components/portfolio/LiveRiskIntelligence';
import { LiveLiquidityTracker } from '@/components/portfolio/LiveLiquidityTracker';
import { LiveWhaleActivity } from '@/components/portfolio/LiveWhaleActivity';
import { LiveAddressCard } from '@/components/portfolio/LiveAddressCard';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { ProductionStressTest } from '@/components/portfolio/ProductionStressTest';
import { ProvenancePanel } from '@/components/portfolio/ProvenancePanel';
import { AlertsCard } from '@/components/portfolio/AlertsCard';
import { MobileProvenancePanel } from '@/components/portfolio/MobileProvenancePanel';
import { metricsService } from '@/services/MetricsService';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';

import { EnhancedGlassCard } from '@/components/cinematic/EnhancedGlassCard';

import { useUIMode } from '@/store/uiMode';

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
  const { addresses, loading: addressesLoading, addAddress, removeAddress } = useUserAddresses();
  const [showAddModal, setShowAddModal] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');
  const [whaleFilter, setWhaleFilter] = useState('all');
  const [alerts, setAlerts] = useState<Array<Record<string, unknown>>>([]);
  const [dailyAlertUsage, setDailyAlertUsage] = useState(0);
  const [isGuardianScanning, setIsGuardianScanning] = useState(false);
  const [guardianData, setGuardianData] = useState<unknown>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const { mode } = useUIMode();
  
  useEffect(() => {
    // Apply cinematic theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);
  
  const addressList = addresses.map(a => a.address);
  const { data: portfolioData, loading, error, refetch, simulateScenario } = useEnhancedPortfolio(addressList);
  const { data: productionData, loading: prodLoading, isLive, healthStatus, refetch: refetchProd } = useProductionPortfolio(addressList);
  
  // Use production data when available, fallback to mock
  const currentData = productionData || portfolioData;
  const currentLoading = prodLoading || loading || addressesLoading;
  const { subscription } = useSubscription();

  // Mock Guardian API service
  const guardianAPI = {
    async scanPortfolio(addresses: string[]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        trustScore: Math.floor(Math.random() * 40) + 60,
        flags: [
          {
            id: '1',
            type: 'mixer',
            severity: 'medium' as const,
            address: addresses[0] || '0x1234...5678',
            description: 'Interaction with privacy mixer detected',
            timestamp: new Date(),
            source: 'Chainalysis'
          }
        ],
        scanTimestamp: new Date()
      };
    }
  };

  // Mock data for Portfolio Intelligence
  const mockDataSources = [
    {
      name: 'Etherscan API',
      type: 'real' as const,
      status: 'healthy' as const,
      lastUpdate: new Date(),
      coverage: 95
    },
    {
      name: 'CoinGecko Prices',
      type: 'real' as const,
      status: 'healthy' as const,
      lastUpdate: new Date(),
      coverage: 100
    },
    {
      name: 'DeFi Protocols',
      type: 'simulated' as const,
      status: 'degraded' as const,
      lastUpdate: new Date(Date.now() - 300000),
      coverage: 75
    }
  ];

  const mockRiskFactors = [
    {
      name: 'Concentration Risk',
      score: 6,
      trend: 'stable' as const,
      impact: 'medium' as const,
      description: 'Portfolio concentrated in top 3 assets'
    },
    {
      name: 'Liquidity Risk',
      score: 8,
      trend: 'down' as const,
      impact: 'low' as const,
      description: 'High liquidity across major holdings'
    },
    {
      name: 'Smart Contract Risk',
      score: 4,
      trend: 'up' as const,
      impact: 'high' as const,
      description: 'Exposure to unaudited protocols'
    }
  ];

  const mockGuardianFlags = [
    { type: 'mixer', severity: 'medium' as const, count: 2 },
    { type: 'suspicious', severity: 'low' as const, count: 1 }
  ];

  const mockRiskTrend = [
    { date: '2024-01-01', score: 7 },
    { date: '2024-01-02', score: 6.5 },
    { date: '2024-01-03', score: 6.8 },
    { date: '2024-01-04', score: 6.2 },
    { date: '2024-01-05', score: 6.0 }
  ];

  // Addresses are now managed by useUserAddresses hook
  
  // Alert management functions
  const handleCreateAlert = async (alert: Record<string, unknown>) => {
    const newAlert = { ...alert, id: Date.now().toString() };
    setAlerts(prev => [...prev, newAlert]);
    setDailyAlertUsage(prev => prev + 1);
    await metricsService.trackAlertCreated(alert.triggerType, alerts.length === 0);
  };
  
  const handleUpdateAlert = async (id: string, updates: Record<string, unknown>) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };
  
  const handleDeleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAddress = async (newAddress: { address: string; label: string; group?: string }) => {
    try {
      await addAddress({
        address: newAddress.address,
        label: newAddress.label,
        group: newAddress.group
      });
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      await removeAddress(id);
    } catch (error) {
      console.error('Failed to remove address:', error);
    }
  };

  const handleGuardianScan = async () => {
    if (addressList.length === 0) return;
    
    setIsGuardianScanning(true);
    try {
      const result = await guardianAPI.scanPortfolio(addressList);
      setGuardianData(result);
    } catch (error) {
      console.error('Guardian scan failed:', error);
    } finally {
      setIsGuardianScanning(false);
    }
  };

  const handleStressTest = async (scenarios: Record<string, number>) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      worstCase: currentData?.totalValue ? currentData.totalValue * 0.6 : 60000,
      expectedLoss: currentData?.totalValue ? currentData.totalValue * 0.25 : 25000,
      recoveryTime: 18,
      scenarioResults: Object.entries(scenarios).map(([name, impact]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(),
        impact: Math.abs(impact as number)
      })),
      recoveryPath: Array.from({ length: 24 }, (_, i) => ({
        month: i + 1,
        value: currentData?.totalValue ? 
          currentData.totalValue * (0.4 + (i / 24) * 0.6) : 
          40000 + (i * 2500)
      })),
      recommendations: [
        'Diversify into uncorrelated asset classes',
        'Maintain 20% cash reserves for opportunities',
        'Consider hedging strategies for major positions',
        'Implement gradual position sizing adjustments'
      ]
    };
  };

  const handleCopilotQuery = async () => {
    if (!copilotQuery.trim()) return;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = {
      'is my portfolio clean': `Based on Guardian scan results, your portfolio shows a ${guardianData?.trustScore || 75}% trust score. ${guardianData?.flags?.length || 0} security flags detected. Overall assessment: ${guardianData?.trustScore >= 80 ? 'Clean' : guardianData?.trustScore >= 60 ? 'Moderate Risk' : 'High Risk'}.`,
      'what is my risk': `Your portfolio risk score is ${currentData?.riskScore || 6}/10. Key risks include concentration (${mockRiskFactors[0].score}/10) and smart contract exposure (${mockRiskFactors[2].score}/10). Liquidity risk is low at ${mockRiskFactors[1].score}/10.`,
      'should i diversify': `Yes, analysis shows concentration risk at ${mockRiskFactors[0].score}/10. Consider reducing exposure to top holdings and adding uncorrelated assets. Target: <50% in unknown single asset class.`
    };
    
    const query = copilotQuery.toLowerCase();
    const response = Object.entries(responses).find(([key]) => 
      query.includes(key)
    )?.[1] || `I analyzed your query about "${copilotQuery}". Based on current portfolio data: Total value $${currentData?.totalValue?.toLocaleString() || '0'}, Risk ${currentData?.riskScore || 6}/10, Trust ${guardianData?.trustScore || 75}%. Would you like specific recommendations?`;
    
    setCopilotResponse(response);
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
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <TooltipProvider>
          <div style={{ 
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
          }}>

            

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
              <SystemHealthIndicator 
                healthStatus={healthStatus}
                latencyMs={productionData?.meta.latencyMs}
              />
              <LiveDataIndicator
                isLive={isLive}
                lastUpdated={productionData?.meta.lastUpdated?.toISOString()}
                onRefresh={refetchProd}
                loading={prodLoading}
              />
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
                onClick={handleGuardianScan}
                disabled={isGuardianScanning || addressList.length === 0}
                className="flex-shrink-0"
                size="sm"
              >
                <Shield className={`h-4 w-4 ${isGuardianScanning ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline ml-2">{isGuardianScanning ? 'Scanning...' : 'Guardian'}</span>
              </Button>
              <Button 
                onClick={() => setShowExportModal(true)}
                className="bg-[#14B8A6] hover:bg-[#0F9488] flex-shrink-0" 
                size="sm"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Proof</span>
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)} 
                variant="outline"
                className="flex-shrink-0" 
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

          {/* Portfolio Intelligence Header */}
          {currentData && (
            <>
              <PortfolioHeader
                totalValue={currentData.totalValue || 0}
                pnl24h={currentData.pnlPercent || 0}
                riskScore={currentData.riskScore || 6}
                trustScore={guardianData?.trustScore || 75}
                isLive={isLive}
              />
              
              {/* Production Data Source Badge */}
              {productionData && (
                <DataSourceBadge 
                  isLive={isLive}
                  simVersion={productionData.meta.simVersion}
                  lastUpdated={productionData.meta.lastUpdated}
                />
              )}
              

            </>
          )}

          {/* AI Copilot - Prominent Position */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 sm:p-6 space-y-4 max-w-full overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-xl flex-shrink-0">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold">AI Portfolio Copilot</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">Ask questions about your portfolio, risk, and investment strategy</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ask about your portfolio..."
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm border border-primary/20 rounded-lg bg-background/50 focus:bg-background focus:border-primary/40 transition-colors min-w-0"
                  onKeyPress={(e) => e.key === 'Enter' && handleCopilotQuery()}
                />
                <Button onClick={handleCopilotQuery} className="bg-primary hover:bg-primary/90 px-6 whitespace-nowrap">
                  <Zap className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>
              </div>
              
              {copilotResponse && (
                <div className="p-4 bg-background/80 border border-primary/20 rounded-lg max-w-full overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-primary/20 rounded flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-sm leading-relaxed break-words min-w-0">
                      {copilotResponse}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground mr-2 whitespace-nowrap">Try asking:</span>
                {['Is my portfolio clean?', 'What is my risk?', 'Should I diversify?'].map((query) => (
                  <button
                    key={query}
                    onClick={() => {
                      setCopilotQuery(query);
                      setTimeout(handleCopilotQuery, 100);
                    }}
                    className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors whitespace-nowrap"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Intelligence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Data & Risk */}
            <div className="lg:col-span-2 space-y-6">
              {/* Data Lineage */}
              <DataLineageCard
                sources={mockDataSources}
                totalDataPoints={1247}
                realDataPercentage={87.5}
              />

              {/* Risk Analysis */}
              <RiskAnalysisPanel
                overallRiskScore={currentData?.riskScore || 6}
                riskFactors={mockRiskFactors}
                guardianFlags={mockGuardianFlags}
                riskTrend={mockRiskTrend}
                liquidityRisk={mockRiskFactors[1].score}
                concentrationRisk={mockRiskFactors[0].score}
                marketCorrelation={7}
              />
            </div>

            {/* Right Column - Guardian Widget */}
            <div className="space-y-6">
              <GuardianWidget
                trustScore={guardianData?.trustScore || 75}
                flags={guardianData?.flags || []}
                scanTimestamp={guardianData?.scanTimestamp || new Date()}
                isScanning={isGuardianScanning}
                onRescan={handleGuardianScan}
              />
            </div>
          </div>

          {/* Stress Test Section */}
          <StressTest
            currentValue={currentData?.totalValue || 100000}
            onRunStressTest={handleStressTest}
          />

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="simulation">Stress Test</TabsTrigger>
              <TabsTrigger value="whale">Whale Activity</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Chain Distribution */}
                {productionData ? (
                  <LiveChainDistribution 
                    holdings={productionData.holdings}
                    totalValue={productionData.totalValue}
                  />
                ) : portfolioData && (
                  <ChainBreakdownChart 
                    data={portfolioData.chainBreakdown}
                    totalValue={portfolioData.totalValue}
                  />
                )}
                
                {/* Live Concentration Risk */}
                <ProFeature>
                  {productionData ? (
                    <LiveConcentrationRisk 
                      holdings={productionData.holdings}
                      totalValue={productionData.totalValue}
                    />
                  ) : portfolioData && (
                    <ConcentrationRiskCard
                      topTokens={portfolioData.topTokens}
                      concentrationScore={portfolioData.concentrationScore}
                      diversificationTrend={portfolioData.diversificationTrend}
                    />
                  )}
                </ProFeature>
              </div>
              
              <ProFeature>
                {productionData ? (
                  <LiveBenchmarkComparison
                    portfolioValue={productionData.totalValue}
                    pnlPercent={productionData.pnlPercent}
                    holdings={productionData.holdings}
                  />
                ) : portfolioData && (
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
                )}
              </ProFeature>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <AlertsCard
                alerts={alerts}
                onCreateAlert={handleCreateAlert}
                onUpdateAlert={handleUpdateAlert}
                onDeleteAlert={handleDeleteAlert}
                dailyUsage={dailyAlertUsage}
              />
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProFeature>
                  {productionData ? (
                    <LiveRiskIntelligence
                      holdings={productionData.holdings}
                      totalValue={productionData.totalValue}
                      riskScore={productionData.riskScore}
                    />
                  ) : portfolioData && (
                    <RiskIntelligenceCard
                      overallRiskScore={portfolioData.riskScore}
                      riskTrend={portfolioData.riskChange}
                      riskFactors={portfolioData.riskFactors}
                      whaleInfluence={portfolioData.whaleInfluence}
                      marketCorrelation={portfolioData.marketCorrelation}
                      liquidityRisk={portfolioData.liquidityRisk}
                    />
                  )}
                </ProFeature>
                <ProFeature>
                  {productionData ? (
                    <LiveLiquidityTracker
                      holdings={productionData.holdings}
                      totalValue={productionData.totalValue}
                    />
                  ) : portfolioData && (
                    <LiquidityUnlockTracker
                      upcomingUnlocks={portfolioData.upcomingUnlocks}
                      liquidityData={portfolioData.liquidityData}
                      totalUnlockValue={portfolioData.upcomingUnlocks.reduce((sum, unlock) => sum + unlock.value, 0)}
                    />
                  )}
                </ProFeature>
              </div>
            </TabsContent>

            <TabsContent value="simulation" className="space-y-6">
              <InstitutionalFeature>
                {productionData ? (
                  <ProductionStressTest
                    portfolioData={productionData}
                  />
                ) : portfolioData && (
                  <PortfolioSimulation
                    currentValue={portfolioData.totalValue}
                    onSimulate={simulateScenario}
                  />
                )}
              </InstitutionalFeature>
            </TabsContent>

            <TabsContent value="whale" className="space-y-6">
              <div className="space-y-6">
                {productionData ? (
                  <LiveWhaleActivity
                    holdings={productionData.holdings}
                    totalValue={productionData.totalValue}
                    onFilterChange={setWhaleFilter}
                    currentFilter={whaleFilter}
                  />
                ) : portfolioData && (
                  <WhaleInteractionLog
                    interactions={portfolioData.whaleInteractions.slice(0, subscription.tier === 'free' ? 5 : -1)}
                    onFilterChange={setWhaleFilter}
                    currentFilter={whaleFilter}
                  />
                )}
                
                <FeatureGate feature="export.pdf">
                  <ShareableReports
                    portfolioData={{
                      totalValue: currentData?.totalValue || 0,
                      pnl24h: currentData?.pnlPercent || 0,
                      riskScore: currentData?.riskScore || 0,
                      topHoldings: portfolioData?.topTokens || [],
                      whaleActivity: portfolioData?.whaleActivity || 0,
                      timestamp: new Date()
                    }}
                    onGeneratePDF={generatePDFReport}
                    onGenerateImage={generateImageSnapshot}
                  />
                </FeatureGate>
              </div>
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
                    {addresses.map((address, index) => {
                      // Calculate individual address metrics from total portfolio
                      const addressCount = addresses.length;
                      const baseValue = (productionData?.totalValue || 0) / addressCount;
                      
                      // Vary each address value based on address hash for uniqueness
                      const hashValue = parseInt(address.address.slice(2, 10), 16);
                      const variation = (hashValue % 50000) + 25000; // $25K-$75K variation
                      const addressValue = baseValue + variation;
                      
                      // Filter holdings for this address (simulate address-specific holdings)
                      const addressHoldings = productionData?.holdings.map(h => ({
                        ...h,
                        qty: h.qty / addressCount + (hashValue % 100) / 100, // Distribute + variation
                        value: h.value / addressCount + (hashValue % 10000) // Distribute + variation
                      })) || [];
                      
                      const addressPnl = productionData?.pnlPercent || 0;
                      const addressRisk = (productionData?.riskScore || 5) + (hashValue % 3) - 1; // ±1 variation
                      
                      return productionData ? (
                        <LiveAddressCard
                          key={address.id}
                          address={address}
                          holdings={addressHoldings}
                          totalValue={addressValue}
                          pnlPercent={addressPnl}
                          riskScore={Math.max(1, Math.min(10, addressRisk))}
                          onRemove={handleRemoveAddress}
                        />
                      ) : (
                        <AddressCard 
                          key={address.id} 
                          address={address}
                          onRemove={handleRemoveAddress}
                        />
                      );
                    })}
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

          {/* Export Proof Modal */}
          <ExportProofModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            portfolioData={{
              totalValue: currentData?.totalValue || 0,
              riskScore: currentData?.riskScore || 6,
              trustScore: guardianData?.trustScore || 75,
              timestamp: new Date(),
              guardianFlags: guardianData?.flags || [],
              dataLineage: mockDataSources
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  </Hub2Layout>
</LegendaryLayout>
);
}