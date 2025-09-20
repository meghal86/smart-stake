import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ComingSoonBadgeProps {
  label?: string;
  mobile?: boolean;
  eta?: string;
  onTooltipOpen?: () => void;
}

export const ComingSoonBadge: React.FC<ComingSoonBadgeProps> = ({ 
  label = "Coming Soon",
  mobile = false,
  eta = "Coming Soon",
  onTooltipOpen
}) => {
  const badge = mobile ? (
    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-1 py-0.5 rounded ml-1 md:px-2 md:ml-2">
      Soon
    </span>
  ) : (
    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
      {label}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={(open) => open && onTooltipOpen?.()}>
        <TooltipTrigger asChild>
          <div className="inline-block cursor-help touch-manipulation">
            {badge}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={mobile ? "top" : "bottom"}
          className="z-50"
          sideOffset={mobile ? 8 : 4}
        >
          <p className="text-sm">{eta}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};