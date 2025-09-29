import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PercentileBadgeProps {
  percentile: number; // 0-100
  type: 'inflow' | 'risk';
  className?: string;
  size?: 'sm' | 'md';
}

export default function PercentileBadge({ percentile, type, className, size = 'md' }: PercentileBadgeProps) {
  const getColorClass = (percentile: number) => {
    if (percentile >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (percentile >= 75) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (percentile >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentile >= 25) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getIcon = (percentile: number) => {
    if (percentile >= 75) return <TrendingUp className="w-3 h-3" />;
    if (percentile <= 25) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getLabel = (percentile: number) => {
    if (percentile >= 90) return 'Extreme';
    if (percentile >= 75) return 'High';
    if (percentile >= 50) return 'Above Avg';
    if (percentile >= 25) return 'Below Avg';
    return 'Low';
  };

  const getDescription = (percentile: number, type: 'inflow' | 'risk') => {
    const period = 'vs last 30d';
    if (type === 'inflow') {
      return `Whale inflow is in the ${percentile}th percentile ${period}`;
    } else {
      return `Risk level is in the ${percentile}th percentile ${period}`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              "flex items-center gap-1",
              getColorClass(percentile),
              size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
              className
            )}
          >
            {getIcon(percentile)}
            {getLabel(percentile)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{getDescription(percentile, type)}</p>
            <p className="text-muted-foreground mt-1">
              {percentile}th percentile {type === 'inflow' ? 'inflow' : 'risk'} level
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
