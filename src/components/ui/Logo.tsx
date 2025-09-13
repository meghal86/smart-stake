import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  abbreviated?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  textClassName?: string;
  variant?: 'header' | 'splash';
  // Optional explicit image source to override defaults
  src?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-48 w-48'
};

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-5xl'
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  abbreviated = false,
  clickable = false,
  onClick,
  className = '',
  textClassName = '',
  variant = 'header',
  src
}) => {
  const Component = clickable ? 'button' : 'div';
  const [imgError, setImgError] = React.useState(false);
  const [sourceIndex, setSourceIndex] = React.useState(0);

  // Prefer provided src, then fallbacks. Avoids issues if a file name changes
  // or if files with spaces are problematic in some environments.
  const sources = React.useMemo(() => {
    if (variant === 'splash') {
      return [
        src || '/splash screen.png',
        '/whaleplus-logo-512x512.png',
        '/whaleplus-logo.svg',
      ];
    }
    // header variant fallbacks
    return [
      src || '/header logo.png',
      '/whaleplus-logo.svg',
      '/whaleplus-logo-512x512.png',
    ];
  }, [variant, src]);

  const currentSrc = sources[Math.min(sourceIndex, sources.length - 1)];
  
  return (
    <Component 
      className={cn(
        "flex items-center gap-2", 
        clickable && "hover:opacity-80 transition-opacity cursor-pointer",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {!imgError ? (
        <img
          src={currentSrc}
          alt="WhalePlus Logo"
          className={cn("object-contain", sizeClasses[size])}
          loading="lazy"
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex((i) => i + 1);
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        <div className={cn(
          "bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold",
          sizeClasses[size]
        )}>
          🐋
        </div>
      )}
      {showText && (
        <span className={cn(
          "font-bold text-foreground",
          textSizeClasses[size],
          textClassName
        )}>
          {abbreviated ? 'WP' : 'WhalePlus'}
        </span>
      )}
    </Component>
  );
};

export default Logo;
