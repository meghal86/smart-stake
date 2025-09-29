import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface AsOfLabelProps {
  asOf: string; // ISO8601
  className?: string;
  showIcon?: boolean;
}

export default function AsOfLabel({ asOf, className, showIcon = true }: AsOfLabelProps) {
  const date = new Date(asOf);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  let relativeTime: string;
  if (diffMinutes < 1) {
    relativeTime = 'Just now';
  } else if (diffMinutes < 60) {
    relativeTime = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours}h ago`;
  } else {
    relativeTime = date.toLocaleDateString();
  }
  
  const exactTime = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground",
            className
          )}>
            {showIcon && <Clock className="w-3 h-3" />}
            <span>As of {relativeTime}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-mono">{exactTime}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
