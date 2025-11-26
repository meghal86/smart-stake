/**
 * CEX Execution Example
 * Demonstrates the CEX manual execution flow
 * This is an example component for testing and documentation
 */

import React from 'react';
import { CEXExecutionPanel } from './CEXExecutionPanel';
import { generateCEXExecutionSteps } from '@/lib/harvestpro/cex-execution';

/**
 * Example: Binance ETH Harvest
 */
export function BinanceETHExample() {
  const steps = generateCEXExecutionSteps(
    'example-session-1',
    'Binance',
    'ETH',
    0.12345678,
    'ETH/USDT'
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Example: Binance ETH Harvest</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This example shows the CEX manual execution flow for harvesting 0.12345678 ETH on Binance.
      </p>
      
      <CEXExecutionPanel
        steps={steps}
        onStepComplete={(stepId) => {
          console.log('Step completed:', stepId);
        }}
        onAllComplete={() => {
          console.log('All steps complete! Navigate to success screen.');
          alert('All CEX steps completed! In production, this would navigate to the success screen.');
        }}
      />
    </div>
  );
}

/**
 * Example: Coinbase BTC Harvest
 */
export function CoinbaseBTCExample() {
  const steps = generateCEXExecutionSteps(
    'example-session-2',
    'Coinbase',
    'BTC',
    0.00543210,
    'BTC/USD'
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Example: Coinbase BTC Harvest</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This example shows the CEX manual execution flow for harvesting 0.00543210 BTC on Coinbase.
      </p>
      
      <CEXExecutionPanel
        steps={steps}
        onStepComplete={(stepId) => {
          console.log('Step completed:', stepId);
        }}
        onAllComplete={() => {
          console.log('All steps complete! Navigate to success screen.');
          alert('All CEX steps completed! In production, this would navigate to the success screen.');
        }}
      />
    </div>
  );
}

/**
 * Example: Kraken SOL Harvest
 */
export function KrakenSOLExample() {
  const steps = generateCEXExecutionSteps(
    'example-session-3',
    'Kraken',
    'SOL',
    15.75,
    'SOL/USD'
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Example: Kraken SOL Harvest</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This example shows the CEX manual execution flow for harvesting 15.75 SOL on Kraken.
      </p>
      
      <CEXExecutionPanel
        steps={steps}
        onStepComplete={(stepId) => {
          console.log('Step completed:', stepId);
        }}
        onAllComplete={() => {
          console.log('All steps complete! Navigate to success screen.');
          alert('All CEX steps completed! In production, this would navigate to the success screen.');
        }}
      />
    </div>
  );
}

/**
 * Combined Example Page
 */
export function CEXExecutionExamples() {
  const [activeExample, setActiveExample] = React.useState<'binance' | 'coinbase' | 'kraken'>('binance');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">CEX Manual Execution Examples</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive examples of the CEX manual execution flow for different exchanges
          </p>
        </div>

        {/* Example Selector */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveExample('binance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeExample === 'binance'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Binance ETH
          </button>
          <button
            onClick={() => setActiveExample('coinbase')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeExample === 'coinbase'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Coinbase BTC
          </button>
          <button
            onClick={() => setActiveExample('kraken')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeExample === 'kraken'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Kraken SOL
          </button>
        </div>

        {/* Active Example */}
        {activeExample === 'binance' && <BinanceETHExample />}
        {activeExample === 'coinbase' && <CoinbaseBTCExample />}
        {activeExample === 'kraken' && <KrakenSOLExample />}

        {/* Features List */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Features Demonstrated</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Trade Details Summary:</strong> Token pair, order type, and exact quantity displayed prominently</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Platform-Specific Instructions:</strong> Tailored guidance for each exchange</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Progress Tracking:</strong> Visual progress bar and step counter</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Step Completion:</strong> Click to mark steps as complete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Direct Links:</strong> Quick access to exchange trading pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>Auto-Navigation:</strong> Proceeds to success screen when all steps complete</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
