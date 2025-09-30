import { Badge } from '@/components/ui/badge';
import { EnhancedTooltip } from '@/components/tooltip/EnhancedTooltip';
import { Info } from 'lucide-react';

interface RiskBadgeProps {
  risk: number;
  type: 'cluster' | 'chain';
  variant?: 'default' | 'destructive' | 'secondary';
}

export function RiskBadge({ risk, type, variant }: RiskBadgeProps) {
  const tooltipContent = (
    <div className="text-xs space-y-1 max-w-[200px]">
      <div className="font-medium">Risk Context</div>
      <div>
        <strong>Cluster Risk:</strong> Localized risk from this specific behavior pattern
      </div>
      <div>
        <strong>Chain Risk:</strong> Aggregate risk from all whale activity on this chain
      </div>
      <div className="border-t pt-1 mt-1 text-muted-foreground">
        Current {type} risk: {risk}/100
      </div>
    </div>
  );

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const getBadgeVariant = (score: number) => {
    if (variant) return variant;
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'secondary';
    return 'default';
  };

  return (
    <EnhancedTooltip content={tooltipContent}>
      <Badge 
        variant={getBadgeVariant(risk)}
        className="cursor-help flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        {getRiskLevel(risk)} Risk
      </Badge>
    </EnhancedTooltip>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
  showTooltip?: boolean;
}

export function ConfidenceBadge({ confidence, showTooltip = true }: ConfidenceBadgeProps) {
  const tooltipContent = (
    <div className="text-xs space-y-1 max-w-[200px]">
      <div className="font-medium">Confidence Score</div>
      <div>
        Derived from how far signals exceed thresholds across recent 15-minute buckets
      </div>
      <div className="border-t pt-1 mt-1">
        <div>Current confidence: {confidence}%</div>
        <div className="text-muted-foreground">
          {confidence >= 80 ? 'Very High' : 
           confidence >= 60 ? 'High' : 
           confidence >= 40 ? 'Medium' : 'Low'} confidence classification
        </div>
      </div>
    </div>
  );

  const getVariant = (score: number) => {
    if (score < 60) return 'secondary';
    return 'default';
  };

  const badge = (
    <Badge 
      variant={getVariant(confidence)}
      className={showTooltip ? 'cursor-help' : ''}
    >
      {confidence}% Confidence
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <EnhancedTooltip content={tooltipContent}>
      {badge}
    </EnhancedTooltip>
  );
}