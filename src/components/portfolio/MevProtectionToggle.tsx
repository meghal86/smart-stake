'use client';

/**
 * MEV Protection Toggle Component
 * 
 * Allows users to configure MEV protection mode for portfolio transactions.
 * V1.1 Feature: Requirement 14.3
 */

import { useState } from 'react';
import type { MevProtectedMode } from '@/types/portfolio';
import { 
  isMevSupportedChain, 
  getMevProtectionStatus 
} from '@/lib/portfolio/mevProtection';

interface MevProtectionToggleProps {
  currentMode: MevProtectedMode;
  chainId: number;
  onChange: (mode: MevProtectedMode) => void;
  disabled?: boolean;
}

export function MevProtectionToggle({
  currentMode,
  chainId,
  onChange,
  disabled = false
}: MevProtectionToggleProps) {
  const [mode, setMode] = useState<MevProtectedMode>(currentMode);
  const status = getMevProtectionStatus(mode, chainId);
  const isSupported = isMevSupportedChain(chainId);

  const handleModeChange = (newMode: MevProtectedMode) => {
    setMode(newMode);
    onChange(newMode);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            MEV Protection
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Protect transactions from MEV (Maximal Extractable Value) attacks
          </p>
        </div>
        {status.enabled && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
            Active
          </span>
        )}
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <input
            type="radio"
            name="mev-mode"
            value="off"
            checked={mode === 'off'}
            onChange={() => handleModeChange('off')}
            disabled={disabled}
            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-transparent border-gray-600"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Off</div>
            <div className="text-xs text-gray-400">
              No MEV protection (faster, lower cost)
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <input
            type="radio"
            name="mev-mode"
            value="auto"
            checked={mode === 'auto'}
            onChange={() => handleModeChange('auto')}
            disabled={disabled}
            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-transparent border-gray-600"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              Auto (Recommended)
            </div>
            <div className="text-xs text-gray-400">
              Use MEV protection when available on the chain
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <input
            type="radio"
            name="mev-mode"
            value="force"
            checked={mode === 'force'}
            onChange={() => handleModeChange('force')}
            disabled={disabled || !isSupported}
            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-transparent border-gray-600 disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              Force
              {!isSupported && (
                <span className="ml-2 text-xs text-gray-500">
                  (Not available on this chain)
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Always require MEV protection (blocks unsupported chains)
            </div>
          </div>
        </label>
      </div>

      {/* Status Display */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">
            {status.enabled ? (
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-white">
              {status.enabled ? 'Protected' : 'Not Protected'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {status.reason}
              {status.provider && ` via ${status.provider}`}
            </div>
          </div>
        </div>
      </div>

      {/* Chain Support Info */}
      {!isSupported && mode !== 'off' && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-medium text-yellow-400">
                MEV Protection Not Available
              </div>
              <div className="text-xs text-yellow-400/80 mt-0.5">
                Chain {chainId} does not currently support MEV protection. Transactions will proceed without protection.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
