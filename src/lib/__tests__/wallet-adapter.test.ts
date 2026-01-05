/**
 * Unit Tests for Wallet Shape Adapter
 * Tests grouping logic, edge cases, and data merging
 */

import { describe, test, expect } from 'vitest';
import {
  adaptWalletRows,
  hasWalletNetwork,
  getWalletByAddress,
  getPrimaryWallet,
  getMissingNetworks,
  isWalletNetworkMissing,
} from '../wallet-adapter';
import { UserWallet, ConnectedWallet } from '@/types/wallet-registry';

describe('adaptWalletRows', () => {
  test('groups rows by address (case-insensitive)', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc', // lowercase version of same address
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result).toHaveLength(1);
    expect(result[0].address).toBe('0xABC'); // Preserves original casing
    expect(result[0].networks).toContain('eip155:1');
    expect(result[0].networks).toContain('eip155:137');
  });

  test('preserves original address casing from server', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].address).toBe('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
  });

  test('prevents duplicate addresses in final array', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: '3',
        user_id: 'user1',
        address: '0xDEF',
        chain_namespace: 'eip155:1',
        is_primary: false,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result).toHaveLength(2);
    const addresses = result.map((w) => w.address.toLowerCase());
    expect(new Set(addresses).size).toBe(2); // No duplicates
  });

  test('merges guardian scores by network', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        guardian_scores: { 'eip155:1': 85 },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        guardian_scores: { 'eip155:137': 92 },
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].guardian_scores).toEqual({
      'eip155:1': 85,
      'eip155:137': 92,
    });
  });

  test('merges balance cache by network', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        balance_cache: { 'eip155:1': { eth: 10.5 } },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        balance_cache: { 'eip155:137': { matic: 100 } },
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].balance_cache).toEqual({
      'eip155:1': { eth: 10.5 },
      'eip155:137': { matic: 100 },
    });
  });

  test('handles missing guardian scores gracefully', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].guardian_scores).toBeUndefined();
  });

  test('handles missing balance cache gracefully', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].balance_cache).toBeUndefined();
  });

  test('sets is_primary to true if any row is primary', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: true, // One row is primary
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].is_primary).toBe(true);
  });

  test('sets is_primary to false if no rows are primary', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].is_primary).toBe(false);
  });

  test('uses earliest created_at timestamp', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z', // Earliest
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].created_at).toBe('2025-01-01T00:00:00Z');
  });

  test('uses latest updated_at timestamp', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z', // Latest
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result[0].updated_at).toBe('2025-01-05T00:00:00Z');
  });

  test('handles empty array', () => {
    const result = adaptWalletRows([]);

    expect(result).toEqual([]);
  });

  test('handles null/undefined gracefully', () => {
    const result = adaptWalletRows(null as any);

    expect(result).toEqual([]);
  });

  test('handles multiple wallets with different networks', () => {
    const rows: UserWallet[] = [
      {
        id: '1',
        user_id: 'user1',
        address: '0xABC',
        chain_namespace: 'eip155:1',
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:137',
        is_primary: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: '3',
        user_id: 'user1',
        address: '0xabc',
        chain_namespace: 'eip155:42161',
        is_primary: false,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      },
      {
        id: '4',
        user_id: 'user1',
        address: '0xDEF',
        chain_namespace: 'eip155:1',
        is_primary: false,
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      },
    ];

    const result = adaptWalletRows(rows);

    expect(result).toHaveLength(2);
    expect(result[0].networks).toHaveLength(3);
    expect(result[1].networks).toHaveLength(1);
  });
});

describe('hasWalletNetwork', () => {
  test('returns true if wallet-network combination exists', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1', 'eip155:137'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(hasWalletNetwork(wallets, '0xABC', 'eip155:1')).toBe(true);
    expect(hasWalletNetwork(wallets, '0xabc', 'eip155:137')).toBe(true);
  });

  test('returns false if wallet-network combination does not exist', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(hasWalletNetwork(wallets, '0xABC', 'eip155:137')).toBe(false);
  });

  test('returns false if wallet does not exist', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(hasWalletNetwork(wallets, '0xDEF', 'eip155:1')).toBe(false);
  });

  test('is case-insensitive for address', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xAbCdEf',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(hasWalletNetwork(wallets, '0xabcdef', 'eip155:1')).toBe(true);
    expect(hasWalletNetwork(wallets, '0xABCDEF', 'eip155:1')).toBe(true);
  });
});

describe('getWalletByAddress', () => {
  test('returns wallet if found', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = getWalletByAddress(wallets, '0xABC');

    expect(result).toBeDefined();
    expect(result?.address).toBe('0xABC');
  });

  test('returns undefined if wallet not found', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = getWalletByAddress(wallets, '0xDEF');

    expect(result).toBeUndefined();
  });

  test('is case-insensitive', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xAbCdEf',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(getWalletByAddress(wallets, '0xabcdef')).toBeDefined();
    expect(getWalletByAddress(wallets, '0xABCDEF')).toBeDefined();
  });
});

describe('getPrimaryWallet', () => {
  test('returns primary wallet if found', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        address: '0xDEF',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = getPrimaryWallet(wallets);

    expect(result).toBeDefined();
    expect(result?.address).toBe('0xDEF');
  });

  test('returns undefined if no primary wallet found', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    const result = getPrimaryWallet(wallets);

    expect(result).toBeUndefined();
  });

  test('returns first primary wallet if multiple exist', () => {
    const wallets: ConnectedWallet[] = [
      {
        address: '0xABC',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        address: '0xDEF',
        networks: ['eip155:1'],
        is_primary: true,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    const result = getPrimaryWallet(wallets);

    expect(result?.address).toBe('0xABC');
  });
});

describe('getMissingNetworks', () => {
  test('returns networks wallet is not registered on', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1', 'eip155:137'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const allNetworks = ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10'];

    const result = getMissingNetworks(wallet, allNetworks);

    expect(result).toEqual(['eip155:42161', 'eip155:10']);
  });

  test('returns empty array if wallet is on all networks', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1', 'eip155:137', 'eip155:42161'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const allNetworks = ['eip155:1', 'eip155:137', 'eip155:42161'];

    const result = getMissingNetworks(wallet, allNetworks);

    expect(result).toEqual([]);
  });

  test('returns all networks if wallet is on none', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: [],
      is_primary: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const allNetworks = ['eip155:1', 'eip155:137', 'eip155:42161'];

    const result = getMissingNetworks(wallet, allNetworks);

    expect(result).toEqual(['eip155:1', 'eip155:137', 'eip155:42161']);
  });

  test('handles empty supported networks list', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const result = getMissingNetworks(wallet, []);

    expect(result).toEqual([]);
  });
});

describe('isWalletNetworkMissing', () => {
  test('returns true if wallet-network combination is missing', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1', 'eip155:137'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    expect(isWalletNetworkMissing(wallet, 'eip155:42161')).toBe(true);
  });

  test('returns false if wallet-network combination exists', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1', 'eip155:137'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    expect(isWalletNetworkMissing(wallet, 'eip155:1')).toBe(false);
  });

  test('returns true for empty networks array', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: [],
      is_primary: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    expect(isWalletNetworkMissing(wallet, 'eip155:1')).toBe(true);
  });

  test('is case-sensitive for network namespace', () => {
    const wallet: ConnectedWallet = {
      address: '0xABC',
      networks: ['eip155:1'],
      is_primary: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    // Exact match should return false
    expect(isWalletNetworkMissing(wallet, 'eip155:1')).toBe(false);

    // Different case should return true (case-sensitive)
    expect(isWalletNetworkMissing(wallet, 'EIP155:1')).toBe(true);
  });
});
