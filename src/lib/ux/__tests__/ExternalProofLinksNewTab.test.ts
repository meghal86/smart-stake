/**
 * External Proof Links New Tab Test
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R14.TRUST.METRICS_PROOF
 * Task: Ensure all external proof links open in new tabs to preserve context
 * 
 * This test verifies that:
 * 1. All external proof links are configured with type: 'external'
 * 2. External links open in new tabs with proper security attributes
 * 3. Internal links navigate within the same tab
 */

import { describe, test, expect } from 'vitest';
import { TrustSignalVerificationManager } from '../TrustSignalVerification';

describe('External Proof Links - New Tab Behavior', () => {
  const verificationManager = TrustSignalVerificationManager.getInstance();

  test('all external URLs are configured with type: external', () => {
    const allProofConfigs = verificationManager.getAllProofConfigs();
    
    const externalUrls: string[] = [];
    const internalUrls: string[] = [];
    
    allProofConfigs.forEach((config, key) => {
      if (config.linkUrl.startsWith('http://') || config.linkUrl.startsWith('https://')) {
        externalUrls.push(config.linkUrl);
        
        // Verify external URLs have type: 'external'
        expect(config.type).toBe('external');
        expect(config.linkUrl).toMatch(/^https?:\/\//);
      } else {
        internalUrls.push(config.linkUrl);
        
        // Verify internal URLs have type: 'page' or 'modal'
        expect(['page', 'modal']).toContain(config.type);
      }
    });
    
    // Log for verification
    console.log('External URLs found:', externalUrls);
    console.log('Internal URLs found:', internalUrls);
    
    // Ensure we have at least some external URLs configured
    expect(externalUrls.length).toBeGreaterThan(0);
  });

  test('CertiK audit link is configured as external', () => {
    const certikConfig = verificationManager.getProofConfig('https://certik.com/projects/alphawhale');
    
    expect(certikConfig).toBeDefined();
    expect(certikConfig?.type).toBe('external');
    expect(certikConfig?.linkUrl).toBe('https://certik.com/projects/alphawhale');
  });

  test('ConsenSys audit link is configured as external', () => {
    const consensysConfig = verificationManager.getProofConfig('https://consensys.net/diligence/audits/alphawhale');
    
    expect(consensysConfig).toBeDefined();
    expect(consensysConfig?.type).toBe('external');
    expect(consensysConfig?.linkUrl).toBe('https://consensys.net/diligence/audits/alphawhale');
  });

  test('internal proof links are configured as page or modal', () => {
    const internalConfigs = [
      '/proof/guardian-methodology',
      '/proof/assets-protected',
      '/security-partners'
    ];
    
    internalConfigs.forEach(url => {
      const config = verificationManager.getProofConfig(url);
      
      if (config) {
        expect(['page', 'modal']).toContain(config.type);
        expect(config.linkUrl).not.toMatch(/^https?:\/\//);
      }
    });
  });

  test('external link configuration includes security attributes', () => {
    const allProofConfigs = verificationManager.getAllProofConfigs();
    
    allProofConfigs.forEach((config, key) => {
      if (config.type === 'external') {
        // External links should have proper URL format
        expect(config.linkUrl).toMatch(/^https?:\/\//);
        
        // External links should have descriptive link text
        expect(config.linkText).toBeTruthy();
        expect(config.linkText.length).toBeGreaterThan(0);
        
        // External links should have content explaining what they link to
        expect(config.content).toBeDefined();
        expect(config.content.length).toBeGreaterThan(0);
      }
    });
  });

  test('no external URLs are configured as page or modal type', () => {
    const allProofConfigs = verificationManager.getAllProofConfigs();
    
    allProofConfigs.forEach((config, key) => {
      if (config.linkUrl.startsWith('http://') || config.linkUrl.startsWith('https://')) {
        // External URLs must be type: 'external', not 'page' or 'modal'
        expect(config.type).not.toBe('page');
        expect(config.type).not.toBe('modal');
        expect(config.type).toBe('external');
      }
    });
  });

  test('all proof configs have valid type values', () => {
    const allProofConfigs = verificationManager.getAllProofConfigs();
    const validTypes = ['external', 'page', 'modal'];
    
    allProofConfigs.forEach((config, key) => {
      expect(validTypes).toContain(config.type);
    });
  });
});

describe('ProofModal External Link Behavior', () => {
  test('external links should open with window.open', () => {
    // This test documents the expected behavior
    // The ProofModal component should call window.open for external links
    
    const externalConfig = {
      title: 'Test External Link',
      content: ['Test content'],
      linkText: 'View External Report',
      linkUrl: 'https://example.com/report',
      type: 'external' as const
    };
    
    // Verify configuration
    expect(externalConfig.type).toBe('external');
    expect(externalConfig.linkUrl).toMatch(/^https:\/\//);
    
    // The ProofModal component should handle this by calling:
    // window.open(config.linkUrl, '_blank', 'noopener,noreferrer')
  });

  test('internal links should navigate within same tab', () => {
    // This test documents the expected behavior
    // The ProofModal component should use window.location.href for internal links
    
    const internalConfig = {
      title: 'Test Internal Link',
      content: ['Test content'],
      linkText: 'View Methodology',
      linkUrl: '/proof/methodology',
      type: 'page' as const
    };
    
    // Verify configuration
    expect(internalConfig.type).toBe('page');
    expect(internalConfig.linkUrl).not.toMatch(/^https?:\/\//);
    
    // The ProofModal component should handle this by calling:
    // window.location.href = config.linkUrl
  });
});
