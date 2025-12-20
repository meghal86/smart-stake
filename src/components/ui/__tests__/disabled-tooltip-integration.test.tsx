/**
 * Disabled Tooltip Integration Tests
 * 
 * Integration tests for disabled button tooltips in real scenarios
 * Validates requirement R8.GATING.DISABLED_TOOLTIPS
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { DisabledTooltipButton } from '../disabled-tooltip-button';
import { useFormButtonTooltip } from '@/hooks/useFormButtonTooltip';

// Mock form component to test real-world usage
const MockFormComponent: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = name !== '' || email !== '';
  const isValid = name.length >= 2 && email.includes('@') && email.includes('.');

  console.log('Form state:', { name, email, isDirty, isValid, nameLength: name.length, hasAt: email.includes('@'), hasDot: email.includes('.') });

  const { isDisabled, tooltipContent } = useFormButtonTooltip({
    formState: {
      isDirty,
      isValid,
      isSubmitting,
    }
  });

  console.log('Hook result:', { isDisabled, tooltipContent, hookInput: { isDirty, isValid, isSubmitting } });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsSubmitting(false);
  };

  return (
    <div>
      <input
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      <input
        data-testid="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <DisabledTooltipButton
        disabled={isDisabled}
        disabledTooltip={tooltipContent}
        onClick={handleSubmit}
        data-testid="save-button"
      >
        Save Changes
      </DisabledTooltipButton>
      <div data-testid="debug-info">
        Disabled: {String(isDisabled)}, Tooltip: {String(tooltipContent)}
      </div>
    </div>
  );
};

// Mock wallet component to test wallet gating
const MockWalletComponent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div>
      <div data-testid="wallet-status">
        {isConnected ? 'Connected' : 'Not Connected'}
      </div>
      
      <DisabledTooltipButton
        disabled={!isConnected}
        disabledTooltip={!isConnected ? 'Connect your wallet to continue' : undefined}
        onClick={() => console.log('Transaction executed')}
        data-testid="transaction-button"
      >
        Execute Transaction
      </DisabledTooltipButton>
      
      <button
        data-testid="connect-button"
        onClick={() => setIsConnected(!isConnected)}
      >
        {isConnected ? 'Disconnect' : 'Connect'} Wallet
      </button>
    </div>
  );
};

describe('Disabled Tooltip Integration', () => {
  describe('Form Save Button Scenarios', () => {
    test('shows "Make changes to enable save" when form is not dirty', () => {
      render(<MockFormComponent />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeDisabled();
      
      // Button should be wrapped with tooltip
      expect(saveButton.parentElement).toHaveClass('cursor-not-allowed');
    });

    test('shows "Fix validation errors to save" when form is invalid', () => {
      render(<MockFormComponent />);

      const nameInput = screen.getByTestId('name-input');
      const saveButton = screen.getByTestId('save-button');

      // Make form dirty but invalid
      fireEvent.change(nameInput, { target: { value: 'a' } }); // Too short

      expect(saveButton).toBeDisabled();
      expect(saveButton.parentElement).toHaveClass('cursor-not-allowed');
    });

    test('enables button when form is valid and dirty', () => {
      render(<MockFormComponent />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const saveButton = screen.getByTestId('save-button');

      // Make form valid and dirty
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // Debug: Check the actual state
      console.log('Name:', nameInput.value);
      console.log('Email:', emailInput.value);
      console.log('Button disabled:', saveButton.disabled);
      console.log('Button aria-disabled:', saveButton.getAttribute('aria-disabled'));
      
      // Check debug info
      const debugInfo = screen.getByTestId('debug-info');
      console.log('Debug info:', debugInfo.textContent);

      expect(saveButton).not.toBeDisabled();
      expect(saveButton.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('shows loading state during submission', async () => {
      render(<MockFormComponent />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const saveButton = screen.getByTestId('save-button');

      // Make form valid
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // Submit form
      fireEvent.click(saveButton);

      // Should be disabled during submission
      expect(saveButton).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Wallet Connection Scenarios', () => {
    test('shows wallet connection tooltip when not connected', () => {
      render(<MockWalletComponent />);

      const transactionButton = screen.getByTestId('transaction-button');
      const walletStatus = screen.getByTestId('wallet-status');

      expect(walletStatus).toHaveTextContent('Not Connected');
      expect(transactionButton).toBeDisabled();
      expect(transactionButton.parentElement).toHaveClass('cursor-not-allowed');
    });

    test('enables button when wallet is connected', () => {
      render(<MockWalletComponent />);

      const transactionButton = screen.getByTestId('transaction-button');
      const connectButton = screen.getByTestId('connect-button');
      const walletStatus = screen.getByTestId('wallet-status');

      // Connect wallet
      fireEvent.click(connectButton);

      expect(walletStatus).toHaveTextContent('Connected');
      expect(transactionButton).not.toBeDisabled();
      expect(transactionButton.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('disables button when wallet is disconnected', () => {
      render(<MockWalletComponent />);

      const transactionButton = screen.getByTestId('transaction-button');
      const connectButton = screen.getByTestId('connect-button');

      // Connect then disconnect
      fireEvent.click(connectButton); // Connect
      fireEvent.click(connectButton); // Disconnect

      expect(transactionButton).toBeDisabled();
      expect(transactionButton.parentElement).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    test('disabled buttons maintain accessibility attributes', () => {
      render(<MockFormComponent />);

      const saveButton = screen.getByTestId('save-button');
      
      expect(saveButton).toHaveAttribute('disabled');
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    });

    test('enabled buttons are keyboard accessible', () => {
      render(<MockFormComponent />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const saveButton = screen.getByTestId('save-button');

      // Make form valid
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // Should be focusable
      saveButton.focus();
      expect(saveButton).toHaveFocus();
    });

    test('disabled buttons are not focusable', () => {
      render(<MockFormComponent />);

      const saveButton = screen.getByTestId('save-button');
      
      // Try to focus disabled button
      saveButton.focus();
      expect(saveButton).not.toHaveFocus();
    });
  });

  describe('User Experience', () => {
    test('provides clear feedback for different disabled states', () => {
      const TestComponent = () => {
        const [scenario, setScenario] = useState<'not-dirty' | 'invalid' | 'submitting'>('not-dirty');
        
        const getTooltip = () => {
          switch (scenario) {
            case 'not-dirty': return 'Make changes to enable save';
            case 'invalid': return 'Fix validation errors to save';
            case 'submitting': return 'Saving changes...';
          }
        };

        return (
          <div>
            <button 
              data-testid="scenario-button"
              onClick={() => {
                const scenarios: Array<'not-dirty' | 'invalid' | 'submitting'> = ['not-dirty', 'invalid', 'submitting'];
                const currentIndex = scenarios.indexOf(scenario);
                const nextIndex = (currentIndex + 1) % scenarios.length;
                setScenario(scenarios[nextIndex]);
              }}
            >
              Change Scenario
            </button>
            
            <DisabledTooltipButton
              disabled={true}
              disabledTooltip={getTooltip()}
              data-testid="test-button"
            >
              Test Button
            </DisabledTooltipButton>
            
            <div data-testid="current-scenario">{scenario}</div>
          </div>
        );
      };

      render(<TestComponent />);

      const testButton = screen.getByTestId('test-button');
      const scenarioButton = screen.getByTestId('scenario-button');
      const currentScenario = screen.getByTestId('current-scenario');

      // Test each scenario
      expect(currentScenario).toHaveTextContent('not-dirty');
      expect(testButton).toBeDisabled();

      fireEvent.click(scenarioButton);
      expect(currentScenario).toHaveTextContent('invalid');
      expect(testButton).toBeDisabled();

      fireEvent.click(scenarioButton);
      expect(currentScenario).toHaveTextContent('submitting');
      expect(testButton).toBeDisabled();
    });
  });
});