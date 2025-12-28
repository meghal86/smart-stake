/**
 * Interactive Div Component
 * 
 * Replaces div elements with onClick handlers to provide proper accessibility.
 * Implements requirement R5 - Interactive Element Reliability
 * 
 * @see .kiro/specs/missing-requirements/requirements.md - Requirement 5
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface InteractiveDivProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /**
   * Click handler - required for interactive divs
   */
  onClick: () => void
  
  /**
   * Whether the element is disabled
   */
  disabled?: boolean
  
  /**
   * Tooltip content to show when disabled
   */
  disabledTooltip?: React.ReactNode
  
  /**
   * Accessible label for screen readers
   */
  ariaLabel: string
  
  /**
   * Whether to show hover effects
   */
  showHoverEffects?: boolean
}

const InteractiveDiv = React.forwardRef<HTMLDivElement, InteractiveDivProps>(
  ({ 
    className, 
    onClick, 
    disabled = false, 
    disabledTooltip,
    ariaLabel,
    showHoverEffects = true,
    children,
    ...props 
  }, ref) => {
    
    const handleClick = React.useCallback(() => {
      if (!disabled) {
        onClick()
      }
    }, [disabled, onClick])
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick()
      }
    }, [disabled, onClick])
    
    // Build className with interactive states
    const divClassName = cn(
      // Base interactive styles
      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      {
        // Disabled states
        'cursor-not-allowed opacity-50': disabled,
        
        // Hover effects (only if not disabled)
        'hover:bg-accent/50 transition-colors': showHoverEffects && !disabled,
      },
      className
    )
    
    // If disabled and has tooltip, wrap in tooltip
    if (disabled && disabledTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={ref}
                className={divClassName}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={ariaLabel}
                aria-disabled={disabled}
                {...props}
              >
                {children}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {disabledTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    
    // Regular interactive div
    return (
      <div
        ref={ref}
        className={divClassName}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    )
  }
)

InteractiveDiv.displayName = "InteractiveDiv"

export { InteractiveDiv }
export type { InteractiveDivProps }