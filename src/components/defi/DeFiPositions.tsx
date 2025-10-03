import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Coins, Zap } from 'lucide-react';

interface DeFiPosition {
  protocol: string;
  chain: string;
  positionType: 'lending' | 'borrowing' | 'liquidity' | 'staking';
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  apy: number;
  healthFactor?: number;
  impermanentLoss?: number;
}

interface DeFiPositionsProps {
  walletAddress: string;
}

export function DeFiPositions({ walletAddress }: DeFiPositionsProps) {
  const [positions] = useState<DeFiPosition[]>([
    {
      protocol: 'Aave V3',
      chain: 'Ethereum',
      positionType: 'lending',
      tokenSymbol: 'USDC',
      amount: 50000,
      valueUsd: 50000,
      apy: 4.2,
      healthFactor: 2.5
    },
    {
      protocol: 'Compound',
      chain: 'Ethereum',
      positionType: 'borrowing',
      tokenSymbol: 'ETH',
      amount: 10,
      valueUsd: 25000,
      apy: -3.8,
      healthFactor: 1.8
    },
    {
      protocol: 'Uniswap V3',
      chain: 'Ethereum',
      positionType: 'liquidity',
      tokenSymbol: 'ETH/USDC',
      amount: 1,
      valueUsd: 75000,
      apy: 12.5,
      impermanentLoss: -2.3
    },
    {
      protocol: 'Lido',
      chain: 'Ethereum',
      positionType: 'staking',
      tokenSymbol: 'stETH',
      amount: 25,
      valueUsd: 62500,
      apy: 3.9
    }
  ]);

  const totalValue = positions.reduce((sum, pos) => sum + pos.valueUsd, 0);
  const totalYield = positions.reduce((sum, pos) => sum + (pos.valueUsd * pos.apy / 100), 0);

  const getPositionIcon = (type: string) => {
    switch (type) {
      case 'lending': return <Coins className="h-4 w-4 text-green-600" />;
      case 'borrowing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'liquidity': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'staking': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Coins className="h-4 w-4" />;
    }
  };

  const getHealthColor = (factor?: number) => {
    if (!factor) return 'text-label';
    if (factor > 2) return 'text-green-600';
    if (factor > 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAPYColor = (apy: number) => {
    return apy >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">DeFi Positions</h3>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Value</div>
          <div className="text-xl font-bold">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-green-600">
            +${totalYield.toLocaleString()} Annual Yield
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {positions.map((position, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getPositionIcon(position.positionType)}
                <div>
                  <div className="font-semibold">{position.protocol}</div>
                  <div className="text-sm text-muted-foreground">
                    {position.chain} • {position.positionType}
                  </div>
                </div>
                <Badge variant="outline">{position.tokenSymbol}</Badge>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">${position.valueUsd.toLocaleString()}</div>
                <div className={`text-sm ${getAPYColor(position.apy)}`}>
                  {position.apy > 0 ? '+' : ''}{position.apy}% APY
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-medium">{position.amount.toLocaleString()}</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Allocation:</span>
                <div className="font-medium">{((position.valueUsd / totalValue) * 100).toFixed(1)}%</div>
              </div>

              {position.healthFactor && (
                <div>
                  <span className="text-muted-foreground">Health Factor:</span>
                  <div className={`font-medium ${getHealthColor(position.healthFactor)}`}>
                    {position.healthFactor.toFixed(2)}
                  </div>
                </div>
              )}

              {position.impermanentLoss && (
                <div>
                  <span className="text-muted-foreground">IL:</span>
                  <div className="font-medium text-red-600">
                    {position.impermanentLoss}%
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
              <Progress 
                value={(position.valueUsd / totalValue) * 100} 
                className="h-2"
              />
            </div>

            {position.healthFactor && position.healthFactor < 2 && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Low health factor - consider adding collateral
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-sm text-muted-foreground">Lending</div>
          <div className="font-semibold text-green-600">
            ${positions.filter(p => p.positionType === 'lending').reduce((sum, p) => sum + p.valueUsd, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-sm text-muted-foreground">Borrowing</div>
          <div className="font-semibold text-red-600">
            ${positions.filter(p => p.positionType === 'borrowing').reduce((sum, p) => sum + p.valueUsd, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-sm text-muted-foreground">Liquidity</div>
          <div className="font-semibold text-blue-600">
            ${positions.filter(p => p.positionType === 'liquidity').reduce((sum, p) => sum + p.valueUsd, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <div className="text-sm text-muted-foreground">Staking</div>
          <div className="font-semibold text-purple-600">
            ${positions.filter(p => p.positionType === 'staking').reduce((sum, p) => sum + p.valueUsd, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
}