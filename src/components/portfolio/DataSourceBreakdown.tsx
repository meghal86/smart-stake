import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, TrendingUp, Activity } from 'lucide-react';

interface DataSourceBreakdownProps {
  holdings?: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  totalValue: number;
  isLive: boolean;
}

export function DataSourceBreakdown({ holdings = [], totalValue, isLive }: DataSourceBreakdownProps) {
  const realValue = holdings.filter(h => h.source === 'real').reduce((sum, h) => sum + h.value, 0);
  const simValue = holdings.filter(h => h.source === 'simulated').reduce((sum, h) => sum + h.value, 0);
  
  const realPercent = totalValue > 0 ? (realValue / totalValue) * 100 : 0;
  const simPercent = totalValue > 0 ? (simValue / totalValue) * 100 : 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">📊 Data Sources</h3>
        <Badge variant={isLive ? "default" : "secondary"} className="text-xs">
          {isLive ? "Live System" : "Demo Mode"}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {/* Real Data Section */}
        <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Real Blockchain Data</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-green-700">${realValue.toFixed(0)}</div>
            <div className="text-xs text-green-600">{realPercent.toFixed(1)}%</div>
          </div>
        </div>

        {/* Live Prices Section */}
        <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Live Market Prices</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-700">CoinGecko API</div>
            <div className="text-xs text-blue-600">Real-time</div>
          </div>
        </div>

        {/* Simulated Data Section */}
        <div className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Simulated Balances</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-orange-700">${simValue.toFixed(0)}</div>
            <div className="text-xs text-orange-600">{simPercent.toFixed(1)}%</div>
          </div>
        </div>

        {/* Holdings Breakdown */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Token Breakdown:</div>
          <div className="space-y-1">
            {holdings.slice(0, 5).map((holding, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{holding.token}</span>
                  <Badge 
                    variant={holding.source === 'real' ? 'default' : 'secondary'} 
                    className="text-xs px-1 py-0"
                  >
                    {holding.source === 'real' ? (
                      <><CheckCircle className="h-2 w-2 mr-1" />Real</>
                    ) : (
                      <><Zap className="h-2 w-2 mr-1" />Sim</>
                    )}
                  </Badge>
                </div>
                <span className="font-medium">${holding.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t bg-muted/50 rounded p-2">
          <div className="text-xs text-center">
            <span className="font-medium">Portfolio Total: ${totalValue.toFixed(0)}</span>
            <br />
            <span className="text-muted-foreground">
              {realPercent.toFixed(0)}% Real Data • {simPercent.toFixed(0)}% Simulated • 100% Live Prices
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}