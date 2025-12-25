/**
 * PrimaryButton Component
 * 
 * Standardized primary button component for HarvestPro and all AlphaWhale features.
 * Implements Enhanced Req 13 AC1-2 (single button system) and Enhanced Req 8 AC1-3 (disabled tooltips).
 * 
 * Features:
 * - Built-in loading states with spinner and "Preparing..." text
 * - Disabled states with explanatory tooltips
 * - Scale animation on press (0.98 scale)
 * - Respects prefers-reduced-motion
 * - Consistent styling using CSS custom properties
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 13
 * @see .kiro/specs/ux-gap-requirements/component-standardization.md
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state - shows spinner and loading text
   */
  isLoading?: boolean;
  
  /**
   * Text to show when loading (defaults to "Preparing...")
   */
  loadingText?: string;
  
  /**
   * Success state - shows checkmark and success text
   */
  isSuccess?: boolean;
  
  /**
   * Text to show when successful
   */
  successText?: string;
  
  /**
   * Error state - shows X icon and error text
   */
  isError?: boolean;
  
  /**
   * Text to show when error occurred
   */
  errorText?: string;
  
  /**
   * Tooltip content to show when button is disabled
   * Required for Enhanced Req 8 AC1-3 (disabled tooltips)
   */
  disabledTooltip?: React.ReactNode;
  
  /**
   * Whether to show scale animation on press (default: true)
   */
  scaleOnPress?: boolean;
  
  /**
   * Animation duration in milliseconds (default: 120)
   */
  animationDuration?: number;
  
  /**
   * Button style variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText = "Preparing...",
    isSuccess = false,
    successText,
    isError = false,
    errorText,
    disabledTooltip,
    disabled = false,
    scaleOnPress = true,
    animationDuration = 120,
    variant = 'primary',
    className,
    onClick,
    ...props
  }, ref) => {
    // Handle reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
    
    React.useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    // Determine current state and content
    const isDisabled = disabled || isLoading;
    
    const getButtonContent = () => {
      if (isLoading) {
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingText}</span>
          </div>
        );
      }
      
      if (isSuccess && successText) {
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{successText}</span>
          </div>
        );
      }
      
      if (isError && errorText) {
        return (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{errorText}</span>
          </div>
        );
      }
      
      return children;
    };
    
    // Get variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return 'bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white hover:from-[#d17a26] hover:to-[#a66529] shadow-lg';
        case 'secondary':
          return 'bg-white/10 text-white border border-white/20 hover:bg-white/15';
        case 'outline':
          return 'border border-white/20 text-white hover:bg-white/5';
        case 'ghost':
          return 'text-white hover:bg-white/10';
        default:
          return 'bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white hover:from-[#d17a26] hover:to-[#a66529] shadow-lg';
      }
    };
    
    // Handle click with animation
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      onClick?.(e);
    };
    
    // If disabled and has tooltip, render with tooltip
    if (isDisabled && disabledTooltip) {
      return (
        <div className="relative group">
          <button
            ref={ref}
            disabled={true}
            className={cn(
              'relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
              'px-6 py-3 text-sm w-full',
              getVariantStyles(),
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              className
            )}
            onClick={handleClick}
            {...props}
          >
            {getButtonContent()}
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {disabledTooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      );
    }
    
    // Regular button with motion
    return (
      <motion.div
        whileHover={!isDisabled && !prefersReducedMotion ? { scale: 1.02 } : {}}
        whileTap={!isDisabled && scaleOnPress && !prefersReducedMotion ? { scale: 0.98 } : {}}
        transition={{
          duration: prefersReducedMotion ? 0 : animationDuration / 1000,
          ease: 'easeOut'
        }}
      >
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            'relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
            'px-6 py-3 text-sm w-full',
            getVariantStyles(),
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          onClick={handleClick}
          {...props}
        >
          {/* Ripple Effect */}
          {!isDisabled && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-xl"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            />
          )}
          
          <span className="relative z-10">
            {getButtonContent()}
          </span>
        </button>
      </motion.div>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';