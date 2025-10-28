import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Database, Zap } from 'lucide-react';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface HunterDemoToggleProps {
  className?: string;
}

export default function HunterDemoToggle({ className }: HunterDemoToggleProps) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <TooltipProvider>
      <div className={cn('flex border border-white/10 rounded-lg p-1 bg-white/5 backdrop-blur-sm', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isDemoMode ? 'default' : 'ghost'}
              onClick={toggleDemoMode}
              className={cn(
                'text-xs px-3 h-7',
                isDemoMode 
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <Zap className="w-3 h-3 mr-1" />
              Demo
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Demo mode with sample opportunities</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={!isDemoMode ? 'default' : 'ghost'}
              onClick={toggleDemoMode}
              className={cn(
                'text-xs px-3 h-7',
                !isDemoMode 
                  ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <Database className="w-3 h-3 mr-1" />
              Live
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Live data from blockchain protocols</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}