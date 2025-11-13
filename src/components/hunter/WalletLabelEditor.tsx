/**
 * WalletLabelEditor Component
 * 
 * Inline editor for wallet labels in the WalletSelector dropdown.
 * Allows users to set custom labels for their wallets.
 * 
 * Features:
 * - Inline editing with input field
 * - Save/cancel buttons
 * - Optimistic updates
 * - Loading states
 * - Error handling
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 * - Accessibility features
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.18
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 51
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalletLabels } from '@/hooks/useWalletLabels';

// ============================================================================
// Types
// ============================================================================

interface WalletLabelEditorProps {
  address: string;
  currentLabel?: string;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function WalletLabelEditor({
  address,
  currentLabel,
  onSave,
  onCancel,
  className,
}: WalletLabelEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(currentLabel || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setLabel: saveLabel, removeLabel, isSettingLabel } = useWalletLabels();

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle save
  const handleSave = () => {
    const trimmedLabel = label.trim();
    
    if (trimmedLabel) {
      saveLabel(address, trimmedLabel);
    } else if (currentLabel) {
      // Remove label if empty and there was a previous label
      removeLabel(address);
    }
    
    setIsEditing(false);
    onSave?.();
  };

  // Handle cancel
  const handleCancel = () => {
    setLabel(currentLabel || '');
    setIsEditing(false);
    onCancel?.();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // If not editing, show edit button
  if (!isEditing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded',
          'text-xs text-gray-500 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-750',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          className
        )}
        aria-label={currentLabel ? `Edit label for wallet ${address}` : `Add label for wallet ${address}`}
        type="button"
      >
        <Edit2 className="w-3 h-3" aria-hidden="true" />
        <span>{currentLabel ? 'Edit Label' : 'Add Label'}</span>
      </button>
    );
  }

  // Editing mode
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 p-1',
        'bg-gray-50 dark:bg-gray-800 rounded',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Wallet label..."
        maxLength={50}
        disabled={isSettingLabel}
        className={cn(
          'flex-1 px-2 py-1 text-xs',
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700 rounded',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-w-[120px]'
        )}
        aria-label="Wallet label"
      />
      
      <button
        onClick={handleSave}
        disabled={isSettingLabel}
        className={cn(
          'p-1 rounded',
          'text-green-600 dark:text-green-400',
          'hover:bg-green-50 dark:hover:bg-green-900/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset',
          'transition-colors duration-150'
        )}
        aria-label="Save label"
        type="button"
      >
        <Check className="w-4 h-4" aria-hidden="true" />
      </button>
      
      <button
        onClick={handleCancel}
        disabled={isSettingLabel}
        className={cn(
          'p-1 rounded',
          'text-gray-500 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-750',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-inset',
          'transition-colors duration-150'
        )}
        aria-label="Cancel"
        type="button"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

