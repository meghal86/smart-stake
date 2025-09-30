import { useState } from 'react';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TokenHolding {
  address: string;
  symbol: string;
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155';
  balance: number;
  valueUsd: number;
  priceChange24h: number;
  riskScore: number;
  contractVerified: boolean;
}

interface TokenHoldingsBreakdownProps {
  walletAddress: string;
}

export function TokenHoldingsBreakdown({ walletAddress }: TokenHoldingsBreakdownProps) {
  const [holdings] = useState<TokenHolding[]>([
    {
      address: '0xa0b86a33e6c3b4c6c7c8c9c0c1c2c3c4c5c6c7c8',
      symbol: 'ETH',
      type: 'ERC-20',
      balance: 15.5,
      valueUsd: 38750,
      priceChange24h: 2.3,
      riskScore: 1,
      contractVerified: true
    },
    {
      address: '0xa0b86a33e6c3b4c6c7c8c9c0c1c2c3c4c5c6c7c9',
      symbol: 'USDC',
      type: 'ERC-20',
      balance: 25000,
      valueUsd: 25000,
      priceChange24h: 0.1,
      riskScore: 1,
      contractVerified: true
    },
    {
      address: '0xa0b86a33e6c3b4c6c7c8c9c0c1c2c3c4c5c6c7d0',
      symbol: 'BAYC',
      type: 'ERC-721',
      balance: 2,
      valueUsd: 120000,
      priceChange24h: -5.2,
      riskScore: 3,
      contractVerified: true
    }
  ]);

  const totalValue = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0);

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'text-green-600';
    if (score <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (score: number) => {
    if (score <= 2) return <Badge variant="outline" className="text-green-600 border-green-600">Low Risk</Badge>;
    if (score <= 5) return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Medium Risk</Badge>;
    return <Badge variant="outline" className="text-red-600 border-red-600">High Risk</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Token Holdings Breakdown</h3>
        <div className="text-sm text-muted-foreground">
          Total Value: ${totalValue.toLocaleString()}
        </div>
      </div>

      <div className="space-y-4">
        {holdings.map((holding) => (
          <div key={holding.address} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{holding.symbol}</span>
                  <Badge variant="secondary">{holding.type}</Badge>
                  {holding.contractVerified ? (
                    <Shield className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                {getRiskBadge(holding.riskScore)}
              </div>
              
              <div className="text-right">
                <div className="font-semibold">${holding.valueUsd.toLocaleString()}</div>
                <div className={`text-sm flex items-center gap-1 ${
                  holding.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {holding.priceChange24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(holding.priceChange24h)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Balance:</span>
                <div className="font-medium">{holding.balance.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Allocation:</span>
                <div className="font-medium">{((holding.valueUsd / totalValue) * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Risk Score:</span>
                <div className={`font-medium ${getRiskColor(holding.riskScore)}`}>
                  {holding.riskScore}/10
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Progress 
                value={(holding.valueUsd / totalValue) * 100} 
                className="h-2"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}