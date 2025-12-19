/**
 * Integration Tests for Demo Banner Component
 * 
 * Tests that the demo banner appears when wallet is not connected
 * and displays the correct message: "Demo Mode — Data is simulated"
 * 
 * Requirements: R3.DEMO.BANNER_PERSISTENT, R3.DEMO.AUTO_SWITCHING
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DemoBanner } from '../DemoBanner';
import { DemoModeManager } from '@/lib/ux/DemoModeManager';

// Mock the useHomeAuth hook to control wallet connection state
const mockUseHomeAuth = vi.fn();
vi.mock('@/lib/context/HomeAuthContext', () => ({
  useHomeAuth: () => mockUseHomeAuth()
}));

// Mock the useNetworkStatus hook
const mockUseNetworkStatus = vi.fn();
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus()
}));

// Mock the useConnectModal hook from RainbowKit
const mockOpenConnectModal = vi.fn();
vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({
    openConnectModal: mockOpenConnectModal
  })
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn()
  }
}));

describe('DemoBanner Integration Tests', () => {
  let manager: DemoModeManager;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get fresh manager instance and reset state
    manager = DemoModeManager.getInstance();
    manager.reset();
    
    // Default mock implementations
    mockUseHomeAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });
    
    mockUseNetworkStatus.mockReturnValue({
      data: null,
      error: null,
      isLoading: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('demo banner appears when wallet not connected with correct message', async () => {
    // Ensure wallet is not connected
    mockUseHomeAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    // Render the DemoBanner component
    render(<DemoBanner />);

    // Wait for the banner to appear
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Verify the banner shows the correct demo mode message
    expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
    
    // Verify the CTA button is present
    expect(screen.getByText('Connect Wallet for Live Data')).toBeInTheDocument();
    
    // Verify the banner has the correct ARIA label
    expect(screen.getByLabelText('Demo mode notification')).toBeInTheDocument();
  });

  test('demo banner is visible by default when manager is in demo mode', async () => {
    // Ensure manager is in demo mode (default state)
    expect(manager.isDemo()).toBe(true);
    expect(manager.shouldShowBanner()).toBe(true);

    render(<DemoBanner />);

    // Banner should be visible
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Should show the wallet not connected message
    expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
  });

  test('demo banner state reflects manager state correctly', async () => {
    // Start with wallet not connected (banner visible)
    mockUseHomeAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    render(<DemoBanner />);

    // Banner should be visible initially
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Verify the manager is in demo mode
    expect(manager.isDemo()).toBe(true);
    expect(manager.shouldShowBanner()).toBe(true);

    // Verify the banner shows the correct message for wallet not connected
    expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet for Live Data')).toBeInTheDocument();
  });

  test('demo banner shows different message when data sources are unavailable', async () => {
    // Simulate wallet connected but data sources unavailable
    mockUseHomeAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' }
    });

    // Mock fetch to simulate API failures
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Update demo mode to reflect data sources unavailable
    await manager.updateDemoMode(true);

    render(<DemoBanner />);

    // Wait for banner to appear with different message
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Should show data unavailable message
    expect(screen.getByText('Demo Mode — Live data temporarily unavailable')).toBeInTheDocument();
    expect(screen.getByText('Retry Live Data')).toBeInTheDocument();
  });

  test('demo banner can be dismissed when dismissible prop is true', async () => {
    render(<DemoBanner dismissible={true} />);

    // Banner should be visible initially
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Find and click the dismiss button
    const dismissButton = screen.getByLabelText('Dismiss demo banner');
    expect(dismissButton).toBeInTheDocument();

    dismissButton.click();

    // Banner should disappear after dismissal
    await waitFor(() => {
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });
  });

  test('demo banner CTA button triggers wallet connection when wallet not connected', async () => {
    mockUseHomeAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    render(<DemoBanner />);

    // Wait for banner to appear
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Click the CTA button
    const ctaButton = screen.getByText('Connect Wallet for Live Data');
    ctaButton.click();

    // Should trigger wallet connection modal
    expect(mockOpenConnectModal).toHaveBeenCalledOnce();
  });

  test('demo banner has proper accessibility attributes', async () => {
    render(<DemoBanner />);

    await waitFor(() => {
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
      
      // Check ARIA label
      expect(banner).toHaveAttribute('aria-label', 'Demo mode notification');
      
      // Check that buttons have proper labels
      const ctaButton = screen.getByLabelText('Connect Wallet for Live Data');
      expect(ctaButton).toBeInTheDocument();
    });
  });

  test('demo banner persists across component re-renders when in demo mode', async () => {
    const { rerender } = render(<DemoBanner />);

    // Banner should be visible
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Re-render multiple times
    rerender(<DemoBanner />);
    rerender(<DemoBanner />);
    rerender(<DemoBanner />);

    // Banner should still be visible
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
  });
});