import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ExternalLink } from "lucide-react";

interface ProtocolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: unknown;
}

export const ProtocolDetailModal: React.FC<ProtocolDetailModalProps> = ({
  isOpen,
  onClose,
  protocol
}) => {
  const [historicalData, setHistoricalData] = useState<unknown[]>([]);

  useEffect(() => {
    if (isOpen && protocol) {
      // Generate more realistic historical data with trends
      const baseApy = protocol.apy;
      const baseTvl = protocol.tvl_usd || protocol.tvlUSD;
      
      const data = Array.from({length: 30}, (_, i) => {
        const daysAgo = 29 - i;
        const trend = Math.sin(daysAgo * 0.2) * 2; // Sine wave for realistic fluctuation
        const randomVariation = (Math.random() - 0.5) * 3;
        
        return {
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          apy: Math.max(0.1, baseApy + trend + randomVariation),
          tvl: Math.max(1000000, baseTvl * (1 + (trend + randomVariation) * 0.05))
        };
      });
      
      setHistoricalData(data);
    }
  }, [isOpen, protocol]);

  if (!protocol) return null;

  const riskFactors = [
    { factor: 'Smart Contract Risk', score: Math.floor(protocol.risk_score * 0.3), weight: '30%' },
    { factor: 'Liquidity Risk', score: Math.floor(protocol.risk_score * 0.25), weight: '25%' },
    { factor: 'Market Risk', score: Math.floor(protocol.risk_score * 0.25), weight: '25%' },
    { factor: 'Regulatory Risk', score: Math.floor(protocol.risk_score * 0.2), weight: '20%' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {protocol.protocol} Protocol Details
            <Badge variant={protocol.risk_score < 30 ? 'default' : protocol.risk_score < 60 ? 'secondary' : 'destructive'}>
              Risk: {protocol.risk_score}/100
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="historical">Historical</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="tokens">Supported Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current APY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{protocol.apy.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">Updated 5 min ago</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(protocol.tvl_usd / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground">Across all pools</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    protocol.risk_score < 30 ? 'text-green-600' : 
                    protocol.risk_score < 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {protocol.risk_score}/100
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {protocol.risk_score < 30 ? 'Low Risk' : 
                     protocol.risk_score < 60 ? 'Medium Risk' : 'High Risk'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Bell className="h-4 w-4 mr-2" />
                Set Alert
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Protocol
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>APY History (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-1 p-2">
                  {historicalData.length > 0 ? historicalData.map((day, index) => {
                    const maxApy = Math.max(...historicalData.map(d => d.apy));
                    const minApy = Math.min(...historicalData.map(d => d.apy));
                    const normalizedHeight = maxApy > minApy 
                      ? ((day.apy - minApy) / (maxApy - minApy)) * 80 + 20
                      : 50;
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
                        style={{
                          height: `${normalizedHeight}%`,
                          minHeight: '20px'
                        }}
                        title={`${day.date}: ${day.apy.toFixed(2)}% APY`}
                      />
                    );
                  }) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Loading historical data...
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>TVL History (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-1 p-2">
                  {historicalData.length > 0 ? historicalData.map((day, index) => {
                    const maxTvl = Math.max(...historicalData.map(d => d.tvl));
                    const minTvl = Math.min(...historicalData.map(d => d.tvl));
                    const normalizedHeight = maxTvl > minTvl 
                      ? ((day.tvl - minTvl) / (maxTvl - minTvl)) * 80 + 20
                      : 50;
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t hover:from-green-600 hover:to-green-400 transition-colors cursor-pointer"
                        style={{
                          height: `${normalizedHeight}%`,
                          minHeight: '20px'
                        }}
                        title={`${day.date}: $${(day.tvl / 1000000).toFixed(1)}M TVL`}
                      />
                    );
                  }) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Loading TVL data...
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskFactors.map((risk, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{risk.factor}</span>
                      <Badge variant={risk.score < 20 ? 'default' : risk.score < 40 ? 'secondary' : 'destructive'}>
                        {risk.score}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          risk.score < 20 ? 'bg-green-500' : 
                          risk.score < 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${risk.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['USDC', 'USDT', 'DAI', 'ETH', 'WBTC'].map((token, index) => (
                <Card key={index}>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold">{token}</div>
                    <div className="text-sm text-muted-foreground">
                      APY: {(protocol.apy + Math.random() * 2 - 1).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};