/**
 * ProofModal External Links Test
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R14.TRUST.METRICS_PROOF
 * Task: Verify that external proof links open in new tabs to preserve context
 * 
 * This test verifies that the ProofModal component correctly handles external links
 * by opening them in new tabs with proper security attributes.
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProofModal } from '../ProofModal';
import { ProofModalConfig } from '@/lib/ux/TrustSignalVerification';

// Mock window.open
const mockWindowOpen = vi.fn();
const mockLocationHref = vi.fn();

// Store original implementations
const originalWindowOpen = window.open;
const originalLocationHref = window.location.href;

describe('ProofModal External Links', () => {
  beforeEach(() => {
    // Mock window.open
    window.open = mockWindowOpen;
    
    // Mock window.location.href setter
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        href: originalLocationHref
      },
      writable: true
    });
    
    // Clear mocks
    mockWindowOpen.mockClear();
    mockLocationHref.mockClear();
  });

  afterEach(() => {
    // Restore original implementations
    window.open = originalWindowOpen;
    window.location.href = originalLocationHref;
  });

  test('external links open in new tab with security attributes', async () => {
    const externalConfig: ProofModalConfig = {
      title: 'CertiK Security Audit',
      content: [
        'Comprehensive smart contract security audit conducted by CertiK',
        'Covers all critical security vulnerabilities and best practices'
      ],
      linkText: 'View Full Audit Report',
      linkUrl: 'https://certik.com/projects/alphawhale',
      lastUpdated: new Date('2024-11-15'),
      type: 'external'
    };

    const mockOnClose = vi.fn();

    render(
      <ProofModal
        isOpen={true}
        onClose={mockOnClose}
        config={externalConfig}
      />
    );

    // Find and click the external link button
    const linkButton = screen.getByRole('button', { name: /view full audit report/i });
    expect(linkButton).toBeInTheDocument();

    // Verify external link icon is present
    expect(screen.getByText('This link will open in a new tab')).toBeInTheDocument();

    // Click the button
    fireEvent.click(linkButton);

    // Verify window.open was called with correct parameters
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://certik.com/projects/alphawhale',
      '_blank',
      'noopener,noreferrer'
    );

    // Verify modal closes after clicking external link
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('internal links navigate within same tab', async () => {
    const internalConfig: ProofModalConfig = {
      title: 'Guardian Methodology',
      content: [
        'Multi-factor risk assessment combining on-chain and off-chain data',
        'Machine learning models trained on historical security incidents'
      ],
      linkText: 'View Detailed Methodology',
      linkUrl: '/proof/guardian-methodology',
      lastUpdated: new Date('2024-12-01'),
      type: 'page'
    };

    const mockOnClose = vi.fn();

    render(
      <ProofModal
        isOpen={true}
        onClose={mockOnClose}
        config={internalConfig}
      />
    );

    // Find and click the internal link button
    const linkButton = screen.getByRole('button', { name: /view detailed methodology/i });
    expect(linkButton).toBeInTheDocument();

    // Verify no "new tab" disclaimer for internal links
    expect(screen.queryByText('This link will open in a new tab')).not.toBeInTheDocument();

    // Click the button
    fireEvent.click(linkButton);

    // Verify window.open was NOT called for internal links
    expect(mockWindowOpen).not.toHaveBeenCalled();

    // Verify modal closes after clicking internal link
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('modal links have proper accessibility attributes', () => {
    const externalConfig: ProofModalConfig = {
      title: 'ConsenSys Audit',
      content: ['Security assessment by ConsenSys Diligence team'],
      linkText: 'View Audit Report',
      linkUrl: 'https://consensys.net/diligence/audits/alphawhale',
      type: 'external'
    };

    render(
      <ProofModal
        isOpen={true}
        onClose={vi.fn()}
        config={externalConfig}
      />
    );

    const linkButton = screen.getByRole('button', { name: /view audit report.*opens in new tab/i });
    expect(linkButton).toBeInTheDocument();
    
    // Verify aria-label includes new tab information
    expect(linkButton).toHaveAttribute('aria-label', expect.stringContaining('Opens in new tab'));
  });

  test('external link button shows external link icon', () => {
    const externalConfig: ProofModalConfig = {
      title: 'External Audit',
      content: ['External audit content'],
      linkText: 'View Report',
      linkUrl: 'https://example.com/audit',
      type: 'external'
    };

    render(
      <ProofModal
        isOpen={true}
        onClose={vi.fn()}
        config={externalConfig}
      />
    );

    // The external link icon should be present in the button
    const linkButton = screen.getByRole('button', { name: /view report/i });
    expect(linkButton).toBeInTheDocument();
    
    // Check for external link icon (this is rendered as an SVG)
    const externalIcon = linkButton.querySelector('svg');
    expect(externalIcon).toBeInTheDocument();
  });

  test('modal type determines link behavior', () => {
    const modalConfig: ProofModalConfig = {
      title: 'Modal Content',
      content: ['This stays in modal'],
      linkText: 'Stay in Modal',
      linkUrl: '#',
      type: 'modal'
    };

    const mockOnClose = vi.fn();

    render(
      <ProofModal
        isOpen={true}
        onClose={mockOnClose}
        config={modalConfig}
      />
    );

    // Use more specific selector to avoid ambiguity with close button
    const linkButton = screen.getByRole('button', { name: /stay in modal/i });
    fireEvent.click(linkButton);

    // Modal type should not open new window or navigate
    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('all external URLs in default trust signals open in new tabs', () => {
    // Test the actual configurations used in the app
    const externalUrls = [
      'https://certik.com/projects/alphawhale',
      'https://consensys.net/diligence/audits/alphawhale'
    ];

    externalUrls.forEach(url => {
      const config: ProofModalConfig = {
        title: 'Test External Link',
        content: ['Test content'],
        linkText: 'View Report',
        linkUrl: url,
        type: 'external'
      };

      const mockOnClose = vi.fn();

      const { unmount } = render(
        <ProofModal
          isOpen={true}
          onClose={mockOnClose}
          config={config}
        />
      );

      const linkButton = screen.getByRole('button', { name: /view report/i });
      fireEvent.click(linkButton);

      // Verify each external URL opens in new tab
      expect(mockWindowOpen).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
      
      // Clean up for next iteration
      mockWindowOpen.mockClear();
      unmount();
    });
  });
});

describe('ProofModal Security Attributes', () => {
  test('external link disclaimer is shown for security awareness', () => {
    const externalConfig: ProofModalConfig = {
      title: 'External Link Test',
      content: ['Content'],
      linkText: 'Go External',
      linkUrl: 'https://example.com',
      type: 'external'
    };

    render(
      <ProofModal
        isOpen={true}
        onClose={vi.fn()}
        config={externalConfig}
      />
    );

    // User should be informed that link opens in new tab
    expect(screen.getByText('This link will open in a new tab')).toBeInTheDocument();
  });
});