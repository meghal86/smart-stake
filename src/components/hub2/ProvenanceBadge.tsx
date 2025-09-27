import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Clock, Zap, Database } from "lucide-react";

interface ProvenanceBadgeProps {
  kind: 'real'|'sim';
  tooltip?: string;
  source?: string;
  updatedAt?: string;
  latency?: number;
  className?: string;
}

export default function ProvenanceBadge({ 
  kind, 
  tooltip, 
  source, 
  updatedAt, 
  latency,
  className 
}: ProvenanceBadgeProps) {
  const label = kind === 'real' ? 'Real' : 'Sim';
  const color = kind === 'real' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-sky-600/20 text-sky-300';
  
  const getSourceIcon = (src?: string) => {
    if (!src) return <Database className="w-3 h-3" />;
    if (src.includes('etherscan')) return <Shield className="w-3 h-3" />;
    if (src.includes('coingecko')) return <Zap className="w-3 h-3" />;
    return <Database className="w-3 h-3" />;
  };

  const fullTooltip = tooltip || (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {getSourceIcon(source)}
        <span className="font-medium">Source: {source || 'Internal'}</span>
      </div>
      {updatedAt && (
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Updated: {new Date(updatedAt).toLocaleString()}</span>
        </div>
      )}
      {latency && (
        <div className="text-xs text-muted-foreground">
          Latency: {latency}ms
        </div>
      )}
      <div className="text-xs text-muted-foreground pt-1 border-t">
        {kind === 'real' ? 'Live blockchain data' : 'Simulated data'}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span 
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${color} ${className}`}
            aria-label={`${label} data`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getSourceIcon(source)}
            {label}
          </motion.span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {typeof fullTooltip === 'string' ? (
            <p className="text-xs whitespace-pre-line">{fullTooltip}</p>
          ) : (
            fullTooltip
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
