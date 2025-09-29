import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { VenueData } from "@/types/hub2";

interface VenueListProps {
  venues: VenueData[];
  maxItems?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export default function VenueList({ venues, maxItems = 3, className, size = 'md' }: VenueListProps) {
  if (!venues || venues.length === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        No venue data available
      </div>
    );
  }

  const sortedVenues = [...venues]
    .sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow))
    .slice(0, maxItems);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getNetDirection = (inflow: number, outflow: number) => {
    const net = inflow - outflow;
    if (net > 0) return 'inflow';
    if (net < 0) return 'outflow';
    return 'balanced';
  };

  const getIcon = (inflow: number, outflow: number) => {
    const direction = getNetDirection(inflow, outflow);
    if (direction === 'inflow') return <TrendingUp className="w-3 h-3" />;
    if (direction === 'outflow') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getColorClass = (inflow: number, outflow: number) => {
    const direction = getNetDirection(inflow, outflow);
    if (direction === 'inflow') return 'bg-green-100 text-green-800 border-green-200';
    if (direction === 'outflow') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {sortedVenues.map((venue, index) => (
        <TooltipProvider key={venue.venue}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className={cn(
                  "flex items-center gap-1",
                  getColorClass(venue.inflow, venue.outflow),
                  size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
                )}
              >
                {getIcon(venue.inflow, venue.outflow)}
                {venue.venue}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">{venue.venue}</p>
                <div className="mt-1 space-y-1">
                  <p className="text-green-600">
                    Inflow: ${formatValue(venue.inflow)}
                  </p>
                  <p className="text-red-600">
                    Outflow: ${formatValue(venue.outflow)}
                  </p>
                  <p className="text-muted-foreground">
                    Net: {venue.inflow - venue.outflow >= 0 ? '+' : ''}${formatValue(venue.inflow - venue.outflow)}
                  </p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {venues.length > maxItems && (
        <Badge
          variant="outline"
          className={cn(
            "text-muted-foreground",
            size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
          )}
        >
          +{venues.length - maxItems} more
        </Badge>
      )}
    </div>
  );
}
