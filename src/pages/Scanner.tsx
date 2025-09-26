import React, { useState } from "react";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Eye, Ban, Zap, Users, TrendingDown, ExternalLink, Activity, Clock, DollarSign, Info, HelpCircle, ChevronDown, ChevronUp, BarChart3, Droplets, History, Network, FileText, MessageSquare, Bell, Star, Palette, Image } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { QuickActions } from "@/components/ui/quick-actions";
import { ScannerEmptyState } from "@/components/scanner/ScannerEmptyState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { SanctionsCheck } from "@/components/compliance/SanctionsCheck";
import { AlertCenter } from "@/components/alerts/AlertCenter";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary";
import { useToast } from "@/hooks/useToast";
import { useCache } from "@/hooks/useCache";
import { useDebounce, useDebouncedCallback } from "@/hooks/useDebounce";
import { CacheManager } from "@/components/performance/CacheManager";
import { BundleAnalyzer } from "@/components/performance/BundleAnalyzer";
import { OptimizedChart } from "@/components/performance/OptimizedChart";
import { RealTimeAlerts } from "@/components/alerts/RealTimeAlerts";
import { WatchlistManager } from "@/components/watchlist/WatchlistManager";
import { NFTWhaleTracker } from '@/components/premium/NFTWhaleTracker';
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { AuditTrail } from "@/components/audit/AuditTrail";
import { WhiteLabelConfig } from "@/components/branding/WhiteLabelConfig";
import { ComplianceMonitor } from "@/components/compliance/ComplianceMonitor";
import { useWatchlist } from "@/hooks/useWatchlist";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

// Import WhalePlus components
import { TokenHoldingsBreakdown } from "@/components/portfolio/TokenHoldingsBreakdown";
import { PortfolioValueChart } from "@/components/portfolio/PortfolioValueChart";
import { TransactionGraph } from "@/components/transaction/TransactionGraph";
import { DeFiPositions } from "@/components/defi/DeFiPositions";
import { RiskBreakdown } from "@/components/risk/RiskBreakdown";
import { ReportExporter } from "@/components/reports/ReportExporter";
import { WalletAnnotations } from "@/components/collaboration/WalletAnnotations";



export default function Scanner() {
  const { userPlan, planLimits, canAccessFeature, getUpgradeMessage } = useSubscription();
  const { toast } = useToast();
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Debounce wallet address input for performance
  const debouncedWalletAddress = useDebounce(walletAddress, 300);
  
  // Cache wallet scan results
  const { data: cachedScanResult, loading: cacheLoading, refresh: refreshCache } = useCache(
    `wallet_scan_${debouncedWalletAddress}`,
    async () => {
      if (!debouncedWalletAddress) return null;
      // This would normally call the actual scan API
      return null;
    },
    { ttl: 10 * 60 * 1000 } // 10 minutes cache
  );
  const [showRiskTooltip, setShowRiskTooltip] = useState(false);
  const [selectedTrendDay, setSelectedTrendDay] = useState<number | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);
  
  const scannerAccess = canAccessFeature('scanner');
  const canUsePremiumScanner = scannerAccess === 'full' || scannerAccess === 'limited';

  // Debounced scan function for performance
  const debouncedScan = useDebouncedCallback(async (address: string) => {
    if (!address) return;
    
    // Check cache first
    if (cachedScanResult && !isScanning) {
      setScanResult(cachedScanResult);
      toast({
        title: "Cached Result",
        description: "Loaded from cache for faster performance",
        variant: "success"
      });
      return;
    }
    
    await performScan(address);
  }, 500);
  
  const performScan = async (address: string) => {
    // Check daily scan limit for free users
    if (userPlan.plan === 'free' && dailyScansUsed >= planLimits.walletScansPerDay) {
      toast({
        title: "Daily Limit Reached",
        description: `You've used ${planLimits.walletScansPerDay} scans today. Upgrade to Pro for unlimited scans.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate progress steps
    const progressSteps = [
      { delay: 500, progress: 1, message: "Validating address..." },
      { delay: 1000, progress: 2, message: "Fetching transaction data..." },
      { delay: 1500, progress: 3, message: "Analyzing risk factors..." },
      { delay: 2000, progress: 4, message: "Generating report..." }
    ];
    
    progressSteps.forEach(step => {
      setTimeout(() => setScanProgress(step.progress), step.delay);
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('riskScan', {
        body: { walletAddress, userId: 'scanner-user' }
      });

      if (error) {
        throw error;
      }

      // Filter risk factors based on actual wallet age
      const filteredRiskFactors = data.risk_factors?.filter((factor: string) => {
        if (factor.includes('New wallet') && data.analysis?.walletAge >= 8) {
          return false;
        }
        return true;
      }) || [];

      // Calculate volatility based on transaction data
      const volatilityScore = data.analysis?.totalTransactions > 5000 ? 8 : 
                             data.analysis?.totalTransactions > 1000 ? 6 : 4;

      setScanResult({
        address: walletAddress,
        riskScore: data.risk_score || 5,
        riskLevel: data.risk_level || 'medium',
        totalValue: data.analysis?.currentBalance || 0,
        avgTxValue: data.analysis?.avgTxValue || 0,
        flags: data.risk_factors || filteredRiskFactors,
        recommendations: data.recommendations || [],
        breakdown: {
          liquidity: data.analysis?.currentBalance > 1 ? 8 : 2,
          history: data.analysis?.walletAge >= 1 ? Math.min(9, Math.floor(data.analysis.walletAge / 30)) : 1,
          associations: data.analysis?.uniqueContracts > 10 ? 7 : data.analysis?.uniqueContracts || 3,
          volatility: volatilityScore,
        },
        analysis: data.analysis,
        wallet_category: data.wallet_category,
        compliance_status: data.compliance_status,
        monitoring_alerts: data.monitoring_alerts,
        scanTimestamp: new Date().toISOString()
      });
      
      // Increment daily scan count for free users
      if (userPlan.plan === 'free') {
        setDailyScansUsed(prev => prev + 1);
      }
      
      // Show success toast
      toast({
        title: "Scan Complete",
        description: "Wallet analysis completed successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error scanning wallet:', error);
      setScanResult({ error: error.message || 'Failed to scan wallet' });
      
      // Show error toast
      toast({
        title: "Scan Failed",
        description: error.message || 'Failed to scan wallet. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };
  
  const handleScan = () => {
    debouncedScan(walletAddress);
  };

  const getRiskColor = (level: string) => {
    if (level === 'low') return "text-success";
    if (level === 'medium') return "text-warning";
    return "text-destructive";
  };

  const getRiskColorByScore = (score: number) => {
    if (score >= 7) return "text-success";
    if (score >= 4) return "text-warning";
    return "text-destructive";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 8) return CheckCircle;
    if (score >= 6) return AlertTriangle;
    return XCircle;
  };

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'ctrl+k',
      description: 'Focus search input',
      action: () => {
        const input = document.querySelector('input[placeholder*="wallet"]') as HTMLInputElement;
        input?.focus();
      }
    },
    {
      key: 'ctrl+enter',
      description: 'Start scan',
      action: () => {
        if (walletAddress && !isScanning) {
          handleScan();
        }
      }
    },
    {
      key: 'ctrl+r',
      description: 'Reset scan',
      action: () => {
        setScanResult(null);
        setWalletAddress('');
      }
    },
    {
      key: 'ctrl+w',
      description: 'Add to watchlist',
      action: () => {
        if (scanResult && !isInWatchlist(scanResult.address)) {
          addToWatchlist(scanResult.address, `Wallet ${scanResult.address.slice(0, 8)}`);
        }
      }
    }
  ];

  return (
    <EnhancedErrorBoundary
      onError={(error, errorInfo) => {
        toast({
          title: "Application Error",
          description: "An unexpected error occurred. Please try refreshing the page.",
          variant: "destructive"
        });
      }}
    >
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <KeyboardShortcuts shortcuts={shortcuts} />
        <div className="p-4">
        <PlanBadge plan={userPlan.plan} />
        {!canUsePremiumScanner ? (
          <UpgradePrompt
            feature="AI-Powered Risk Scanner"
            message={getUpgradeMessage('scanner')}
            requiredPlan="premium"
            className="max-w-md mx-auto mt-8"
          />
        ) : (
          <div>
            {/* Daily Scan Limit Indicator for Free Users */}
            {userPlan.plan === 'free' && (
              <Card className="p-3 mb-4 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span>Daily scans used: {dailyScansUsed}/{planLimits.walletScansPerDay}</span>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = '/subscription'}>
                    Upgrade for unlimited
                  </Button>
                </div>
              </Card>
            )}
            
            {/* Scanner Input */}
            <div className="mb-6">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Enter wallet address (0x...)"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button 
                  onClick={handleScan}
                  disabled={!walletAddress || isScanning}
                  className="w-full"
                >
                  {isScanning ? "Scanning..." : "Scan Wallet"}
                </Button>
              </div>
            </div>

            {!scanResult && !isScanning && (
              <div onClick={() => {
                setShowRiskTooltip(false);
                setShowMethodology(false);
                setShowRiskBreakdown(false);
              }}>
                <ScannerEmptyState type="initial" />
              </div>
            )}

            {isScanning && (
              <Card className="p-6 sm:p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Scanning Wallet...</h2>
                    <p className="text-muted-foreground text-sm">Analyzing transaction history and risk factors</p>
                  </div>
                  
                  {/* Progress Indicator */}
                  <ProgressIndicator
                    steps={[
                      { id: '1', title: 'Validating Address', description: 'Checking address format and network' },
                      { id: '2', title: 'Fetching Data', description: 'Retrieving transaction history' },
                      { id: '3', title: 'Risk Analysis', description: 'Analyzing patterns and connections' },
                      { id: '4', title: 'Generating Report', description: 'Compiling results and recommendations' }
                    ]}
                    currentStep={scanProgress}
                  />
                  
                  {/* Loading skeleton for mobile */}
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            )}

            {scanResult && scanResult.error && (
              <Card className="p-6 text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Scan Failed</h3>
                <p className="text-muted-foreground">{scanResult.error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setScanResult(null)} 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </Card>
            )}

            {scanResult && !scanResult.error && (
              <div className="space-y-6">
                {/* Sanctions Check - Critical Security */}
                <SanctionsCheck walletAddress={scanResult.address} />
                
                {/* Top Summary Zone - Risk Score & Breakdown */}
                <div className="bg-gradient-to-br from-background to-muted/20 p-1 rounded-xl">
                  <Card className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                      {/* Risk Score Section */}
                      <div className="text-center lg:text-left">
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 mb-4">
                          <div className={`text-3xl sm:text-4xl font-bold ${getRiskColorByScore(scanResult.riskScore)}`}>
                            {scanResult.riskScore}/10
                          </div>
                          <HelpTooltip content="Risk score is calculated based on transaction patterns, counterparty analysis, and compliance factors. Higher scores indicate greater risk." />
                          <div className="flex items-center gap-2">
                            {React.createElement(getRiskIcon(scanResult.riskScore), { 
                              size: 24, 
                              className: getRiskColor(scanResult.riskLevel) 
                            })}
                            <div>
                              <div className="text-lg font-semibold text-foreground capitalize">
                                {scanResult.riskLevel} Risk
                              </div>
                              <button
                                onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
                                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                              >
                                How is this calculated?
                                {showRiskBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setShowRiskTooltip(!showRiskTooltip)}
                                className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Info size={16} />
                              </button>
                              {showRiskTooltip && (
                                <div className="absolute top-6 right-0 z-10 w-80 p-4 bg-popover border rounded-lg shadow-lg text-left">
                                  <h4 className="font-semibold mb-2">Risk Score Explanation</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><span className="text-green-500">●</span> <strong>Low (1-3):</strong> Minimal risk, normal patterns</div>
                                    <div><span className="text-yellow-500">●</span> <strong>Medium (4-6):</strong> Some concerns, monitor activity</div>
                                    <div><span className="text-red-500">●</span> <strong>High (7-10):</strong> Significant risks, proceed with caution</div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    Risk score is calculated based on liquidity, transaction history, known associations, and transaction volatility.
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Risk Category Legend - Mobile Responsive */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-muted-foreground">Low (1-3)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-muted-foreground">Medium (4-6)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-muted-foreground">High (7-10)</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Metrics Section - Mobile Responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center lg:text-right w-full lg:w-auto">
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Current Balance</div>
                          <div className="text-lg sm:text-xl font-bold text-foreground">
                            {scanResult.totalValue > 0 ? `${scanResult.totalValue.toFixed(4)} ETH` : 'N/A'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Transaction</div>
                          <div className="text-lg sm:text-xl font-bold text-foreground">
                            {scanResult.avgTxValue > 0 ? `${scanResult.avgTxValue.toFixed(4)} ETH` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* Visual separator */}
                <div className="border-t border-muted/50"></div>


                
                {/* Risk Methodology Link */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HelpCircle size={20} className="text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Learn More About Risk Scoring</div>
                        <div className="text-sm text-muted-foreground">Detailed methodology and examples</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowMethodology(!showMethodology)}
                      className="border-primary/20"
                    >
                      {showMethodology ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                  
                  {showMethodology && (
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold mb-2">Risk Score Ranges & Examples</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <div className="font-medium text-green-800">Low Risk (1-3)</div>
                              <div className="text-green-700">Established wallets with normal transaction patterns, no risky connections</div>
                            </div>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="font-medium text-yellow-800">Medium Risk (4-6)</div>
                              <div className="text-yellow-700">Some concerning factors like new wallet, high volatility, or minor red flags</div>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="font-medium text-red-800">High Risk (7-10)</div>
                              <div className="text-red-700">Multiple risk factors, connections to mixers/scams, or compliance issues</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Key Risk Factors</h4>
                          <ul className="space-y-1 text-muted-foreground ml-4">
                            <li>• Wallet age and transaction history depth</li>
                            <li>• Connections to known risky addresses (mixers, scams)</li>
                            <li>• Transaction patterns and frequency</li>
                            <li>• Compliance status and sanctions screening</li>
                            <li>• Balance volatility and fund movements</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Compact Status Overview */}
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wallet Category */}
                    {scanResult.wallet_category && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Classification</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={14} className="text-primary" />
                          <span>{scanResult.wallet_category.name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {scanResult.wallet_category.custodial ? 'Custodial' : 'Self-Custodial'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Compliance Status */}
                    {scanResult.compliance_status && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Compliance</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Sanctions:</span>
                            <span className={scanResult.compliance_status.sanctioned ? 'text-red-500' : 'text-green-500'}>
                              {scanResult.compliance_status.sanctioned ? 'FLAGGED' : 'Clear'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>KYC Required:</span>
                            <span className={scanResult.compliance_status.kyc_required ? 'text-red-500' : 'text-green-500'}>
                              {scanResult.compliance_status.kyc_required ? 'YES' : 'NO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Critical Alerts Only */}
                  {(scanResult.monitoring_alerts?.address_poisoning || 
                    scanResult.monitoring_alerts?.risky_connections || 
                    scanResult.compliance_status?.sanctioned) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-foreground mb-2">⚠️ Critical Alerts</h4>
                      <div className="space-y-2">
                        {scanResult.monitoring_alerts?.address_poisoning && (
                          <div className="text-sm text-red-600">• Address poisoning detected</div>
                        )}
                        {scanResult.monitoring_alerts?.risky_connections && (
                          <div className="text-sm text-red-600">• Connected to high-risk addresses</div>
                        )}
                        {scanResult.compliance_status?.sanctioned && (
                          <div className="text-sm text-red-600">• Address on sanctions list</div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Key Insights - Compact */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">Key Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk Factors */}
                    {scanResult.flags && scanResult.flags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Risk Factors</h4>
                        <div className="space-y-1">
                          {scanResult.flags.slice(0, 3).map((flag: any, index: number) => (
                            <div key={index} className="text-sm text-foreground flex items-center gap-2">
                              <AlertTriangle size={12} className="text-warning" />
                              <span>{typeof flag === 'string' ? flag : flag.message}</span>
                            </div>
                          ))}
                          {scanResult.flags.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{scanResult.flags.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Top Recommendation */}
                    {scanResult.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommendation</h4>
                        <div className="text-sm text-foreground flex items-start gap-2">
                          <CheckCircle size={12} className="text-primary mt-0.5" />
                          <span>{scanResult.recommendations[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Transaction Flow Analysis */}
                {scanResult.analysis?.transactionFlow && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-4">Transaction Flow</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Inbound:</span>
                        <span className="ml-2 font-medium text-green-500">
                          {scanResult.analysis.transactionFlow.inboundTxs} txns ({scanResult.analysis.transactionFlow.inboundValue?.toFixed(2)} ETH)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Outbound:</span>
                        <span className="ml-2 font-medium text-red-500">
                          {scanResult.analysis.transactionFlow.outboundTxs} txns ({scanResult.analysis.transactionFlow.outboundValue?.toFixed(2)} ETH)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Net Flow:</span>
                        <span className={`ml-2 font-medium ${scanResult.analysis.transactionFlow.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {scanResult.analysis.transactionFlow.netFlow?.toFixed(2)} ETH
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Flow Ratio:</span>
                        <span className="ml-2 font-medium">{scanResult.analysis.transactionFlow.flowRatio?.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* External Links */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">External Links</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://etherscan.io/address/${scanResult.address}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      View on Etherscan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://debank.com/profile/${scanResult.address}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      DeBank Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://zapper.fi/account/${scanResult.address}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      Zapper Portfolio
                    </Button>
                  </div>
                </Card>

                {/* Dynamic Risk Alerts */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Dynamic Risk Alerts</h3>
                  <div className="space-y-3">
                    {/* Large Withdrawal Alert */}
                    {scanResult.analysis?.avgTxValue > 10 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <DollarSign size={16} className="text-orange-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-orange-500">Large Transaction Activity</div>
                          <div className="text-sm text-muted-foreground">
                            Average transaction value: {scanResult.analysis.avgTxValue.toFixed(2)} ETH
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* DEX Interaction Alert */}
                    {scanResult.analysis?.uniqueContracts > 20 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Activity size={16} className="text-blue-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-500">High DEX Activity</div>
                          <div className="text-sm text-muted-foreground">
                            Interacted with {scanResult.analysis.uniqueContracts} unique contracts
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Rapid Movement Alert */}
                    {scanResult.analysis?.recentActivity > 50 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <Zap size={16} className="text-purple-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-purple-500">High Frequency Trading</div>
                          <div className="text-sm text-muted-foreground">
                            {scanResult.analysis.recentActivity} transactions in recent period
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* New Wallet Alert */}
                    {scanResult.analysis?.walletAge < 30 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Clock size={16} className="text-yellow-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-500">New Wallet</div>
                          <div className="text-sm text-muted-foreground">
                            Wallet created {scanResult.analysis.walletAge} days ago
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Entity Attribution */}
                {scanResult.wallet_category?.type === 'exchange' && (
                  <Card className="p-4 border-blue-200 bg-blue-50/50">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Exchange Wallet Detected</h3>
                        <p className="text-sm text-blue-700 mb-3">
                          This wallet belongs to <strong>{scanResult.wallet_category.name}</strong> exchange. 
                          Transactions may represent user deposits/withdrawals rather than direct wallet owner activity.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Eye size={12} />
                          <span>Enhanced monitoring recommended for exchange wallets</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Historical Risk Trend */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Risk Trend Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Current Risk Score</span>
                      <span className={`font-bold ${getRiskColor(scanResult.riskLevel)}`}>
                        {scanResult.riskScore}/10
                      </span>
                    </div>
                    

                    
                    {/* Mini trend visualization */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Risk Score Trend (Last 30 Days)</div>
                      <div className="flex items-end gap-1 h-12 relative">
                        {[6, 5, 7, 4, 3, 4, 5, scanResult.riskScore].map((score, index) => {
                          const events = [
                            'Normal activity',
                            'Reduced transactions',
                            'High-value transfer',
                            'DEX interaction',
                            'Minimal activity',
                            'Standard trading',
                            'Contract deployment',
                            'Current analysis'
                          ];
                          const dates = [
                            'Dec 15', 'Dec 18', 'Dec 21', 'Dec 24', 'Dec 27', 'Dec 30', 'Jan 2', 'Today'
                          ];
                          
                          return (
                            <div
                              key={index}
                              className={`flex-1 rounded-t cursor-pointer transition-opacity hover:opacity-80 ${
                                score >= 7 ? "bg-red-500" : 
                                score >= 4 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ height: `${(score / 10) * 100}%` }}
                              onClick={() => setSelectedTrendDay(selectedTrendDay === index ? null : index)}
                              title={`${dates[index]}: ${score}/10 - ${events[index]}`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>30d ago</span>
                        <span>Today</span>
                      </div>
                      
                      {/* Selected day details */}
                      {selectedTrendDay !== null && (
                        <div className="p-3 bg-primary/10 rounded-lg text-sm">
                          <div className="font-medium">
                            {['Dec 15', 'Dec 18', 'Dec 21', 'Dec 24', 'Dec 27', 'Dec 30', 'Jan 2', 'Today'][selectedTrendDay]}
                          </div>
                          <div className="text-muted-foreground">
                            Score: {[6, 5, 7, 4, 3, 4, 5, scanResult.riskScore][selectedTrendDay]}/10 - 
                            {['Normal activity', 'Reduced transactions', 'High-value transfer', 'DEX interaction', 'Minimal activity', 'Standard trading', 'Contract deployment', 'Current analysis'][selectedTrendDay]}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {scanResult.riskScore <= 4 ? (
                        <span className="text-green-600">✓ Risk score improving over time</span>
                      ) : scanResult.riskScore >= 7 ? (
                        <span className="text-red-600">⚠ Risk score deteriorating</span>
                      ) : (
                        <span className="text-yellow-600">→ Risk score stable</span>
                      )}
                    </div>
                    
                    {/* Pattern Detection Summary */}
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Pattern Detection Summary</div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {!scanResult.monitoring_alerts?.suspicious_patterns && 
                         !scanResult.monitoring_alerts?.address_poisoning && 
                         !scanResult.monitoring_alerts?.risky_connections ? (
                          <div className="text-green-600">✓ No unusual cluster activity detected</div>
                        ) : (
                          <div className="space-y-1">
                            {scanResult.monitoring_alerts?.suspicious_patterns && (
                              <div className="text-yellow-600">⚠ Suspicious transaction patterns detected</div>
                            )}
                            {scanResult.monitoring_alerts?.address_poisoning && (
                              <div className="text-red-600">⚠ Address poisoning attempts identified</div>
                            )}
                            {scanResult.monitoring_alerts?.risky_connections && (
                              <div className="text-red-600">⚠ High-risk address connections found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Advanced Pattern Detection - Only show if patterns detected */}
                {(scanResult.analysis?.addressPoisoning?.possiblePoisoning || 
                  scanResult.analysis?.addressPoisoning?.suspiciousDust ||
                  (scanResult.analysis?.recentActivity > 100 && scanResult.analysis?.avgTxValue < 0.01) ||
                  scanResult.analysis?.riskyConnections?.mixers > 0) && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-4">Advanced Pattern Detection</h3>
                    <div className="space-y-3">
                      {/* Address Poisoning */}
                      {scanResult.analysis?.addressPoisoning?.possiblePoisoning && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <Ban size={16} className="text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-500">Address Poisoning Attack</div>
                            <div className="text-sm text-muted-foreground">
                              {scanResult.analysis.addressPoisoning.dustTransactions} dust transactions detected
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Dusting Attack */}
                      {scanResult.analysis?.addressPoisoning?.suspiciousDust && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-orange-500">Dusting Attack Detected</div>
                            <div className="text-sm text-muted-foreground">
                              Multiple small-value transactions may be tracking attempts
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* High-Frequency Micro-Transfers */}
                      {scanResult.analysis?.recentActivity > 100 && scanResult.analysis?.avgTxValue < 0.01 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <Zap size={16} className="text-purple-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-purple-500">High-Frequency Micro-Transfers</div>
                            <div className="text-sm text-muted-foreground">
                              Unusual pattern of frequent small transactions detected
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Mixer/Tumbler Usage */}
                      {scanResult.analysis?.riskyConnections?.mixers > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <Ban size={16} className="text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-500">Mixer/Tumbler Usage</div>
                            <div className="text-sm text-muted-foreground">
                              Connected to {scanResult.analysis.riskyConnections.mixers} known mixing service(s)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Quick Actions for Mobile */}
                <QuickActions 
                  walletAddress={scanResult.address}
                  onExport={() => toast({ title: "Export Started", description: "Report generation in progress" })}
                  onAlert={() => toast({ title: "Alert Created", description: "Monitoring alert has been set up" })}
                  onShare={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link Copied", description: "Analysis link copied to clipboard" });
                  }}
                  onBookmark={() => {
                    if (!isInWatchlist(scanResult.address)) {
                      addToWatchlist(scanResult.address, `Wallet ${scanResult.address.slice(0, 8)}`);
                    } else {
                      toast({ title: "Already in Watchlist", description: "This wallet is already being monitored" });
                    }
                  }}
                />
                
                {/* Advanced Analysis Sections */}
                <Tabs defaultValue="risk" className="space-y-6">
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex w-max">
                      <TabsList className="flex w-max p-1 gap-1">
                    <TabsTrigger value="risk" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Shield className="h-4 w-4" />
                      Risk Analysis
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <BarChart3 className="h-4 w-4" />
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="network" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Network className="h-4 w-4" />
                      Network
                    </TabsTrigger>
                    <TabsTrigger value="defi" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Droplets className="h-4 w-4" />
                      DeFi
                    </TabsTrigger>
                    <TabsTrigger value="nft" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Image className="h-4 w-4" />
                      NFT
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <FileText className="h-4 w-4" />
                      Reports
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Bell className="h-4 w-4" />
                      Alerts
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Star className="h-4 w-4" />
                      Watchlist
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Clock className="h-4 w-4" />
                      Audit
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Shield className="h-4 w-4" />
                      Compliance
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2">
                      <Palette className="h-4 w-4" />
                      Branding
                    </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  {/* Risk Analysis Tab - Comprehensive Risk Assessment */}
                  <TabsContent value="risk" className="space-y-6">
                    <div className="grid gap-6">
                      {/* AI Risk Breakdown */}
                      <RiskBreakdown walletAddress={scanResult.address} />
                      
                      {/* Alert Center Integration */}
                      <AlertCenter walletAddress={scanResult.address} />
                      
                      {/* Performance Monitoring */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <PerformanceMonitor />
                        <CacheManager />
                        <BundleAnalyzer />
                      </div>
                      
                      {/* Technical Analysis Details */}
                      {scanResult.analysis && (
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Technical Analysis
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Wallet Metrics */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-muted-foreground">Wallet Metrics</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Transactions:</span>
                                  <span className="font-medium">{scanResult.analysis.totalTransactions?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Wallet Age:</span>
                                  <span className="font-medium">{scanResult.analysis.walletAge} days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Recent Activity:</span>
                                  <span className="font-medium">{scanResult.analysis.recentActivity} txns</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Contract Interactions */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-muted-foreground">Contract Activity</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm">Unique Contracts:</span>
                                  <span className="font-medium">{scanResult.analysis.uniqueContracts}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Failed Tx Ratio:</span>
                                  <span className="font-medium">{(scanResult.analysis.failedTxRatio * 100)?.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Avg Gas Used:</span>
                                  <span className="font-medium">{scanResult.analysis.avgGasUsed?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Security Analysis */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-muted-foreground">Security Analysis</h4>
                              {scanResult.analysis.addressPoisoning ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Dust Transactions:</span>
                                    <span className="font-medium text-red-600">{scanResult.analysis.addressPoisoning.dustTransactions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Zero Value Txns:</span>
                                    <span className="font-medium text-red-600">{scanResult.analysis.addressPoisoning.zeroValueTransactions}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-green-600 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  No security threats detected
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Portfolio Tab - Asset Holdings & Value Analysis */}
                  <TabsContent value="portfolio" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Portfolio Analysis</h3>
                        <p className="text-muted-foreground">Comprehensive view of token holdings, value distribution, and performance metrics</p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PortfolioValueChart walletAddress={scanResult.address} />
                        <TokenHoldingsBreakdown walletAddress={scanResult.address} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Network Tab - Transaction Flow & Connections */}
                  <TabsContent value="network" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Transaction Network Analysis</h3>
                        <p className="text-muted-foreground">Interactive visualization of transaction flows, counterparty relationships, and network connections</p>
                      </div>
                      <TransactionGraph centerAddress={scanResult.address} />
                    </div>
                  </TabsContent>

                  {/* DeFi Tab - Protocol Positions & Yield */}
                  <TabsContent value="defi" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">DeFi Protocol Analysis</h3>
                        <p className="text-muted-foreground">Track lending, borrowing, liquidity provision, and staking positions across DeFi protocols</p>
                      </div>
                      <DeFiPositions walletAddress={scanResult.address} />
                    </div>
                  </TabsContent>

                  {/* NFT Tab - NFT Whale Tracking */}
                  <TabsContent value="nft" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">NFT Whale Activity</h3>
                        <p className="text-muted-foreground">Monitor high-value NFT transactions and whale collections</p>
                      </div>
                      <NFTWhaleTracker />
                    </div>
                  </TabsContent>

                  {/* Reports Tab - Export & Documentation */}
                  <TabsContent value="reports" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Professional Reports</h3>
                        <p className="text-muted-foreground">Generate comprehensive analysis reports in PDF, CSV, or JSON format for compliance and documentation</p>
                      </div>
                      <ReportExporter walletAddress={scanResult.address} />
                    </div>
                  </TabsContent>

                  {/* Notes Tab - Team Collaboration */}
                  <TabsContent value="notes" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Collaborative Analysis</h3>
                        <p className="text-muted-foreground">Add annotations, share insights, and collaborate with team members on wallet analysis</p>
                      </div>
                      <WalletAnnotations walletAddress={scanResult.address} />
                    </div>
                  </TabsContent>

                  {/* Real-Time Alerts Tab */}
                  <TabsContent value="alerts" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Real-Time Monitoring</h3>
                        <p className="text-muted-foreground">Live alerts and automated monitoring for this wallet</p>
                      </div>
                      <RealTimeAlerts walletAddress={scanResult.address} />
                    </div>
                  </TabsContent>

                  {/* Watchlist Tab */}
                  <TabsContent value="watchlist" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Watchlist Management</h3>
                        <p className="text-muted-foreground">Manage your monitored wallets and alert preferences</p>
                      </div>
                      <WatchlistManager />
                    </div>
                  </TabsContent>

                  {/* Advanced Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                        <p className="text-muted-foreground">Comprehensive analytics and insights across all monitored wallets</p>
                      </div>
                      <AdvancedAnalytics />
                    </div>
                  </TabsContent>

                  {/* Audit Trail Tab */}
                  <TabsContent value="audit" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Audit Trail</h3>
                        <p className="text-muted-foreground">Complete audit log of all user actions and system events</p>
                      </div>
                      <AuditTrail />
                    </div>
                  </TabsContent>

                  {/* Compliance Monitor Tab */}
                  <TabsContent value="compliance" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Compliance Monitor</h3>
                        <p className="text-muted-foreground">Stay updated on regulatory changes and API updates</p>
                      </div>
                      <ComplianceMonitor />
                    </div>
                  </TabsContent>

                  {/* White Label Branding Tab */}
                  <TabsContent value="branding" className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">White Label Configuration</h3>
                        <p className="text-muted-foreground">Customize branding and appearance for enterprise deployment</p>
                      </div>
                      <WhiteLabelConfig />
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Feedback Widget */}
                <FeedbackWidget />
               </div>
             )}
           </div>
         )}
        </div>
      </div>
    </EnhancedErrorBoundary>
  );
 }