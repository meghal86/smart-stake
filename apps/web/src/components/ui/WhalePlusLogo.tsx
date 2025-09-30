import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface WhalePlusLogoProps {
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark';
  size?: number;
  className?: string;
}

const WhalePlusLogo: React.FC<WhalePlusLogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 128,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Build the source path based on variant and theme
  const basePath = `/assets/logo/whaleplus_${variant}`;
  const themeSuffix = theme === 'dark' ? '_white' : '_navy';
  
  // Fallback sources in order of preference
  const sources = [
    `${basePath}${themeSuffix}.svg`,
    `${basePath}.svg`,
    variant === 'full' ? '/assets/logo/whaleplus_icon.svg' : '/assets/logo/whaleplus_full.svg'
  ];

  const currentSrc = sources[Math.min(sourceIndex, sources.length - 1)];

  // Handle responsive sizing
  const responsiveSize = Math.min(size, typeof window !== 'undefined' ? window.innerWidth * 0.8 : size);

  return (
    <div 
      className={cn(
        'flex items-center justify-center animate-fade-in',
        className
      )}
      style={{
        minWidth: responsiveSize,
        minHeight: responsiveSize
      }}
    >
      {!imgError ? (
        <img
          src={currentSrc}
          alt="WhalePlus Logo"
          width={responsiveSize}
          height={responsiveSize}
          className={cn(
            'object-contain drop-shadow-lg transition-all duration-300 ease-in-out',
            'hover:scale-105'
          )}
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
          loading="lazy"
          aria-label="WhalePlus Logo"
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex(prev => prev + 1);
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        // Fallback SVG if all images fail to load
        <div 
          className={cn(
            'flex items-center justify-center rounded-lg shadow-lg',
            'bg-gradient-to-br from-blue-500 to-teal-500',
            theme === 'dark' ? 'text-white' : 'text-white'
          )}
          style={{
            width: responsiveSize,
            height: responsiveSize,
            minWidth: responsiveSize,
            minHeight: responsiveSize
          }}
          aria-label="WhalePlus Logo"
        >
          <svg
            width={responsiveSize * 0.6}
            height={responsiveSize * 0.6}
            viewBox="0 0 100 100"
            className="drop-shadow-md"
          >
            {/* Whale Body */}
            <ellipse
              cx="35"
              cy="50"
              rx="20"
              ry="12"
              fill="currentColor"
              opacity="0.9"
            />
            
            {/* Whale Head */}
            <ellipse
              cx="20"
              cy="50"
              rx="15"
              ry="10"
              fill="currentColor"
              opacity="0.9"
            />
            
            {/* Whale Eye */}
            <circle
              cx="15"
              cy="47"
              r="2"
              fill={theme === 'dark' ? '#1e40af' : '#ffffff'}
            />
            
            {/* Whale Tail */}
            <path
              d="M 50 50 Q 65 42 70 50 Q 65 58 50 50"
              fill="currentColor"
              opacity="0.9"
            />
            
            {/* Waves */}
            <path
              d="M 70 50 Q 80 45 90 50"
              stroke={theme === 'dark' ? '#60a5fa' : '#14b8a6'}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            
            <path
              d="M 72 58 Q 82 53 92 58"
              stroke={theme === 'dark' ? '#60a5fa' : '#14b8a6'}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            
            <path
              d="M 72 42 Q 82 37 92 42"
              stroke={theme === 'dark' ? '#60a5fa' : '#14b8a6'}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default WhalePlusLogo;