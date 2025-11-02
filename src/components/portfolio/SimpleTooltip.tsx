import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  userMode?: 'novice' | 'pro' | 'sim';
}

export function SimpleTooltip({ content, children, userMode = 'novice' }: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (userMode !== 'novice') {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex items-center gap-1">
        {children}
        <HelpCircle className="w-3 h-3 text-gray-400 hover:text-[#00C9A7] transition-colors cursor-help" />
      </div>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 text-sm text-white max-w-xs shadow-xl">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}