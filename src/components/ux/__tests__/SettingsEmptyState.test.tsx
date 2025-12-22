import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsEmptyState } from '../SettingsEmptyState';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('SettingsEmptyState', () => {
  const mockProps = {
    onSetupProfile: vi.fn(),
    onConnectWallet: vi.fn(),
    onConfigureNotifications: vi.fn(),
    onRefresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Settings Types', () => {
    it('renders profile settings type correctly', () => {
      render(<SettingsEmptyState settingsType="profile" />);
      
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(screen.getByText(/Set up your profile to personalize/)).toBeInTheDocument();
    });

    it('renders preferences settings type correctly', () => {
      render(<SettingsEmptyState settingsType="preferences" />);
      
      expect(screen.getByText('Customize Your Experience')).toBeInTheDocument();
      expect(screen.getByText(/Customize your dashboard, themes/)).toBeInTheDocument();
    });

    it('renders notifications settings type correctly', () => {
      render(<SettingsEmptyState settingsType="notifications" />);
      
      expect(screen.getByText('Set Up Notifications')).toBeInTheDocument();
      expect(screen.getByText(/Configure alerts and notifications/)).toBeInTheDocument();
    });

    it('renders security settings type correctly', () => {
      render(<SettingsEmptyState settingsType="security" />);
      
      expect(screen.getByText('Secure Your Account')).toBeInTheDocument();
      expect(screen.getByText(/Enhance your account security/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders setup profile action for profile type', () => {
      render(
        <SettingsEmptyState 
          settingsType="profile"
          onSetupProfile={mockProps.onSetupProfile}
        />
      );
      
      expect(screen.getByText('Set up profile')).toBeInTheDocument();
    });

    it('calls onSetupProfile when setup profile button is clicked', () => {
      render(
        <SettingsEmptyState 
          settingsType="profile"
          onSetupProfile={mockProps.onSetupProfile}
        />
      );
      
      fireEvent.click(screen.getByText('Set up profile'));
      expect(mockProps.onSetupProfile).toHaveBeenCalledTimes(1);
    });

    it('renders connect wallet action for security type', () => {
      render(
        <SettingsEmptyState 
          settingsType="security"
          onConnectWallet={mockProps.onConnectWallet}
        />
      );
      
      expect(screen.getByText('Connect wallet')).toBeInTheDocument();
    });

    it('calls onConnectWallet when connect wallet button is clicked', () => {
      render(
        <SettingsEmptyState 
          settingsType="security"
          onConnectWallet={mockProps.onConnectWallet}
        />
      );
      
      fireEvent.click(screen.getByText('Connect wallet'));
      expect(mockProps.onConnectWallet).toHaveBeenCalledTimes(1);
    });

    it('renders configure notifications action for notifications type', () => {
      render(
        <SettingsEmptyState 
          settingsType="notifications"
          onConfigureNotifications={mockProps.onConfigureNotifications}
        />
      );
      
      expect(screen.getByText('Configure notifications')).toBeInTheDocument();
    });

    it('calls onConfigureNotifications when configure notifications button is clicked', () => {
      render(
        <SettingsEmptyState 
          settingsType="notifications"
          onConfigureNotifications={mockProps.onConfigureNotifications}
        />
      );
      
      fireEvent.click(screen.getByText('Configure notifications'));
      expect(mockProps.onConfigureNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scan Checklist', () => {
    it('renders base checklist items', () => {
      render(<SettingsEmptyState />);
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('Account created successfully')).toBeInTheDocument();
      expect(screen.getByText('Basic settings initialized')).toBeInTheDocument();
    });

    it('renders profile-specific checklist items', () => {
      render(<SettingsEmptyState settingsType="profile" />);
      
      expect(screen.getByText('Profile information')).toBeInTheDocument();
      expect(screen.getByText('Trading preferences')).toBeInTheDocument();
      expect(screen.getByText('Notification settings')).toBeInTheDocument();
    });

    it('renders preferences-specific checklist items', () => {
      render(<SettingsEmptyState settingsType="preferences" />);
      
      expect(screen.getByText('Theme selection')).toBeInTheDocument();
      expect(screen.getByText('Dashboard layout')).toBeInTheDocument();
      expect(screen.getByText('Data preferences')).toBeInTheDocument();
    });

    it('renders notifications-specific checklist items', () => {
      render(<SettingsEmptyState settingsType="notifications" />);
      
      expect(screen.getByText('Alert preferences')).toBeInTheDocument();
      expect(screen.getByText('Delivery methods')).toBeInTheDocument();
      expect(screen.getByText('Frequency settings')).toBeInTheDocument();
    });

    it('renders security-specific checklist items', () => {
      render(<SettingsEmptyState settingsType="security" />);
      
      expect(screen.getByText('Wallet connection')).toBeInTheDocument();
      expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
      expect(screen.getByText('Session management')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when onRefresh is provided', () => {
      render(<SettingsEmptyState onRefresh={mockProps.onRefresh} />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      render(<SettingsEmptyState onRefresh={mockProps.onRefresh} />);
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows refreshing state correctly', () => {
      render(
        <SettingsEmptyState 
          onRefresh={mockProps.onRefresh}
          isRefreshing={true}
        />
      );
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on action buttons', () => {
      render(
        <SettingsEmptyState 
          settingsType="profile"
          onSetupProfile={mockProps.onSetupProfile}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      expect(screen.getByLabelText('Set up profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    it('maintains proper heading structure', () => {
      render(<SettingsEmptyState />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toHaveTextContent('Complete Your Profile');
      expect(subHeading).toHaveTextContent('Items Scanned:');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <SettingsEmptyState className="custom-settings-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-settings-class');
    });
  });
});