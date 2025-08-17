import { ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface YieldProtocol {
  id: string;
  name: string;
  apy: number;
  chain: string;
  tvlUSD: number;
  riskScore: number;
  category: string;
}

interface YieldProtocolCardProps {
  protocol: YieldProtocol;
}

export function YieldProtocolCard({ protocol }: YieldProtocolCardProps) {
  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000000) {
      return `$${(tvl / 1000000000).toFixed(2)}B`;
    }
    if (tvl >= 1000000) {
      return `$${(tvl / 1000000).toFixed(0)}M`;
    }
    return `$${(tvl / 1000).toFixed(0)}K`;
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

  const RiskIcon = getRiskIcon(protocol.riskScore);

  return (
    <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50 hover:border-success/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">{protocol.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {protocol.chain}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {protocol.category}
            </Badge>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">APY</div>
          <div className="text-xl font-bold text-success">
            {protocol.apy.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">TVL</div>
          <div className="text-lg font-semibold text-foreground">
            {formatTVL(protocol.tvlUSD)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Risk</div>
          <div className="flex items-center gap-1">
            <RiskIcon size={16} className={getRiskColor(protocol.riskScore)} />
            <span className={`font-semibold ${getRiskColor(protocol.riskScore)}`}>
              {protocol.riskScore}/10
            </span>
          </div>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-success to-success/80 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(protocol.apy * 2, 100)}%` }}
        />
      </div>
    </Card>
  );
}