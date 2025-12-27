/**
 * Gated Button Component
 * 
 * Enhanced button component with built-in action gating and prerequisites checking.
 * Implements requirements R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React, { useState, useCallback } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionGating, type ActionGatingConfig } from '@/lib/ux/ActionGatingManager';

export interface GatedButtonProps extends Omit<ButtonProps, 'disabled' | 'onClick'> {
  // Action gating configuration
  gatingConfig?: ActionGatingConfig;
  
  // Manual overrides
  forceDisabled?: boolean;
  forceDisabledReason?: string;
  
  // Loading states
  loading?: boolean;
  loadingText?: string;
  
  // Progress indicator
  showProgress?: boolean;
  
  // Click handler with gating
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  
  // Tooltip customization
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  showTooltipOnEnabled?: boolean;
  enabledTooltip?: string;
  
  // Execution feedback
  showExecutionFeedback?: boolean;
  executionSteps?: string[];
}

export const GatedButton = React.forwardRef<HTMLButtonElement, GatedButtonProps>(
  ({
    gatingConfig = {},
    forceDisabled = false,
    forceDisabledReason,
    loading: externalLoading = false,
    loadingText = 'Executing...',
    showProgress = false,
    onClick,
    tooltipSide = 'top',
    showTooltipOnEnabled = false,
    enabledTooltip,
    showExecutionFeedback = false,
    executionSteps = [],
    children,
    className,
    variant = 'default',
    size = 'default',
    ...props
  }, ref) => {
    const gatingState = useActionGating(gatingConfig);
    const [internalLoading, setInternalLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Determine final disabled state
    const isDisabled = forceDisabled || !gatingState.enabled || externalLoading || internalLoading;
    
    // Determine final loading state
    const isLoading = externalLoading || internalLoading || gatingState.loading;

    // Determine tooltip content
    const getTooltipContent = useCallback(() => {
      if (forceDisabled && forceDisabledReason) {
        return forceDisabledReason;
      }
      
      if (gatingState.disabledReason) {
        return gatingState.disabledReason;
      }
      
      if (showTooltipOnEnabled && enabledTooltip && gatingState.enabled) {
        return enabledTooltip;
      }
      
      return null;
    }, [forceDisabled, forceDisabledReason, gatingState.disabledReason, gatingState.enabled, showTooltipOnEnabled, enabledTooltip]);

    // Handle click with gating and execution feedback
    const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || !onClick) return;

      try {
        if (showExecutionFeedback && executionSteps.length > 0) {
          setInternalLoading(true);
          
          // Simulate multi-step execution
          for (let i = 0; i < executionSteps.length; i++) {
            setCurrentStep(i);
            gatingState.updateProgress(i + 1, executionSteps.length, executionSteps[i]);
            
            // Add small delay to show progress (in real implementation, this would be actual async work)
            if (i < executionSteps.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } else {
          setInternalLoading(true);
          gatingState.updateLoading(true, loadingText);
        }

        await onClick(event);
      } catch (error) {
        console.error('Action execution failed:', error);
        throw error;
      } finally {
        setInternalLoading(false);
        gatingState.updateLoading(false);
        setCurrentStep(0);
      }
    }, [isDisabled, onClick, showExecutionFeedback, executionSteps, gatingState, loadingText]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(event as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    }, [isDisabled, handleClick]);

    // Render loading content
    const renderLoadingContent = () => {
      if (!isLoading) return children;

      const text = gatingState.loadingText || loadingText;
      
      if (showProgress && gatingState.progress) {
        const { current, total, stepName } = gatingState.progress;
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              Step {current} of {total}
              {stepName && `: ${stepName}`}
            </span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{text}</span>
        </div>
      );
    };

    // Render prerequisite icon
    const renderPrerequisiteIcon = () => {
      if (isLoading) return null;
      
      if (forceDisabled || !gatingState.enabled) {
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      }
      
      if (gatingState.enabled) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      
      return null;
    };

    // Get tooltip content
    const tooltipContent = getTooltipContent();

    // Button content
    const buttonContent = (
      <Button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        variant={variant}
        size={size}
        aria-disabled={isDisabled}
        aria-describedby={tooltipContent ? 'gated-button-tooltip' : undefined}
        className={cn(
          // Base styles
          'relative transition-all duration-200',
          
          // Disabled state styling
          isDisabled && [
            'opacity-50 cursor-not-allowed',
            'hover:opacity-50', // Prevent hover state when disabled
          ],
          
          // Loading state styling
          isLoading && 'cursor-wait',
          
          // Custom className
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {renderPrerequisiteIcon()}
          {renderLoadingContent()}
        </div>
      </Button>
    );

    // Wrap with tooltip if needed
    
    if (tooltipContent) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent side={tooltipSide} className="max-w-xs" id="gated-button-tooltip">
              <div className="space-y-1">
                <p className="text-sm font-medium">{tooltipContent}</p>
                
                {/* Show detailed prerequisites if disabled */}
                {isDisabled && gatingState.prerequisites.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <div className="mt-2 space-y-1">
                      {gatingState.prerequisites
                        .filter(p => p.required && !p.met)
                        .map((prereq, index) => (
                          <div key={prereq.id} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{prereq.message}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Show progress if in multi-step execution */}
                {showProgress && gatingState.progress && (
                  <div className="text-xs text-muted-foreground">
                    Progress: {gatingState.progress.current}/{gatingState.progress.total}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  }
);

GatedButton.displayName = 'GatedButton';

// Convenience components for common gating scenarios

export interface WalletGatedButtonProps extends Omit<GatedButtonProps, 'gatingConfig'> {
  requireWallet?: boolean;
}

export const WalletGatedButton = React.forwardRef<HTMLButtonElement, WalletGatedButtonProps>(
  ({ requireWallet = true, ...props }, ref) => {
    return (
      <GatedButton
        ref={ref}
        gatingConfig={{ requireWallet }}
        {...props}
      />
    );
  }
);

WalletGatedButton.displayName = 'WalletGatedButton';

export interface ApprovalGatedButtonProps extends Omit<GatedButtonProps, 'gatingConfig'> {
  tokenAddresses: string[];
}

export const ApprovalGatedButton = React.forwardRef<HTMLButtonElement, ApprovalGatedButtonProps>(
  ({ tokenAddresses, ...props }, ref) => {
    return (
      <GatedButton
        ref={ref}
        gatingConfig={{ 
          requireWallet: true, 
          requireApprovals: tokenAddresses 
        }}
        {...props}
      />
    );
  }
);

ApprovalGatedButton.displayName = 'ApprovalGatedButton';

export interface BalanceGatedButtonProps extends Omit<GatedButtonProps, 'gatingConfig'> {
  token: string;
  minimumAmount: string;
}

export const BalanceGatedButton = React.forwardRef<HTMLButtonElement, BalanceGatedButtonProps>(
  ({ token, minimumAmount, ...props }, ref) => {
    return (
      <GatedButton
        ref={ref}
        gatingConfig={{ 
          requireWallet: true, 
          minimumBalance: { token, amount: minimumAmount } 
        }}
        {...props}
      />
    );
  }
);

BalanceGatedButton.displayName = 'BalanceGatedButton';