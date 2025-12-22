import React from 'react';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from './ActionableEmptyState';
import { Settings, User, Wallet, RefreshCw } from 'lucide-react';

interface SettingsEmptyStateProps {
  settingsType?: 'profile' | 'preferences' | 'notifications' | 'security';
  onSetupProfile?: () => void;
  onConnectWallet?: () => void;
  onConfigureNotifications?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function SettingsEmptyState({
  settingsType = 'profile',
  onSetupProfile,
  onConnectWallet,
  onConfigureNotifications,
  onRefresh,
  isRefreshing = false,
  className
}: SettingsEmptyStateProps) {
  const getTitle = () => {
    switch (settingsType) {
      case 'profile':
        return 'Complete Your Profile';
      case 'preferences':
        return 'Customize Your Experience';
      case 'notifications':
        return 'Set Up Notifications';
      case 'security':
        return 'Secure Your Account';
      default:
        return 'Configure Settings';
    }
  };

  const getDescription = () => {
    switch (settingsType) {
      case 'profile':
        return 'Set up your profile to personalize your AlphaWhale experience and unlock advanced features.';
      case 'preferences':
        return 'Customize your dashboard, themes, and data preferences to match your trading style.';
      case 'notifications':
        return 'Configure alerts and notifications to stay informed about opportunities and risks.';
      case 'security':
        return 'Enhance your account security with two-factor authentication and wallet connections.';
      default:
        return 'Configure your settings to get the most out of AlphaWhale.';
    }
  };

  const actions: EmptyStateAction[] = [];

  switch (settingsType) {
    case 'profile':
      if (onSetupProfile) {
        actions.push({
          label: 'Set up profile',
          onClick: onSetupProfile,
          variant: 'default',
          icon: User
        });
      }
      break;
    case 'preferences':
      actions.push({
        label: 'Customize preferences',
        onClick: onSetupProfile || (() => {}),
        variant: 'default',
        icon: Settings
      });
      break;
    case 'notifications':
      if (onConfigureNotifications) {
        actions.push({
          label: 'Configure notifications',
          onClick: onConfigureNotifications,
          variant: 'default',
          icon: Settings
        });
      }
      break;
    case 'security':
      if (onConnectWallet) {
        actions.push({
          label: 'Connect wallet',
          onClick: onConnectWallet,
          variant: 'default',
          icon: Wallet
        });
      }
      break;
  }

  const getScanChecklist = (): ScanChecklist[] => {
    const baseChecklist = [
      { 
        item: 'Account created successfully', 
        checked: true,
        description: 'Welcome to AlphaWhale!'
      },
      { 
        item: 'Basic settings initialized', 
        checked: true,
        description: 'Default preferences applied'
      }
    ];

    switch (settingsType) {
      case 'profile':
        baseChecklist.push(
          { 
            item: 'Profile information', 
            checked: false,
            description: 'Name, avatar, bio'
          },
          { 
            item: 'Trading preferences', 
            checked: false,
            description: 'Risk tolerance, strategies'
          },
          { 
            item: 'Notification settings', 
            checked: false,
            description: 'Alerts and updates'
          }
        );
        break;
      case 'preferences':
        baseChecklist.push(
          { 
            item: 'Theme selection', 
            checked: false,
            description: 'Dark/light mode'
          },
          { 
            item: 'Dashboard layout', 
            checked: false,
            description: 'Widget arrangement'
          },
          { 
            item: 'Data preferences', 
            checked: false,
            description: 'Currency, timezone'
          }
        );
        break;
      case 'notifications':
        baseChecklist.push(
          { 
            item: 'Alert preferences', 
            checked: false,
            description: 'Risk alerts, opportunities'
          },
          { 
            item: 'Delivery methods', 
            checked: false,
            description: 'Email, push, SMS'
          },
          { 
            item: 'Frequency settings', 
            checked: false,
            description: 'Real-time, daily, weekly'
          }
        );
        break;
      case 'security':
        baseChecklist.push(
          { 
            item: 'Wallet connection', 
            checked: false,
            description: 'MetaMask, WalletConnect'
          },
          { 
            item: 'Two-factor authentication', 
            checked: false,
            description: 'Enhanced security'
          },
          { 
            item: 'Session management', 
            checked: false,
            description: 'Auto-logout, device trust'
          }
        );
        break;
    }

    return baseChecklist;
  };

  return (
    <ActionableEmptyState
      type="no-data-available"
      title={getTitle()}
      description={getDescription()}
      actions={actions}
      scanChecklist={getScanChecklist()}
      showRefresh={!!onRefresh}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      className={className}
    />
  );
}