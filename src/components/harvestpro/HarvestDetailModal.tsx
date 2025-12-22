/**
 * HarvestDetailModal Component
 * Displays detailed information about a harvest opportunity before execution
 * 
 * Requirements: 7.1-7.5
 * - Full-screen on mobile, centered on desktop
 * - Header with token symbol
 * - Summary section with key metrics
 * - Guardian warning banner (conditional)
 * - Step-by-step actions list
 * - Cost breakdown table
 * - Net benefit summary
 * - Execute Harvest button
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Clock, TrendingDown, Shield, Fuel, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HarvestOpportunity } from '@/types/harvestpro';
import { Button } from '@/components/ui/button';
import { useWalletButtonTooltip } from '@/hooks/useFormButtonTooltip';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';

// ============================================================================
// TYPES
// ============================================================================

export interface HarvestDetailModalProps {
  opportunity: HarvestOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (opportunityId: string) => void;
  isExecuting?: boolean;
  isConnected?: boolean;
}

interface ExecutionStep {
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  guardianScore?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate execution steps based on opportunity metadata
 */
function generateExecutionSteps(opportunity: HarvestOpportunity): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const isCEX = opportunity.metadata.venue?.toLowerCase().includes('binance') ||
                opportunity.metadata.venue?.toLowerCase().includes('coinbase') ||
                opportunity.metadata.venue?.toLowerCase().includes('kraken');
  
  if (isCEX) {
    // CEX execution steps
    steps.push({
      stepNumber: 1,
      title: 'Review CEX Instructions',
      description: `Navigate to ${opportunity.metadata.venue} and prepare to execute`,
      status: 'pending',
    });
    steps.push({
      stepNumber: 2,
      title: 'Execute Sell Order',
      description: `Sell ${opportunity.remainingQty} ${opportunity.token} at market price`,
      status: 'pending',
    });
    steps.push({
      stepNumber: 3,
      title: 'Confirm Transaction',
      description: 'Verify the transaction completed successfully',
      status: 'pending',
    });
  } else {
    // On-chain execution steps
    steps.push({
      stepNumber: 1,
      title: 'Connect Wallet',
      description: `Connect ${opportunity.metadata.walletName || 'your wallet'} to proceed`,
      status: 'pending',
      guardianScore: opportunity.guardianScore,
    });
    steps.push({
      stepNumber: 2,
      title: 'Approve Token',
      description: `Approve ${opportunity.token} for trading on ${opportunity.metadata.venue}`,
      status: 'pending',
      guardianScore: opportunity.guardianScore,
    });
    steps.push({
      stepNumber: 3,
      title: 'Execute Swap',
      description: `Swap ${opportunity.remainingQty} ${opportunity.token} to stablecoin`,
      status: 'pending',
      guardianScore: opportunity.guardianScore,
    });
    steps.push({
      stepNumber: 4,
      title: 'Confirm Transaction',
      description: 'Wait for blockchain confirmation',
      status: 'pending',
    });
  }
  
  return steps;
}

/**
 * Format currency with proper decimals
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get risk color based on level
 */
function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'MEDIUM':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'HIGH':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HarvestDetailModal({
  opportunity,
  isOpen,
  onClose,
  onExecute,
  isExecuting = false,
  isConnected = true,
}: HarvestDetailModalProps) {
  console.log('🎭 HarvestDetailModal render:', { 
    opportunity: opportunity?.id, 
    isOpen, 
    hasOpportunity: !!opportunity 
  });
  
  // Wallet connection tooltip
  const walletTooltip = useWalletButtonTooltip(isConnected);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('🔒 Body scroll locked');
    } else {
      document.body.style.overflow = 'unset';
      console.log('🔓 Body scroll unlocked');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Don't render anything if no opportunity or not open
  if (!opportunity || !isOpen) {
    console.log('❌ Not rendering modal - opportunity:', !!opportunity, 'isOpen:', isOpen);
    return null;
  }
  
  const steps = generateExecutionSteps(opportunity);
  const isHighRisk = opportunity.riskLevel === 'HIGH';
  const totalCosts = opportunity.gasEstimate + opportunity.slippageEstimate + opportunity.tradingFees;
  const taxSavings = opportunity.unrealizedLoss * 0.24; // TODO: Get from user settings
  
  console.log('✅ Rendering CUSTOM modal - token:', opportunity.token);
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-[#1a1f2e] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Close</span>
          </button>
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-red-400" />
                Harvest {opportunity.token}
              </h2>
            </div>
            <p className="text-gray-400 mt-2">
              Review the execution plan and costs before proceeding
            </p>
          </div>
          
          {/* Guardian Warning Banner (Conditional) */}
          <AnimatePresence>
            {isHighRisk && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'mb-6 p-4 rounded-xl border',
                  'bg-amber-500/10 border-amber-500/30',
                  'flex items-start gap-3'
                )}
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-400 mb-1">
                    High Risk Detected
                  </h4>
                  <p className="text-sm text-amber-200/80">
                    This opportunity has a Guardian score of {opportunity.guardianScore}/10. 
                    {opportunity.slippageEstimate > opportunity.unrealizedLoss * 0.05 && ' High slippage may impact net benefit.'}
                    {' '}Proceed with caution and review all details carefully.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Summary Section */}
          <div className="mb-6 p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Unrealized Loss</div>
                <div className="text-lg font-semibold text-red-400">
                  {formatCurrency(opportunity.unrealizedLoss)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Net Benefit</div>
                <div className="text-lg font-semibold text-green-400">
                  {formatCurrency(opportunity.netTaxBenefit)}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                  getRiskColor(opportunity.riskLevel)
                )}>
                  <Shield className="w-3 h-3" />
                  {opportunity.riskLevel}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Est. Time:</span>
                <span className="text-white font-medium">{opportunity.executionTimeEstimate || '5-10 min'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Confidence:</span>
                <span className="text-white font-medium">{opportunity.confidence}%</span>
              </div>
            </div>
          </div>
          
          {/* Step-by-Step Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Execution Steps
            </h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <motion.div
                  key={step.stepNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.stepNumber * 0.1 }}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border',
                    'bg-white/5 border-white/10',
                    'hover:bg-white/10 transition-colors'
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    'bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold text-sm'
                  )}>
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                      {step.guardianScore !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Shield className="w-3 h-3" />
                          <span>{step.guardianScore}/10</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Cost Breakdown Table */}
          <div className="mb-6 p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Cost Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Tax Savings (24%)</span>
                <span className="text-green-400 font-semibold">+{formatCurrency(taxSavings)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Gas Cost</span>
                <span className="text-red-400 font-semibold">-{formatCurrency(opportunity.gasEstimate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Slippage Estimate</span>
                <span className="text-red-400 font-semibold">-{formatCurrency(opportunity.slippageEstimate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Trading Fees</span>
                <span className="text-red-400 font-semibold">-{formatCurrency(opportunity.tradingFees)}</span>
              </div>
              
              <div className="pt-3 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Net Benefit</span>
                  <span className={cn(
                    'text-lg font-bold',
                    opportunity.netTaxBenefit > 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {formatCurrency(opportunity.netTaxBenefit)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  After all costs • {((opportunity.netTaxBenefit / taxSavings) * 100).toFixed(1)}% efficiency
                </div>
              </div>
            </div>
          </div>
          
          {/* Execute Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExecuting}
              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <DisabledTooltipButton
              onClick={() => onExecute(opportunity.id)}
              disabled={isExecuting || opportunity.netTaxBenefit <= 0 || walletTooltip.isDisabled}
              disabledTooltip={
                walletTooltip.isDisabled 
                  ? walletTooltip.tooltipContent 
                  : (opportunity.netTaxBenefit <= 0 
                    ? 'Net benefit must be positive to execute' 
                    : (isExecuting ? 'Executing harvest...' : undefined))
              }
              className={cn(
                'flex-1 font-semibold',
                opportunity.netTaxBenefit > 0 && isConnected
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : 'bg-gray-600 cursor-not-allowed',
                'text-white border-0'
              )}
            >
              {isExecuting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Executing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Execute Harvest
                </>
              )}
            </DisabledTooltipButton>
          </div>
          
          {opportunity.netTaxBenefit <= 0 && (
            <p className="mt-3 text-xs text-center text-amber-400">
              ⚠️ Net benefit is negative. Execution not recommended.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
