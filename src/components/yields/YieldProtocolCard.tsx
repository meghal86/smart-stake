import { ExternalLink, AlertTriangle, CheckCircle, XCircle, Bell, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  onAlertClick?: () => void;
}

export function YieldProtocolCard({ protocol, onAlertClick }: YieldProtocolCardProps) {
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
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            Risk
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle size={12} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs max-w-xs">
                  <p className="font-medium mb-1">Risk Score Components:</p>
                  <p>• Smart Contract Security (40%)</p>
                  <p>• Liquidity Risk (30%)</p>
                  <p>• Market Volatility (20%)</p>
                  <p>• Regulatory Risk (10%)</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <RiskIcon size={16} className={getRiskColor(protocol.riskScore)} />
            <span className={`font-semibold ${getRiskColor(protocol.riskScore)}`}>
              {protocol.riskScore}/10
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-success to-success/80 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(protocol.apy * 2, 100)}%` }}
          />
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            onAlertClick?.();
          }}
          className="h-8 px-2"
        >
          <Bell size={12} />
        </Button>
      </div>
    </Card>
  );
}