/**
 * Disabled Tooltip Demo Test
 * 
 * Tests the demo component used for Task 8 evidence requirements
 * 
 * @see .kiro/specs/ux-gap-requirements/tasks.md - Task 8
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisabledTooltipDemo } from '../DisabledTooltipDemo';

describe('DisabledTooltipDemo', () => {
  test('renders demo title and description', () => {
    render(<DisabledTooltipDemo />);
    
    expect(screen.getByText('Disabled Button Tooltips Demo')).toBeInTheDocument();
    expect(screen.getByText('Hover over disabled buttons to see explanatory tooltips')).toBeInTheDocument();
    expect(screen.getByText('Task 8: R8.GATING.DISABLED_TOOLTIPS')).toBeInTheDocument();
  });

  test('renders control panel with toggles', () => {
    render(<DisabledTooltipDemo />);
    
    expect(screen.getByText('Demo Controls')).toBeInTheDocument();
    expect(screen.getByLabelText('Has Items')).toBeInTheDocument();
    expect(screen.getByLabelText('Wallet Connected')).toBeInTheDocument();
    expect(screen.getByLabelText('Has Selection')).toBeInTheDocument();
    expect(screen.getByLabelText('Valid Input')).toBeInTheDocument();
    expect(screen.getByLabelText('Premium User')).toBeInTheDocument();
  });

  test('renders all tooltip categories', () => {
    render(<DisabledTooltipDemo />);
    
    expect(screen.getByText('Loading State Tooltips')).toBeInTheDocument();
    expect(screen.getByText('Prerequisite Tooltips')).toBeInTheDocument();
    expect(screen.getByText('Wallet Connection Tooltips')).toBeInTheDocument();
    expect(screen.getByText('Premium Feature Tooltips')).toBeInTheDocument();
  });

  test('buttons are initially disabled with appropriate states', () => {
    render(<DisabledTooltipDemo />);
    
    // Export button should be disabled when no items
    const exportButton = screen.getByText('Export CSV').closest('button');
    expect(exportButton).toBeDisabled();
    
    // Remove button should be disabled when no selection
    const removeButton = screen.getByText('Remove Selected').closest('button');
    expect(removeButton).toBeDisabled();
    
    // Alert button should be disabled when no valid input
    const alertButton = screen.getByText('Create Alert').closest('button');
    expect(alertButton).toBeDisabled();
    
    // Wallet buttons should be disabled when not connected
    const connectButton = screen.getByText('Connect Wallet').closest('button');
    expect(connectButton).toBeDisabled();
  });

  test('toggles change button states', () => {
    render(<DisabledTooltipDemo />);
    
    // Initially export button is disabled
    const exportButton = screen.getByText('Export CSV').closest('button');
    expect(exportButton).toBeDisabled();
    
    // Enable "Has Items" toggle
    const hasItemsToggle = screen.getByLabelText('Has Items');
    fireEvent.click(hasItemsToggle);
    
    // Export button should now be enabled
    expect(exportButton).not.toBeDisabled();
  });

  test('wallet connection toggle affects wallet buttons', () => {
    render(<DisabledTooltipDemo />);
    
    // Initially wallet buttons show "Connect Wallet"
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    
    // Enable wallet connection
    const walletToggle = screen.getByLabelText('Wallet Connected');
    fireEvent.click(walletToggle);
    
    // Button text should change to "Wallet Connected"
    expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
  });

  test('premium toggle affects premium buttons', () => {
    render(<DisabledTooltipDemo />);
    
    // Initially shows "Upgrade to Premium"
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    
    // Enable premium
    const premiumToggle = screen.getByLabelText('Premium User');
    fireEvent.click(premiumToggle);
    
    // Button text should change to "Current Plan"
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  test('renders implementation summary', () => {
    render(<DisabledTooltipDemo />);
    
    expect(screen.getByText('✅ Implementation Summary')).toBeInTheDocument();
    expect(screen.getByText('Loading states (13 tooltips)')).toBeInTheDocument();
    expect(screen.getByText('Prerequisites (6 tooltips)')).toBeInTheDocument();
    expect(screen.getByText('14 components across the app')).toBeInTheDocument();
    expect(screen.getByText('19 meaningful tooltip messages')).toBeInTheDocument();
  });

  test('renders testing instructions', () => {
    render(<DisabledTooltipDemo />);
    
    expect(screen.getByText('How to Test')).toBeInTheDocument();
    expect(screen.getByText(/Hover over disabled buttons/)).toBeInTheDocument();
    expect(screen.getByText(/Use keyboard navigation/)).toBeInTheDocument();
    expect(screen.getByText(/Toggle the controls above/)).toBeInTheDocument();
  });

  test('run analysis button triggers loading state', () => {
    render(<DisabledTooltipDemo />);
    
    const runAnalysisButton = screen.getByText('Run Analysis').closest('button');
    expect(runAnalysisButton).not.toBeDisabled();
    
    // Click to start analysis
    fireEvent.click(runAnalysisButton!);
    
    // Button should now show loading state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(runAnalysisButton).toBeDisabled();
  });

  test('all demo buttons have proper accessibility attributes', () => {
    render(<DisabledTooltipDemo />);
    
    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      // All buttons should be focusable
      expect(button).toHaveAttribute('tabIndex');
      
      // Disabled buttons should have aria-disabled
      if (button.hasAttribute('disabled')) {
        expect(button).toHaveAttribute('aria-disabled', 'true');
      }
    });
  });

  test('demo showcases all required tooltip types', () => {
    render(<DisabledTooltipDemo />);
    
    // Should have examples of all tooltip categories mentioned in the task
    const tooltipCategories = [
      'Loading State Tooltips',
      'Prerequisite Tooltips', 
      'Wallet Connection Tooltips',
      'Premium Feature Tooltips'
    ];
    
    tooltipCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });
});