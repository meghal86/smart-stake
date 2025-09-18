import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export function HelpTooltip({ content, className = "" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}>
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}