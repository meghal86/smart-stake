import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  mobile?: boolean;
}

export function EnhancedTooltip({ 
  children, 
  content, 
  side = 'top', 
  align = 'center',
  delayDuration = 200,
  mobile = false
}: EnhancedTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      updatePosition();
    }, delayDuration);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let x = 0;
    let y = 0;

    // Calculate position based on side
    switch (side) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2);
        y = triggerRect.top - 8;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2);
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - 8;
        y = triggerRect.top + (triggerRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + (triggerRect.height / 2);
        break;
    }

    // Adjust for viewport boundaries
    if (x < 8) x = 8;
    if (x > viewport.width - 8) x = viewport.width - 8;
    if (y < 8) y = 8;
    if (y > viewport.height - 8) y = viewport.height - 8;

    // On mobile, position at bottom full width
    if (mobile && window.innerWidth < 768) {
      x = 8;
      y = viewport.height - 8;
    }

    setPosition({ x, y });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideTooltip();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen) {
              hideTooltip();
            } else {
              showTooltip();
            }
          }
        }}
        className="inline-block"
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'fixed bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-sm pointer-events-none wh-z-tooltip',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            mobile && 'md:hidden left-2 right-2 w-auto max-w-none'
          )}
          style={mobile && window.innerWidth < 768 ? 
            { bottom: '8px', left: '8px', right: '8px' } : 
            { left: position.x, top: position.y, transform: (side === 'top' || side === 'bottom') ? 'translateX(-50%)' : ((side === 'left' || side === 'right') ? 'translateY(-50%)' : 'none') }
          }
        >
          {content}
        </div>
      )}
    </>
  );
}