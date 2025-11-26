/**
 * Data Aggregation Tests for HarvestPro (Deno)
 * 
 * Tests Property 18: Data Aggregation Completeness
 * Validates: Requirements 1.5
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { 
  aggregateAllTransactions,
  getAggregatedDataSummary,
  verifyDataAggregationCompleteness,
  getTransactionsBySource,
  getUnifiedHoldingsSummary,
} from '../data-aggregation.ts';

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

function createMockSupabaseClient(mockData: {
  wallets?: string[];
  cexAccounts?: string[];
  walletTransactions?: any[];
  cexTrades?: any[];
}) {
  let selectColumns = '*';
  
  return {
    from: (table: string) => {
      const queries: any = {
        select: (cols?: string) => {
          if (cols) selectColumns = cols;
          return queries;
        },
        eq: () => queries,
        in: () => queries,
        order: () => queries,
        single: () => queries,
      };

      if (table === 'wallet_transactions') {
        queries.then = (resolve: any) => {
          // If selecting only wallet_address, return unique wallets
          if (selectColumns === 'wallet_address') {
            const walletData = mockData.wallets?.map(addr => ({ wallet_address: addr })) || [];
            resolve({
              data: walletData,
              error: null,
            });
          } else {
            // Otherwise return full transaction data
            resolve({
              data: mockData.walletTransactions || [],
              error: null,
            });
          }
          selectColumns = '*'; // Reset
        };
      } else if (table === 'cex_accounts') {
        queries.then = (resolve: any) => {
          resolve({
            data: mockData.cexAccounts?.map(id => ({ id })) || [],
            error: null,
          });
        };
      } else if (table === 'cex_trades') {
        queries.then = (resolve: any) => {
          resolve({
            data: mockData.cexTrades || [],
            error: null,
          });
        };
      }

      return queries;
    },
  } as any;
}

// ============================================================================
// UNIT TESTS
// ============================================================================

Deno.test('aggregateAllTransactions - combines wallet and CEX data', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCexTrades = [
    {
      id: 'c1',
      cex_account_id: 'cex1',
      user_id: 'user1',
      token: 'BTC',
      trade_type: 'buy',
      quantity: '0.5',
      price_usd: '40000',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: ['cex1'],
    walletTransactions: mockWalletTxs,
    cexTrades: mockCexTrades,
  });

  const result = await aggregateAllTransactions(supabase, 'user1');

  assertEquals(result.length, 2);
  assertEquals(result[0].source, 'wallet');
  assertEquals(result[0].token, 'ETH');
  assertEquals(result[1].source, 'cex');
  assertEquals(result[1].token, 'BTC');
});

Deno.test('aggregateAllTransactions - sorts by timestamp', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-03T00:00:00Z',
      created_at: '2024-01-03T00:00:00Z',
    },
  ];

  const mockCexTrades = [
    {
      id: 'c1',
      cex_account_id: 'cex1',
      user_id: 'user1',
      token: 'BTC',
      trade_type: 'buy',
      quantity: '0.5',
      price_usd: '40000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: ['cex1'],
    walletTransactions: mockWalletTxs,
    cexTrades: mockCexTrades,
  });

  const result = await aggregateAllTransactions(supabase, 'user1');

  // CEX trade should come first (earlier timestamp)
  assertEquals(result[0].source, 'cex');
  assertEquals(result[0].timestamp, '2024-01-01T00:00:00Z');
  assertEquals(result[1].source, 'wallet');
  assertEquals(result[1].timestamp, '2024-01-03T00:00:00Z');
});

Deno.test('aggregateAllTransactions - handles empty sources', async () => {
  const supabase = createMockSupabaseClient({
    wallets: [],
    cexAccounts: [],
    walletTransactions: [],
    cexTrades: [],
  });

  const result = await aggregateAllTransactions(supabase, 'user1');

  assertEquals(result.length, 0);
});

Deno.test('aggregateAllTransactions - filters by token', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: [],
    walletTransactions: mockWalletTxs,
    cexTrades: [],
  });

  const result = await aggregateAllTransactions(supabase, 'user1', 'ETH');

  assertEquals(result.length, 1);
  assertEquals(result[0].token, 'ETH');
});

Deno.test('getAggregatedDataSummary - returns correct counts', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'w2',
      user_id: 'user1',
      wallet_address: '0xdef',
      token: 'BTC',
      transaction_hash: '0x456',
      transaction_type: 'buy',
      quantity: '0.5',
      price_usd: '40000',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockCexTrades = [
    {
      id: 'c1',
      cex_account_id: 'cex1',
      user_id: 'user1',
      token: 'USDC',
      trade_type: 'buy',
      quantity: '1000',
      price_usd: '1',
      timestamp: '2024-01-03T00:00:00Z',
      created_at: '2024-01-03T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc', '0xdef'],
    cexAccounts: ['cex1'],
    walletTransactions: mockWalletTxs,
    cexTrades: mockCexTrades,
  });

  const summary = await getAggregatedDataSummary(supabase, 'user1');

  assertEquals(summary.totalSources, 3);
  assertEquals(summary.walletSources, 2);
  assertEquals(summary.cexSources, 1);
  assertEquals(summary.totalTransactions, 3);
  assertEquals(summary.walletTransactions, 2);
  assertEquals(summary.cexTransactions, 1);
  assertEquals(summary.uniqueTokens.length, 3);
});

Deno.test('verifyDataAggregationCompleteness - detects complete aggregation', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCexTrades = [
    {
      id: 'c1',
      cex_account_id: 'cex1',
      user_id: 'user1',
      token: 'BTC',
      trade_type: 'buy',
      quantity: '0.5',
      price_usd: '40000',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: ['cex1'],
    walletTransactions: mockWalletTxs,
    cexTrades: mockCexTrades,
  });

  const result = await verifyDataAggregationCompleteness(supabase, 'user1');

  assertEquals(result.complete, true);
  assertEquals(result.expectedSources, 2);
  assertEquals(result.actualSources, 2);
  assertEquals(result.missingSources.length, 0);
});

Deno.test('verifyDataAggregationCompleteness - detects missing sources', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc', '0xdef'], // Two wallets
    cexAccounts: [],
    walletTransactions: mockWalletTxs, // But only one has transactions
    cexTrades: [],
  });

  const result = await verifyDataAggregationCompleteness(supabase, 'user1');

  assertEquals(result.complete, false);
  assertEquals(result.expectedSources, 2);
  assertEquals(result.actualSources, 1);
  assertEquals(result.missingSources.length, 1);
  assertEquals(result.missingSources[0], '0xdef');
});

Deno.test('getTransactionsBySource - groups correctly', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'w2',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'BTC',
      transaction_hash: '0x456',
      transaction_type: 'buy',
      quantity: '0.5',
      price_usd: '40000',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: [],
    walletTransactions: mockWalletTxs,
    cexTrades: [],
  });

  const result = await getTransactionsBySource(supabase, 'user1');

  assertEquals(result.size, 1);
  const abcTxs = result.get('0xabc');
  assertExists(abcTxs);
  assertEquals(abcTxs.length, 2);
});

Deno.test('getUnifiedHoldingsSummary - calculates net positions', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '2.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'w2',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x456',
      transaction_type: 'sell',
      quantity: '0.5',
      price_usd: '2100',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: [],
    walletTransactions: mockWalletTxs,
    cexTrades: [],
  });

  const summary = await getUnifiedHoldingsSummary(supabase, 'user1');

  const ethSummary = summary.get('ETH');
  assertExists(ethSummary);
  assertEquals(ethSummary.totalBuys, 2.0);
  assertEquals(ethSummary.totalSells, 0.5);
  assertEquals(ethSummary.netPosition, 1.5);
  assertEquals(ethSummary.sources.size, 1);
  assertEquals(ethSummary.sources.has('0xabc'), true);
});

Deno.test('getUnifiedHoldingsSummary - tracks multiple sources per token', async () => {
  const mockWalletTxs = [
    {
      id: 'w1',
      user_id: 'user1',
      wallet_address: '0xabc',
      token: 'ETH',
      transaction_hash: '0x123',
      transaction_type: 'buy',
      quantity: '1.0',
      price_usd: '2000',
      timestamp: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCexTrades = [
    {
      id: 'c1',
      cex_account_id: 'cex1',
      user_id: 'user1',
      token: 'ETH',
      trade_type: 'buy',
      quantity: '0.5',
      price_usd: '2100',
      timestamp: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const supabase = createMockSupabaseClient({
    wallets: ['0xabc'],
    cexAccounts: ['cex1'],
    walletTransactions: mockWalletTxs,
    cexTrades: mockCexTrades,
  });

  const summary = await getUnifiedHoldingsSummary(supabase, 'user1');

  const ethSummary = summary.get('ETH');
  assertExists(ethSummary);
  assertEquals(ethSummary.totalBuys, 1.5);
  assertEquals(ethSummary.netPosition, 1.5);
  assertEquals(ethSummary.sources.size, 2);
  assertEquals(ethSummary.sources.has('0xabc'), true);
  assertEquals(ethSummary.sources.has('cex1'), true);
});

console.log('✅ All data aggregation tests passed!');
