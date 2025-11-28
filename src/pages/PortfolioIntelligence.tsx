import React, { useState, useEffect } from 'react';
import { Shield, Briefcase, RefreshCw, Settings, Download, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Layout Components
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { QuickDock } from '@/components/ui/QuickDock';

// Portfolio Intelligence Components
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { DataLineageCard } from '@/components/portfolio/DataLineageCard';
import { RiskAnalysisPanel } from '@/components/portfolio/RiskAnalysisPanel';
import { StressTest } from '@/components/portfolio/StressTest';
import { GuardianWidget } from '@/components/portfolio/GuardianWidget';
import { ExportProofModal } from '@/components/portfolio/ExportProofModal';

// Existing Components
import { useEnhancedPortfolio } from '@/hooks/useEnhancedPortfolio';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useUIMode } from '@/store/uiMode';

// Mock Guardian API service
const guardianAPI = {
  async scanPortfolio(addresses: string[]) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      trustScore: Math.floor(Math.random() * 40) + 60, // 60-100
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

export default function PortfolioIntelligence() {
  const { addresses, loading: addressesLoading } = useUserAddresses();
  const { mode } = useUIMode();
  const [isGuardianScanning, setIsGuardianScanning] = useState(false);
  const [guardianData, setGuardianData] = useState<unknown>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');

  useEffect(() => {
    // Apply cinematic theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  const addressList = addresses.map(a => a.address);
  const { data: portfolioData, loading, error, refetch } = useEnhancedPortfolio(addressList);

  // Mock data for demonstration
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

  const handleStressTest = async (scenarios: unknown) => {
    // Simulate stress test
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      worstCase: portfolioData?.totalValue ? portfolioData.totalValue * 0.6 : 60000,
      expectedLoss: portfolioData?.totalValue ? portfolioData.totalValue * 0.25 : 25000,
      recoveryTime: 18,
      scenarioResults: Object.entries(scenarios).map(([name, impact]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(),
        impact: Math.abs(impact as number)
      })),
      recoveryPath: Array.from({ length: 24 }, (_, i) => ({
        month: i + 1,
        value: portfolioData?.totalValue ? 
          portfolioData.totalValue * (0.4 + (i / 24) * 0.6) : 
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
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = {
      'is my portfolio clean': `Based on Guardian scan results, your portfolio shows a ${guardianData?.trustScore || 75}% trust score. ${guardianData?.flags?.length || 0} security flags detected. Overall assessment: ${guardianData?.trustScore >= 80 ? 'Clean' : guardianData?.trustScore >= 60 ? 'Moderate Risk' : 'High Risk'}.`,
      'what is my risk': `Your portfolio risk score is ${portfolioData?.riskScore || 6}/10. Key risks include concentration (${mockRiskFactors[0].score}/10) and smart contract exposure (${mockRiskFactors[2].score}/10). Liquidity risk is low at ${mockRiskFactors[1].score}/10.`,
      'should i diversify': `Yes, analysis shows concentration risk at ${mockRiskFactors[0].score}/10. Consider reducing exposure to top holdings and adding uncorrelated assets. Target: <50% in unknown single asset class.`
    };
    
    const query = copilotQuery.toLowerCase();
    const response = Object.entries(responses).find(([key]) => 
      query.includes(key)
    )?.[1] || `I analyzed your query about "${copilotQuery}". Based on current portfolio data: Total value $${portfolioData?.totalValue?.toLocaleString() || '0'}, Risk ${portfolioData?.riskScore || 6}/10, Trust ${guardianData?.trustScore || 75}%. Would you like specific recommendations?`;
    
    setCopilotResponse(response);
  };

  if (loading && !portfolioData) {
    return (
      <LegendaryLayout mode={mode}>
        <Hub2Layout>
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
        </Hub2Layout>
      </LegendaryLayout>
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
                    <h1 className="text-2xl font-bold">Portfolio Intelligence + Guardian Scan</h1>
                    <p className="text-sm text-muted-foreground">
                      Institutional-grade analytics with real-time compliance monitoring
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
                    onClick={handleGuardianScan}
                    disabled={isGuardianScanning || addressList.length === 0}
                    className="flex-shrink-0"
                    size="sm"
                  >
                    <Shield className={`h-4 w-4 ${isGuardianScanning ? 'animate-pulse' : ''}`} />
                    {isGuardianScanning ? 'Scanning...' : 'Guardian Scan'}
                  </Button>
                  <Button 
                    onClick={() => setShowExportModal(true)}
                    className="bg-[#14B8A6] hover:bg-[#0F9488] flex-shrink-0" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export Proof</span>
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Portfolio Header */}
              {portfolioData && (
                <PortfolioHeader
                  totalValue={portfolioData.totalValue || 0}
                  pnl24h={portfolioData.pnlPercent || 0}
                  riskScore={portfolioData.riskScore || 6}
                  trustScore={guardianData?.trustScore || 75}
                  isLive={true}
                />
              )}

              {/* Main Content */}
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
                    overallRiskScore={portfolioData?.riskScore || 6}
                    riskFactors={mockRiskFactors}
                    guardianFlags={mockGuardianFlags}
                    riskTrend={mockRiskTrend}
                    liquidityRisk={mockRiskFactors[1].score}
                    concentrationRisk={mockRiskFactors[0].score}
                    marketCorrelation={7}
                  />
                </div>

                {/* Right Column - Guardian & Tools */}
                <div className="space-y-6">
                  {/* Guardian Widget */}
                  <GuardianWidget
                    trustScore={guardianData?.trustScore || 75}
                    flags={guardianData?.flags || []}
                    scanTimestamp={guardianData?.scanTimestamp || new Date()}
                    isScanning={isGuardianScanning}
                    onRescan={handleGuardianScan}
                  />

                  {/* Copilot Integration */}
                  <div className="bg-gradient-to-br from-background/80 to-muted/20 border border-primary/20 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Copilot</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ask about your portfolio..."
                          value={copilotQuery}
                          onChange={(e) => setCopilotQuery(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-muted rounded-md bg-background"
                          onKeyPress={(e) => e.key === 'Enter' && handleCopilotQuery()}
                        />
                        <Button size="sm" onClick={handleCopilotQuery}>
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {copilotResponse && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                          {copilotResponse}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {['Is my portfolio clean?', 'What is my risk?', 'Should I diversify?'].map((query) => (
                          <button
                            key={query}
                            onClick={() => {
                              setCopilotQuery(query);
                              setTimeout(handleCopilotQuery, 100);
                            }}
                            className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
                          >
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress Test Section */}
              <StressTest
                currentValue={portfolioData?.totalValue || 100000}
                onRunStressTest={handleStressTest}
              />

              {/* Export Modal */}
              <ExportProofModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                portfolioData={{
                  totalValue: portfolioData?.totalValue || 0,
                  riskScore: portfolioData?.riskScore || 6,
                  trustScore: guardianData?.trustScore || 75,
                  timestamp: new Date(),
                  guardianFlags: guardianData?.flags || [],
                  dataLineage: mockDataSources
                }}
              />

              {/* Quick Dock */}
              <QuickDock
                onQuickTrade={() => window.open('https://app.uniswap.org', '_blank')}
                onShareProof={() => setShowExportModal(true)}
                onCopilot={() => {
                  setCopilotQuery('What should I know about my portfolio?');
                  setTimeout(handleCopilotQuery, 100);
                }}
              />
            </div>
          </div>
        </TooltipProvider>
      </Hub2Layout>
    </LegendaryLayout>
  );
}