import React, { useState } from "react";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScannerEmptyState } from "@/components/scanner/ScannerEmptyState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";



export default function Scanner() {
  const { userPlan, canAccessFeature, getUpgradeMessage } = useSubscription();
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  const scannerAccess = canAccessFeature('riskScanner');
  const canUsePremiumScanner = scannerAccess === 'full';

  const handleScan = async () => {
    if (!walletAddress) return;
    
    setIsScanning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('riskScan', {
        body: { walletAddress, userId: null }
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
        flags: filteredRiskFactors.map((factor: string) => ({
          type: "warning",
          message: factor
        })),
        recommendations: data.recommendations || [],
        breakdown: {
          liquidity: data.analysis?.currentBalance > 1 ? 8 : 2,
          history: data.analysis?.walletAge >= 1 ? Math.min(9, data.analysis.walletAge) : 1,
          associations: data.analysis?.uniqueContracts > 10 ? 7 : data.analysis?.uniqueContracts || 3,
          volatility: volatilityScore,
        },
        analysis: data.analysis,
        scanTimestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error scanning wallet:', error);
      setScanResult({ error: error.message || 'Failed to scan wallet' });
    } finally {
      setIsScanning(false);
    }
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

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4">
        <PlanBadge plan={userPlan.plan} />
        {!canUsePremiumScanner ? (
          <UpgradePrompt
            feature="AI-Powered Risk Scanner"
            message={getUpgradeMessage('riskScanner')}
            requiredPlan="premium"
            className="max-w-md mx-auto mt-8"
          />
        ) : (
          <div>
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
              <ScannerEmptyState type="initial" />
            )}

            {isScanning && (
              <Card className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Scanning Wallet...</h2>
                <p className="text-muted-foreground">
                  Analyzing transaction history and risk factors
                </p>
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
              <div className="space-y-4">
                {/* Risk Score */}
                <Card className="p-6">
                  <div className="text-center mb-4">
                    <div className={`text-4xl font-bold mb-2 ${getRiskColorByScore(scanResult.riskScore)}`}>
                      {scanResult.riskScore}/10
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {React.createElement(getRiskIcon(scanResult.riskScore), { 
                        size: 20, 
                        className: getRiskColor(scanResult.riskLevel) 
                      })}
                      <span className="text-lg font-semibold text-foreground capitalize">
                        {scanResult.riskLevel} Risk
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
                      <div className="text-xl font-bold text-foreground">
                        {scanResult.totalValue > 0 ? `${scanResult.totalValue.toFixed(4)} ETH` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Avg Transaction</div>
                      <div className="text-xl font-bold text-foreground">
                        {scanResult.avgTxValue > 0 ? `${scanResult.avgTxValue.toFixed(4)} ETH` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Risk Breakdown */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Risk Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(scanResult.breakdown).map(([category, score]) => {
                      const scoreValue = score as number;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize text-foreground">{category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  scoreValue >= 8 ? "bg-success" : 
                                  scoreValue >= 6 ? "bg-warning" : "bg-destructive"
                                }`}
                                style={{ width: `${scoreValue * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-foreground w-8">{scoreValue}/10</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Risk Factors */}
                {scanResult.flags.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-4">Risk Factors</h3>
                    <div className="space-y-2">
                      {scanResult.flags.map((flag: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <AlertTriangle size={16} className="text-warning mt-0.5" />
                          <span className="text-sm text-foreground">{flag.message}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recommendations */}
                {scanResult.recommendations?.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-4">Recommendations</h3>
                    <div className="space-y-2">
                      {scanResult.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                          <CheckCircle size={16} className="text-primary mt-0.5" />
                          <span className="text-sm text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Analysis Details */}
                {scanResult.analysis && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-4">Wallet Analysis</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Transactions:</span>
                        <span className="ml-2 font-medium">{scanResult.analysis.totalTransactions?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wallet Age:</span>
                        <span className="ml-2 font-medium">{scanResult.analysis.walletAge} years</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recent Activity:</span>
                        <span className="ml-2 font-medium">{scanResult.analysis.recentActivity} txns</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unique Contracts:</span>
                        <span className="ml-2 font-medium">{scanResult.analysis.uniqueContracts}</span>
                      </div>
                    </div>
                  </Card>
                )}
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   );
 }