/**
 * CEX Execution Panel
 * Manual execution instructions for CEX holdings
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * Requirement 9.1: Display CEX instruction panel in execution flow
 * Requirement 9.2: Provide numbered steps specific to exchange platform
 * Requirement 9.3: Include exact token pair, quantity, and order type
 * Requirement 9.4: Update step status when user marks complete
 * Requirement 9.5: Proceed to success screen when all steps complete
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ExternalLink, AlertCircle, Info } from 'lucide-react';
import type { ExecutionStep } from '@/types/harvestpro';
import { getPlatformTradeUrl } from '@/lib/harvestpro/cex-execution';

export interface CEXExecutionPanelProps {
  steps: ExecutionStep[];
  onStepComplete: (stepId: string) => void;
  onAllComplete: () => void;
}

export function CEXExecutionPanel({
  steps,
  onStepComplete,
  onAllComplete,
}: CEXExecutionPanelProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Initialize completed steps from step status
  useEffect(() => {
    const completed = new Set(
      steps.filter((step) => step.status === 'completed').map((step) => step.id)
    );
    setCompletedSteps(completed);
  }, [steps]);

  const handleStepToggle = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      onStepComplete(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  // Check if all steps are completed (Requirement 9.5)
  useEffect(() => {
    if (completedSteps.size === steps.length && steps.length > 0) {
      onAllComplete();
    }
  }, [completedSteps.size, steps.length, onAllComplete]);

  const cexPlatform = steps[0]?.cexPlatform || 'Exchange';
  const completionPercentage = (completedSteps.size / steps.length) * 100;
  
  // Extract trade details from metadata (Requirement 9.3)
  const tradeDetails = extractTradeDetails(steps);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-100 dark:border-purple-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manual CEX Execution
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Follow these steps on {cexPlatform}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {completedSteps.size}/{steps.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">completed</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trade Details Summary - Requirement 9.3 */}
      {tradeDetails && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Trade Details</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Prepare this exact order on {cexPlatform}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {tradeDetails.tokenPair && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Trading Pair</p>
                <p className="font-semibold text-gray-900 dark:text-white">{tradeDetails.tokenPair}</p>
              </div>
            )}
            {tradeDetails.orderType && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Order Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">{tradeDetails.orderType}</p>
              </div>
            )}
            {tradeDetails.quantity !== undefined && tradeDetails.quantity > 0 && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tradeDetails.quantity.toFixed(8)} {tradeDetails.token}
                </p>
              </div>
            )}
            {tradeDetails.token && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Token</p>
                <p className="font-semibold text-gray-900 dark:text-white">{tradeDetails.token}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Important</p>
            <p className="mt-1">
              Check each step as you complete it. Make sure to prepare the exact quantities shown above.
            </p>
          </div>
        </div>

        {/* Steps - Requirement 9.2: Platform-specific numbered steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            return (
              <CEXStepCard
                key={step.id}
                step={step}
                index={index}
                isCompleted={isCompleted}
                onToggle={() => handleStepToggle(step.id)}
              />
            );
          })}
        </div>

        {/* Platform Link */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <a
            href={getPlatformTradeUrl(cexPlatform, tradeDetails?.tokenPair)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open {cexPlatform} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface CEXStepCardProps {
  step: ExecutionStep;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

function CEXStepCard({ step, index, isCompleted, onToggle }: CEXStepCardProps) {
  const platformInstructions = getPlatformSpecificInstructions(step);
  
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isCompleted
          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
          : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400 dark:text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              {index + 1}
            </span>
            <p
              className={`font-medium ${
                isCompleted
                  ? 'text-green-900 dark:text-green-100 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {step.description}
            </p>
          </div>

          {/* Platform-specific instructions - Requirement 9.2 */}
          {platformInstructions && !isCompleted && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {platformInstructions}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Extract trade details from execution steps metadata
 * Requirement 9.3: Include exact token pair, quantity, and order type
 */
function extractTradeDetails(steps: ExecutionStep[]): {
  tokenPair?: string;
  orderType?: string;
  token?: string;
  quantity?: number;
} | null {
  for (const step of steps) {
    if (step.metadata) {
      const { tokenPair, orderType, token, quantity } = step.metadata;
      if (tokenPair || orderType || token || quantity !== undefined) {
        return { tokenPair, orderType, token, quantity };
      }
    }
  }
  return null;
}

/**
 * Get platform-specific URL
 */
function getPlatformUrl(platform: string): string {
  const urls: Record<string, string> = {
    Binance: 'https://www.binance.com/en/trade',
    Coinbase: 'https://www.coinbase.com/trade',
    Kraken: 'https://www.kraken.com/trade',
    'Binance.US': 'https://www.binance.us/en/trade',
  };
  return urls[platform] || 'https://www.google.com/search?q=' + encodeURIComponent(platform);
}

/**
 * Get platform-specific instructions for each step
 * Requirement 9.2: Provide numbered steps specific to exchange platform
 */
function getPlatformSpecificInstructions(step: ExecutionStep): string | null {
  // Use metadata instruction if available
  if (step.metadata?.instruction) {
    return step.metadata.instruction;
  }

  // Fallback to description-based instructions
  const description = step.description.toLowerCase();
  const platform = step.cexPlatform || 'exchange';

  if (description.includes('log in')) {
    return getLoginInstructions(platform);
  }

  if (description.includes('navigate')) {
    return getNavigationInstructions(platform, step.metadata?.tokenPair);
  }

  if (description.includes('place') && description.includes('order')) {
    return getOrderInstructions(platform, step.metadata?.orderType);
  }

  if (description.includes('confirm')) {
    return getConfirmationInstructions(platform);
  }

  return null;
}

/**
 * Platform-specific login instructions
 */
function getLoginInstructions(platform: string): string {
  const instructions: Record<string, string> = {
    Binance: 'Go to binance.com and log in with your email and password. Complete 2FA if enabled.',
    Coinbase: 'Visit coinbase.com and sign in with your credentials. Verify with 2FA if required.',
    Kraken: 'Navigate to kraken.com and log in. Complete any security verification steps.',
    'Binance.US': 'Go to binance.us and log in with your account credentials.',
  };
  return instructions[platform] || `Log in to ${platform} with your account credentials`;
}

/**
 * Platform-specific navigation instructions
 */
function getNavigationInstructions(platform: string, tokenPair?: string): string {
  const pair = tokenPair || 'the trading pair';
  const instructions: Record<string, string> = {
    Binance: `Click "Trade" → "Spot" in the top menu, then search for ${pair} in the trading pair selector.`,
    Coinbase: `Click "Trade" in the main navigation, then select ${pair} from the trading pairs list.`,
    Kraken: `Go to "Trade" → "Spot" and search for ${pair} in the pair selector.`,
    'Binance.US': `Navigate to "Trade" → "Spot Trading" and find ${pair} in the markets list.`,
  };
  return instructions[platform] || `Navigate to the trading section and select ${pair}`;
}

/**
 * Platform-specific order placement instructions
 */
function getOrderInstructions(platform: string, orderType?: string): string {
  const type = orderType || 'Market Sell';
  const instructions: Record<string, string> = {
    Binance: `In the order panel, select "Sell" → "Market". Enter the exact quantity shown above and click "Sell".`,
    Coinbase: `Select "Sell" in the order form. Choose "Market" order type, enter the quantity, and click "Preview Sell".`,
    Kraken: `Click "Sell" tab, select "Market" order, input the quantity, and click "Submit Order".`,
    'Binance.US': `Choose "Sell" → "Market Order", enter the quantity, and click "Sell".`,
  };
  return instructions[platform] || `Place a ${type} order for the exact quantity shown above`;
}

/**
 * Platform-specific confirmation instructions
 */
function getConfirmationInstructions(platform: string): string {
  const instructions: Record<string, string> = {
    Binance: 'Check "Order History" to verify the order was filled. Note the average execution price.',
    Coinbase: 'View "Recent Activity" to confirm the order prepared. Record the fill price for your records.',
    Kraken: 'Go to "Orders" → "Order History" to verify completion. Save the execution details.',
    'Binance.US': 'Check "Order History" under "Orders" to confirm the trade prepared successfully.',
  };
  return instructions[platform] || 'Verify the order was filled successfully in your order history';
}
