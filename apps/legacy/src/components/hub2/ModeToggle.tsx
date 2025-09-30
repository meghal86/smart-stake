import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { User, Zap } from "lucide-react";
import { UIMode } from "@/types/hub2";

interface ModeToggleProps {
  mode: UIMode['mode'];
  onModeChange: (mode: UIMode['mode']) => void;
  className?: string;
}

export default function ModeToggle({ mode, onModeChange, className }: ModeToggleProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex border rounded-lg p-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={mode === 'novice' ? 'default' : 'ghost'}
              onClick={() => onModeChange('novice')}
              className="text-xs px-3"
            >
              <User className="w-3 h-3 mr-1" />
              Novice
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Simplified view with plain language explanations</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={mode === 'pro' ? 'default' : 'ghost'}
              onClick={() => onModeChange('pro')}
              className="text-xs px-3"
            >
              <Zap className="w-3 h-3 mr-1" />
              Pro
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Full metrics with percentiles, venues, and raw data</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
