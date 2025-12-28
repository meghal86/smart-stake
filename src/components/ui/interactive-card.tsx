/**
 * Interactive Card Component
 * 
 * Extends the base Card component to ensure all interactive cards provide proper feedback.
 * Implements requirement R5 - Interactive Element Reliability
 * 
 * @see .kiro/specs/missing-requirements/requirements.md - Requirement 5
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardProps } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface InteractiveCardProps extends Omit<CardProps, 'onClick'> {
  /**
   * Click handler - if provided, card becomes interactive
   */
  onClick?: () => void
  
  /**
   * Whether the card is disabled
   */
  disabled?: boolean
  
  /**
   * Tooltip content to show when disabled
   */
  disabledTooltip?: React.ReactNode
  
  /**
   * Whether to show hover effects
   */
  showHoverEffects?: boolean
  
  /**
   * Loading state
   */
  loading?: boolean
  
  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ 
    className, 
    onClick, 
    disabled = false, 
    disabledTooltip,
    showHoverEffects = true,
    loading = false,
    ariaLabel,
    children,
    ...props 
  }, ref) => {
    const isInteractive = !!onClick
    const isDisabled = disabled || loading
    
    // Build className with interactive states
    const cardClassName = cn(
      // Base card styles are inherited from Card component
      {
        // Interactive states
        'cursor-pointer': isInteractive && !isDisabled,
        'cursor-not-allowed': isInteractive && isDisabled,
        'opacity-50': isDisabled,
        
        // Hover effects (only if interactive and not disabled)
        'hover:shadow-md hover:scale-[1.02] transition-all duration-200': 
          isInteractive && !isDisabled && showHoverEffects,
        
        // Focus states for accessibility
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2':
          isInteractive,
      },
      className
    )
    
    const handleClick = React.useCallback(() => {
      if (!isDisabled && onClick) {
        onClick()
      }
    }, [isDisabled, onClick])
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (isInteractive && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick?.()
      }
    }, [isInteractive, isDisabled, onClick])
    
    // If disabled and has tooltip, wrap in tooltip
    if (isDisabled && disabledTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                ref={ref}
                className={cardClassName}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={isInteractive ? 0 : undefined}
                role={isInteractive ? "button" : undefined}
                aria-label={ariaLabel}
                aria-disabled={isDisabled}
                {...props}
              >
                {children}
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {disabledTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    
    // Regular interactive or non-interactive card
    return (
      <Card
        ref={ref}
        className={cardClassName}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? 0 : undefined}
        role={isInteractive ? "button" : undefined}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

InteractiveCard.displayName = "InteractiveCard"

export { InteractiveCard }
export type { InteractiveCardProps }