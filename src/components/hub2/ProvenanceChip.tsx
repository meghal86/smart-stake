import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircle, Database } from "lucide-react";

interface ProvenanceChipProps {
  provenance: 'real' | 'sim';
  className?: string;
  size?: 'sm' | 'md';
}

export default function ProvenanceChip({ provenance, className, size = 'md' }: ProvenanceChipProps) {
  const isReal = provenance === 'real';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              "flex items-center gap-1",
              isReal 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-blue-100 text-blue-800 border-blue-200",
              size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
              className
            )}
          >
            {isReal ? (
              <CheckCircle className={cn("w-3 h-3", size === 'sm' && "w-2 h-2")} />
            ) : (
              <Database className={cn("w-3 h-3", size === 'sm' && "w-2 h-2")} />
            )}
            {isReal ? 'Real' : 'Sim'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {isReal 
              ? 'Data from live blockchain transactions and verified sources'
              : 'Simulated data for testing and analysis purposes'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
