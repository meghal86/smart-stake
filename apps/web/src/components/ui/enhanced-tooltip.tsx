import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedTooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-full';
  className?: string;
  delay?: number;
}

export function EnhancedTooltip({ 
  children, 
  content, 
  position = 'bottom-full',
  className = '',
  delay = 200 
}: EnhancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'bottom-full': 'top-full left-0 mt-2 w-full'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div 
          className={cn(
            'absolute z-[9999] px-3 py-2 text-sm',
            'bg-gray-900 text-white rounded-lg shadow-lg',
            'border border-gray-700',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          {position !== 'bottom-full' && (
            <div 
              className={cn(
                'absolute w-2 h-2 bg-gray-900 border-gray-700 rotate-45',
                position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b',
                position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t',
                position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r',
                position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}