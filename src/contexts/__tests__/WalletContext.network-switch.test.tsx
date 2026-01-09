/**
 * WalletContext Network Switch Tests
 * 
 * Tests that network switches trigger automatic refetch via query key changes
 * 
 * Feature: multi-chain-wallet-system
 * Task: 11 - React Query Integration
 * Property: Network switches trigger automatic refetch via key changes
 * Validates: Requirements 6.5, 15.6
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { guardianKeys, hunterKeys, harvestproKeys, portfolioKeys } from '@/lib/query-keys';

describe('WalletContext - Network Switch Query Key Changes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('network switch changes query keys for Guardian module', () => {
    // Initial network
    const initialKey = guardianKeys.scan(null, 'eip155:1');
    expect(initialKey).toEqual(['guardian', 'scan', null, 'eip155:1']);

    // After network switch to Polygon
    const newKey = guardianKeys.scan(null, 'eip155:137');
    expect(newKey).toEqual(['guardian', 'scan', null, 'eip155:137']);

    // Keys should be different
    expect(newKey).not.toEqual(initialKey);
  });

  test('network switch changes query keys for Hunter module', () => {
    // Initial network
    const initialKey = hunterKeys.feed(null, 'eip155:1');
    expect(initialKey).toEqual(['hunter', 'feed', null, 'eip155:1']);

    // After network switch to Arbitrum
    const newKey = hunterKeys.feed(null, 'eip155:42161');
    expect(newKey).toEqual(['hunter', 'feed', null, 'eip155:42161']);

    // Keys should be different
    expect(newKey).not.toEqual(initialKey);
  });

  test('network switch changes query keys for HarvestPro module', () => {
    // Initial network
    const initialKey = harvestproKeys.opportunities(null, 'eip155:1');
    expect(initialKey).toEqual(['harvestpro', 'opportunities', null, 'eip155:1']);

    // After network switch to Optimism
    const newKey = harvestproKeys.opportunities(null, 'eip155:10');
    expect(newKey).toEqual(['harvestpro', 'opportunities', null, 'eip155:10']);

    // Keys should be different
    expect(newKey).not.toEqual(initialKey);
  });

  test('network switch changes query keys for Portfolio module', () => {
    // Initial network
    const initialKey = portfolioKeys.balances(null, 'eip155:1');
    expect(initialKey).toEqual(['portfolio', 'balances', null, 'eip155:1']);

    // After network switch to Base
    const newKey = portfolioKeys.balances(null, 'eip155:8453');
    expect(newKey).toEqual(['portfolio', 'balances', null, 'eip155:8453']);

    // Keys should be different
    expect(newKey).not.toEqual(initialKey);
  });

  test('network switch with wallet address changes query keys', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';

    // Initial network with wallet
    const initialKey = guardianKeys.scan(walletAddress, 'eip155:1');
    expect(initialKey).toEqual(['guardian', 'scan', walletAddress, 'eip155:1']);

    // After network switch
    const newKey = guardianKeys.scan(walletAddress, 'eip155:137');
    expect(newKey).toEqual(['guardian', 'scan', walletAddress, 'eip155:137']);

    // Keys should be different
    expect(newKey).not.toEqual(initialKey);
  });

  test('multiple network switches produce different query keys', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';

    // Network 1: Ethereum
    const key1 = guardianKeys.scan(walletAddress, 'eip155:1');

    // Network 2: Polygon
    const key2 = guardianKeys.scan(walletAddress, 'eip155:137');

    // Network 3: Arbitrum
    const key3 = guardianKeys.scan(walletAddress, 'eip155:42161');

    // All keys should be different
    expect(key1).not.toEqual(key2);
    expect(key2).not.toEqual(key3);
    expect(key1).not.toEqual(key3);

    // Switching back to Ethereum should produce same key as initial
    const key1Again = guardianKeys.scan(walletAddress, 'eip155:1');
    expect(key1Again).toEqual(key1);
  });

  test('network-dependent query keys include network parameter', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    const networks = ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'];

    networks.forEach((network) => {
      // Guardian keys
      const guardianKey = guardianKeys.scan(walletAddress, network);
      expect(guardianKey).toContain(network);

      // Hunter keys
      const hunterKey = hunterKeys.feed(walletAddress, network);
      expect(hunterKey).toContain(network);

      // HarvestPro keys
      const harvestproKey = harvestproKeys.opportunities(walletAddress, network);
      expect(harvestproKey).toContain(network);

      // Portfolio keys
      const portfolioKey = portfolioKeys.balances(walletAddress, network);
      expect(portfolioKey).toContain(network);
    });
  });

  test('wallet-only query keys do not change with network switch', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';

    // Guardian summary (wallet-only, no network)
    const guardianSummaryKey = guardianKeys.summary(walletAddress);
    expect(guardianSummaryKey).toEqual(['guardian', 'summary', walletAddress]);
    expect(guardianSummaryKey).not.toContain('eip155:1');

    // Hunter alerts (wallet-only, no network)
    const hunterAlertsKey = hunterKeys.alerts(walletAddress);
    expect(hunterAlertsKey).toEqual(['hunter', 'alerts', walletAddress]);
    expect(hunterAlertsKey).not.toContain('eip155:1');

    // HarvestPro sessions (wallet-only, no network)
    const harvestproSessionsKey = harvestproKeys.sessions(walletAddress);
    expect(harvestproSessionsKey).toEqual(['harvestpro', 'sessions', walletAddress]);
    expect(harvestproSessionsKey).not.toContain('eip155:1');

    // Portfolio summary (wallet-only, no network)
    const portfolioSummaryKey = portfolioKeys.summary(walletAddress);
    expect(portfolioSummaryKey).toEqual(['portfolio', 'summary', walletAddress]);
    expect(portfolioSummaryKey).not.toContain('eip155:1');
  });

  test('query key consistency for same network and wallet', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    const network = 'eip155:137';

    // Same inputs should produce same keys
    const key1 = guardianKeys.scan(walletAddress, network);
    const key2 = guardianKeys.scan(walletAddress, network);

    expect(key1).toEqual(key2);
  });
});
