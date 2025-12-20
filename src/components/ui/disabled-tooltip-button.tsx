/**
 * Disabled Tooltip Button Component
 * 
 * Button component that automatically shows explanatory tooltips when disabled.
 * Implements requirement R8.GATING.DISABLED_TOOLTIPS
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DisabledTooltipButtonProps extends ButtonProps {
  /**
   * Tooltip content to show when button is disabled
   * If not provided and button is disabled, a default message will be shown
   */
  disabledTooltip?: React.ReactNode;
  
  /**
   * Tooltip side position
   */
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Whether to show tooltip even when button is enabled
   */
  showTooltipWhenEnabled?: boolean;
  
  /**
   * Tooltip content to show when button is enabled
   */
  enabledTooltip?: React.ReactNode;
}

export const DisabledTooltipButton = React.forwardRef<HTMLButtonElement, DisabledTooltipButtonProps>(
  ({
    disabled = false,
    disabledTooltip,
    tooltipSide = 'top',
    showTooltipWhenEnabled = false,
    enabledTooltip,
    children,
    className,
    ...props
  }, ref) => {
    // Determine tooltip content
    const getTooltipContent = () => {
      if (disabled && disabledTooltip) {
        return disabledTooltip;
      }
      
      if (!disabled && showTooltipWhenEnabled && enabledTooltip) {
        return enabledTooltip;
      }
      
      return null;
    };

    const tooltipContent = getTooltipContent();

    // If no tooltip needed, render button directly
    if (!tooltipContent) {
      return (
        <Button
          ref={ref}
          disabled={disabled}
          className={className}
          aria-disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      );
    }

    // Render button with tooltip
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(disabled && 'cursor-not-allowed')}>
              <Button
                ref={ref}
                disabled={disabled}
                className={className}
                aria-disabled={disabled}
                {...props}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

DisabledTooltipButton.displayName = 'DisabledTooltipButton';