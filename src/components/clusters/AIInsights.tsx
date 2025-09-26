import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AIInsightsProps {
  cluster: {
    type: string;
    riskScore: number;
    confidence: number;
    totalValue: number;
    netFlow: number;
    name: string;
  };
}

export function AIInsights({ cluster }: AIInsightsProps) {
  const getInsight = () => {
    const { type, riskScore, totalValue, netFlow } = cluster;
    
    switch (type) {
      case 'DORMANT_WAKING':
        return {
          icon: <Activity className="w-4 h-4" />,
          title: "Dormant Wallets Awakening",
          explanation: `Old wallets holding ${(totalValue / 1000000).toFixed(1)}M are becoming active. This often signals major market moves as long-term holders decide to trade.`,
          implication: riskScore > 70 ? "High risk of sell pressure" : "Moderate market activity expected",
          color: riskScore > 70 ? "text-red-600" : "text-yellow-600"
        };
      case 'CEX_INFLOW':
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          title: "Exchange Inflow Pattern", 
          explanation: `Whales moved ${Math.abs(netFlow / 1000000).toFixed(1)}M to exchanges. Large exchange deposits typically precede selling activity.`,
          implication: "Potential sell pressure building",
          color: "text-red-600"
        };
      case 'ACCUMULATION':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          title: "Accumulation Activity",
          explanation: `Whales accumulated ${(totalValue / 1000000).toFixed(1)}M worth of assets. This could signal confidence or preparation for market manipulation.`,
          implication: riskScore > 70 ? "Watch for coordinated moves" : "Bullish accumulation detected",
          color: riskScore > 70 ? "text-yellow-600" : "text-green-600"
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          title: "Whale Activity Detected",
          explanation: `Significant whale movement of ${(totalValue / 1000000).toFixed(1)}M detected in this cluster.`,
          implication: "Monitor for market impact",
          color: "text-blue-600"
        };
    }
  };

  const insight = getInsight();

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {insight.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-sm">AI Analysis</h4>
              <Badge variant="outline" className="text-xs">
                {cluster.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {insight.explanation}
            </p>
            <p className={`text-sm font-medium ${insight.color}`}>
              💡 {insight.implication}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}