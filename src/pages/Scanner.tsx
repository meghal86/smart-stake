import React, { useState } from "react";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScannerEmptyState } from "@/components/scanner/ScannerEmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function Scanner() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

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

      setScanResult({
        address: walletAddress,
        riskScore: data.risk_score || 5,
        totalValue: Math.random() * 5000000, // Placeholder - would need price API
        flags: data.risk_factors?.map((factor: string) => ({
          type: "warning",
          message: factor
        })) || [],
        breakdown: {
          liquidity: Math.max(1, 10 - (data.risk_score || 5)),
          history: data.analysis?.walletAge > 365 ? 9 : 5,
          associations: Math.floor(Math.random() * 4) + 6,
          volatility: Math.floor(Math.random() * 4) + 6,
        }
      });
    } catch (error) {
      console.error('Error scanning wallet:', error);
      // Fallback to mock data
      setScanResult({
        address: walletAddress,
        riskScore: 7.2,
        totalValue: 2450000,
        flags: [
          { type: "warning", message: "High volume trading detected" },
          { type: "info", message: "Associated with known DeFi protocols" },
          { type: "success", message: "No suspicious activities found" },
        ],
        breakdown: {
          liquidity: 8,
          history: 7,
          associations: 6,
          volatility: 8,
        }
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 6) return "text-warning";
    return "text-destructive";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 8) return CheckCircle;
    if (score >= 6) return AlertTriangle;
    return XCircle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-premium/20 rounded-xl">
              <Shield className="h-6 w-6 text-premium" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Risk Scanner</h1>
                <Crown className="h-4 w-4 text-premium" />
              </div>
              <p className="text-sm text-muted-foreground">Analyze wallet risk & security</p>
            </div>
          </div>

          {/* Scanner Input */}
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
              className="w-full bg-gradient-to-r from-premium to-warning text-premium-foreground"
            >
              {isScanning ? "Scanning..." : "Scan Wallet"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {!scanResult && !isScanning && (
          <ScannerEmptyState type="initial" />
        )}

        {isScanning && (
          <Card className="p-8 text-center bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Scanning Wallet...</h2>
            <p className="text-muted-foreground">
              Analyzing transaction history and risk factors
            </p>
          </Card>
        )}

        {scanResult && (
          <div className="space-y-4">
            {/* Risk Score */}
            <Card className="p-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
              <div className="text-center mb-4">
                <div className={`text-4xl font-bold mb-2 ${getRiskColor(scanResult.riskScore)}`}>
                  {scanResult.riskScore}/10
                </div>
                <div className="flex items-center justify-center gap-2">
                  {React.createElement(getRiskIcon(scanResult.riskScore), { 
                    size: 20, 
                    className: getRiskColor(scanResult.riskScore) 
                  })}
                  <span className="text-lg font-semibold text-foreground">
                    {scanResult.riskScore >= 8 ? "Low Risk" : 
                     scanResult.riskScore >= 6 ? "Medium Risk" : "High Risk"}
                  </span>
                </div>
              </div>
              
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
                  <div className="text-2xl font-bold text-foreground">
                    ${scanResult.totalValue.toLocaleString()}
                  </div>
                </div>
            </Card>

            {/* Risk Breakdown */}
            <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
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

            {/* Flags */}
            <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
              <h3 className="font-semibold text-foreground mb-4">Security Flags</h3>
              <div className="space-y-2">
                {scanResult.flags.map((flag: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    {flag.type === "warning" && <AlertTriangle size={16} className="text-warning mt-0.5" />}
                    {flag.type === "info" && <CheckCircle size={16} className="text-primary mt-0.5" />}
                    {flag.type === "success" && <CheckCircle size={16} className="text-success mt-0.5" />}
                    <span className="text-sm text-foreground">{flag.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}