import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';

interface TooltipTermProps {
  term: string;
  definition: string;
  details?: string;
  link?: string;
  children?: React.ReactNode;
}

export function TooltipTerm({ term, definition, details, link, children }: TooltipTermProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-b border-dotted border-muted-foreground cursor-help">
            {children || term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{term}</div>
            <div className="text-sm">{definition}</div>
            {details && (
              <div className="text-xs text-muted-foreground">{details}</div>
            )}
            {link && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <ExternalLink className="h-3 w-3" />
                <span>Learn more</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}