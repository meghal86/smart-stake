import React from 'react';
import { TrendingUp, Share2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickDockProps {
  className?: string;
  onQuickTrade?: () => void;
  onShareProof?: () => void;
  onCopilot?: () => void;
}

export const QuickDock: React.FC<QuickDockProps> = ({
  className,
  onQuickTrade,
  onShareProof,
  onCopilot
}) => {
  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
      "bg-background/80 backdrop-blur-lg border border-primary/20 rounded-full p-2",
      "shadow-lg shadow-primary/10",
      className
    )}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onQuickTrade}
          className="rounded-full hover:bg-primary/10"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="ml-2 text-sm">Quick Trade</span>
        </Button>
        
        <div className="w-px h-6 bg-border" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onShareProof}
          className="rounded-full hover:bg-primary/10"
        >
          <Share2 className="h-4 w-4 text-primary" />
          <span className="ml-2 text-sm">Share Proof</span>
        </Button>
        
        <div className="w-px h-6 bg-border" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopilot}
          className="rounded-full hover:bg-primary/10"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="ml-2 text-sm">Copilot</span>
        </Button>
      </div>
    </div>
  );
};