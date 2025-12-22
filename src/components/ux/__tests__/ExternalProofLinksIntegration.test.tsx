/**
 * External Proof Links Integration Test
 * 
 * Task: "Any external proof link opens in new tab (preserve context)"
 * Requirements: R10.TRUST.AUDIT_LINKS, R14.TRUST.METRICS_PROOF
 * 
 * This integration test verifies that the complete system correctly handles
 * external proof links by opening them in new tabs to preserve user context.
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrustBadgeWithFallback } from '../TrustBadgeWithFallback';
import { TrustBadge } from '../ProofModal';
import { TrustSignal, TrustSignalVerificationManager } from '@/lib/ux/TrustSignalVerification';
import { Shield } from 'lucide-react';

// Mock window.open
const mockWindowOpen = vi.fn();

describe('External Proof Links Integration - New Tab Behavior', () => {
  beforeEach(() => {
    // Mock window.open
    window.open = mockWindowOpen;
    mockWindowOpen.mockClear();
  });

  test('CertiK audit link opens in new tab', async () => {
    const certikSignal: TrustSignal = {
      id: 'certik-audit-test',
      type: 'audit',
      label: 'CertiK Audit',
      description: 'Security audit by CertiK',
      proofUrl: 'https://certik.com/projects/alphawhale',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        auditFirm: 'CertiK'
      }
    };

    render(
      <TrustBadgeWithFallback
        trustSignal={certikSignal}
        icon={Shield}
      />
    );

    // Click the trust badge to open proof modal
    const trustBadge = screen.getByRole('button', { name: /certik audit/i });
    fireEvent.click(trustBadge);

    // Wait for modal to appear and find the proof link
    const proofLink = await screen.findByRole('button', { name: /view full audit report/i });
    expect(proofLink).toBeInTheDocument();

    // Click the proof link
    fireEvent.click(proofLink);

    // Verify external link opens in new tab with security attributes
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://certik.com/projects/alphawhale',
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('ConsenSys audit link opens in new tab', async () => {
    const consensysSignal: TrustSignal = {
      id: 'consensys-audit-test',
      type: 'audit',
      label: 'ConsenSys Audit',
      description: 'Security assessment by ConsenSys Diligence',
      proofUrl: 'https://consensys.net/diligence/audits/alphawhale',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        auditFirm: 'ConsenSys Diligence'
      }
    };

    render(
      <TrustBadgeWithFallback
        trustSignal={consensysSignal}
        icon={Shield}
      />
    );

    // Click the trust badge to open proof modal
    const trustBadge = screen.getByRole('button', { name: /consensys audit/i });
    fireEvent.click(trustBadge);

    // Wait for modal to appear and find the proof link
    const proofLink = await screen.findByRole('button', { name: /view audit report/i });
    expect(proofLink).toBeInTheDocument();

    // Click the proof link
    fireEvent.click(proofLink);

    // Verify external link opens in new tab with security attributes
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://consensys.net/diligence/audits/alphawhale',
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('internal proof links do not open in new tab', async () => {
    const internalSignal: TrustSignal = {
      id: 'internal-methodology-test',
      type: 'methodology',
      label: 'Guardian Methodology',
      description: 'How Guardian risk scores are calculated',
      proofUrl: '/proof/guardian-methodology',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        methodology: 'Multi-factor risk assessment'
      }
    };

    render(
      <TrustBadgeWithFallback
        trustSignal={internalSignal}
        icon={Shield}
      />
    );

    // Click the trust badge to open proof modal
    const trustBadge = screen.getByRole('button', { name: /guardian methodology/i });
    fireEvent.click(trustBadge);

    // Wait for modal to appear and find the proof link
    const proofLink = await screen.findByRole('button', { name: /view detailed methodology/i });
    expect(proofLink).toBeInTheDocument();

    // Click the proof link
    fireEvent.click(proofLink);

    // Verify window.open was NOT called for internal links
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  test('external links show new tab disclaimer', async () => {
    const verificationManager = TrustSignalVerificationManager.getInstance();
    const certikConfig = verificationManager.getProofConfig('https://certik.com/projects/alphawhale');
    
    expect(certikConfig).toBeDefined();
    expect(certikConfig?.type).toBe('external');

    render(
      <TrustBadge
        label="CertiK Audit"
        description="Security audit by CertiK"
        proofConfig={certikConfig!}
        icon={Shield}
        verified={true}
      />
    );

    // Click the trust badge to open proof modal
    const trustBadge = screen.getByRole('button', { name: /certik audit/i });
    fireEvent.click(trustBadge);

    // Verify new tab disclaimer is shown
    expect(await screen.findByText('This link will open in a new tab')).toBeInTheDocument();
  });

  test('all configured external URLs are type external', () => {
    const verificationManager = TrustSignalVerificationManager.getInstance();
    const allConfigs = verificationManager.getAllProofConfigs();
    
    const externalUrls = [
      'https://certik.com/projects/alphawhale',
      'https://consensys.net/diligence/audits/alphawhale'
    ];

    externalUrls.forEach(url => {
      const config = verificationManager.getProofConfig(url);
      expect(config).toBeDefined();
      expect(config?.type).toBe('external');
      expect(config?.linkUrl).toBe(url);
    });
  });

  test('task requirement: external proof links preserve context', () => {
    // This test documents the task requirement:
    // "Any external proof link opens in new tab (preserve context)"
    
    const verificationManager = TrustSignalVerificationManager.getInstance();
    const allConfigs = verificationManager.getAllProofConfigs();
    
    let externalLinksFound = 0;
    
    allConfigs.forEach((config, key) => {
      if (config.linkUrl.startsWith('http://') || config.linkUrl.startsWith('https://')) {
        externalLinksFound++;
        
        // External links must be configured to open in new tab
        expect(config.type).toBe('external');
        
        // This ensures the ProofModal will call:
        // window.open(config.linkUrl, '_blank', 'noopener,noreferrer')
        // which preserves the user's context in the original tab
      }
    });
    
    // Ensure we found external links to test
    expect(externalLinksFound).toBeGreaterThan(0);
    
    console.log(`✅ Task verified: ${externalLinksFound} external proof links configured to open in new tabs`);
  });
});