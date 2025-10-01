import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile] = useState(() => 
    typeof window !== 'undefined' && 'ontouchstart' in window
  );

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  if (isMobile) {
    return (
      <>
        <div onClick={() => setIsVisible(true)}>
          {children}
        </div>
        {isVisible && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-slate-800 p-4 rounded-t-lg w-full border-t border-slate-700">
              <p className="text-white text-sm">{content}</p>
              <button 
                onClick={() => setIsVisible(false)}
                className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-10 px-3 py-2 text-sm text-white bg-slate-700 rounded-lg shadow-lg whitespace-nowrap max-w-xs ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-2 h-2 bg-slate-700 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`} />
        </div>
      )}
    </div>
  );
}