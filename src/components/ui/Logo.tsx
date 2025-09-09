import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  abbreviated?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
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
  className = '',
  textClassName = ''
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/lovable-uploads/4b213cc9-9b3e-4295-8551-3e2fd23c87d8.png"
        alt="WhalePlus Logo"
        className={cn("object-contain", sizeClasses[size])}
        style={{ filter: 'drop-shadow(0 0 0 white)' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.includes('4b213cc9')) {
            target.src = '/lovable-uploads/5bb168f9-6f5d-4ad2-850e-f09610b3bc5e.png';
          } else if (target.src.includes('5bb168f9')) {
            target.src = '/lovable-uploads/c19d6299-7cb7-455a-aa4a-fc3cd834f51d.png';
          }
        }}
      />
      {showText && (
        <span className={cn(
          "font-bold text-foreground",
          textSizeClasses[size],
          textClassName
        )}>
          {abbreviated ? 'WP' : 'WhalePlus'}
        </span>
      )}
    </div>
  );
};

export default Logo;