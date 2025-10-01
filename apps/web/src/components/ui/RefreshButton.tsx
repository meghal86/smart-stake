import React, { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

export function RefreshButton({ onRefresh, className = '' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      // Ensure minimum 400ms for visual feedback
      await new Promise(resolve => setTimeout(resolve, 400));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`text-teal-400 hover:text-teal-300 text-sm flex items-center gap-1 ${className}`}
      aria-live="polite"
    >
      {isRefreshing ? (
        <>
          <svg 
            className="animate-spin h-3 w-3" 
            viewBox="0 0 24 24"
            style={{ animationDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '0s' : '1s' }}
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          Updating...
        </>
      ) : (
        'Refresh'
      )}
    </button>
  );
}