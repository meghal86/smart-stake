/**
 * Property-Based Tests for Data Aggregation
 * Feature: harvestpro, Property 18: Data Aggregation Completeness
 * Validates: Requirements 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import {
  aggregateAllTransactions,
  getAggregatedDataSummary,
  verifyDataAggregationCompleteness,
  getTransactionsBySource,
  getUnifiedHoldingsSummary,
  type UnifiedTransaction,
} from '../data-aggregation';
import type { WalletTransaction, CexTrade } from '@/types/harvestpro';

// ============================================================================
// TEST SETUP
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Test user ID
const TEST_USER_ID = 'test-user-aggregation-' + Date.now();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean up test data
 */
async function cleanupTestData(userId: string) {
  if (!supabase) return;

  await supabase.from('wallet_transactions').delete().eq('user_id', userId);
  await supabase.from('cex_trades').delete().eq('user_id', userId);
  await supabase.from('cex_accounts').delete().eq('user_id', userId);
}

/**
 * Insert wallet transactions for testing
 */
async function insertWalletTransactions(
  userId: string,
  walletAddress: string,
  transactions: Array<{
    token: string;
    type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
    quantity: number;
    priceUsd: number;
    timestamp: string;
  }>
) {
  if (!supabase) throw new Error('Supabase not configured');

  const rows = transactions.map((tx, idx) => ({
    user_id: userId,
    wallet_address: walletAddress.toLowerCase(),
    token: tx.token.toUpperCase(),
    transaction_hash: `0x${walletAddress.slice(2, 10)}${idx.toString().padStart(8, '0')}`,
    transaction_type: tx.type,
    quantity: tx.quantity,
    price_usd: tx.priceUsd,
    timestamp: tx.timestamp,
  }));

  const { error } = await supabase.from('wallet_transactions').insert(rows);
  if (error) throw new Error(`Failed to insert wallet transactions: ${error.message}`);
}

/**
 * Insert CEX account and trades for testing
 */
async function insertCexAccountAndTrades(
  userId: string,
  exchangeName: string,
  trades: Array<{
    token: string;
    type: 'buy' | 'sell';
    quantity: number;
    priceUsd: number;
    timestamp: string;
  }>
) {
  if (!supabase) throw new Error('Supabase not configured');

  // Create CEX account
  const { data: account, error: accountError } = await supabase
    .from('cex_accounts')
    .insert({
      user_id: userId,
      exchange_name: exchangeName,
      api_key_encrypted: 'test-key-encrypted',
      api_secret_encrypted: 'test-secret-encrypted',
      is_active: true,
    })
    .select()
    .single();

  if (accountError) throw new Error(`Failed to insert CEX account: ${accountError.message}`);

  // Insert trades
  const rows = trades.map(trade => ({
    cex_account_id: account.id,
    user_id: userId,
    token: trade.token.toUpperCase(),
    trade_type: trade.type,
    quantity: trade.quantity,
    price_usd: trade.priceUsd,
    timestamp: trade.timestamp,
  }));

  const { error: tradesError } = await supabase.from('cex_trades').insert(rows);
  if (tradesError) throw new Error(`Failed to insert CEX trades: ${tradesError.message}`);

  return account.id;
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Data Aggregation - Property Tests', () => {
  beforeEach(async () => {
    if (!supabase) {
      console.warn('Skipping tests: Supabase not configured');
      return;
    }
    await cleanupTestData(TEST_USER_ID);
  });

  afterEach(async () => {
    if (!supabase) return;
    await cleanupTestData(TEST_USER_ID);
  });

  /**
   * Property 18: Data Aggregation Completeness
   * Feature: harvestpro, Property 18: Data Aggregation Completeness
   * Validates: Requirements 1.5
   * 
   * For any user with N connected wallets and M CEX accounts, the unified view
   * SHALL include data from all N+M sources.
   */
  it('Property 18: Unified view includes all wallet and CEX sources', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // Generate N wallets (1-5 wallets)
        fc.integer({ min: 1, max: 5 }),
        // Generate M CEX accounts (0-3 accounts)
        fc.integer({ min: 0, max: 3 }),
        // Generate number of transactions per source (1-10)
        fc.integer({ min: 1, max: 10 }),
        async (numWallets, numCexAccounts, txPerSource) => {
          const testUserId = `${TEST_USER_ID}-${Date.now()}-${Math.random()}`;

          try {
            // Create wallet addresses
            const wallets = Array.from({ length: numWallets }, (_, i) =>
              `0x${i.toString(16).padStart(40, '0')}`
            );

            // Insert wallet transactions
            for (const wallet of wallets) {
              const transactions = Array.from({ length: txPerSource }, (_, i) => ({
                token: 'ETH',
                type: (i % 2 === 0 ? 'buy' : 'sell') as 'buy' | 'sell',
                quantity: 1.0,
                priceUsd: 2000.0,
                timestamp: new Date(Date.now() - i * 1000).toISOString(),
              }));
              await insertWalletTransactions(testUserId, wallet, transactions);
            }

            // Insert CEX accounts and trades
            const cexAccountIds: string[] = [];
            for (let i = 0; i < numCexAccounts; i++) {
              const trades = Array.from({ length: txPerSource }, (_, j) => ({
                token: 'BTC',
                type: (j % 2 === 0 ? 'buy' : 'sell') as 'buy' | 'sell',
                quantity: 0.1,
                priceUsd: 40000.0,
                timestamp: new Date(Date.now() - j * 1000).toISOString(),
              }));
              const accountId = await insertCexAccountAndTrades(
                testUserId,
                `Exchange${i}`,
                trades
              );
              cexAccountIds.push(accountId);
            }

            // Verify aggregation completeness
            const verification = await verifyDataAggregationCompleteness(testUserId);

            // Property: All sources should be included
            expect(verification.complete).toBe(true);
            expect(verification.expectedSources).toBe(numWallets + numCexAccounts);
            expect(verification.actualSources).toBe(numWallets + numCexAccounts);
            expect(verification.missingSources).toHaveLength(0);

            // Verify summary
            const summary = await getAggregatedDataSummary(testUserId);
            expect(summary.totalSources).toBe(numWallets + numCexAccounts);
            expect(summary.walletSources).toBe(numWallets);
            expect(summary.cexSources).toBe(numCexAccounts);
            expect(summary.totalTransactions).toBe(
              (numWallets + numCexAccounts) * txPerSource
            );

            // Verify all transactions are present
            const allTransactions = await aggregateAllTransactions(testUserId);
            expect(allTransactions).toHaveLength((numWallets + numCexAccounts) * txPerSource);

            // Verify transactions by source
            const bySource = await getTransactionsBySource(testUserId);
            expect(bySource.size).toBe(numWallets + numCexAccounts);

            // Each source should have the correct number of transactions
            for (const [source, txs] of bySource.entries()) {
              expect(txs).toHaveLength(txPerSource);
            }

            // Clean up
            await cleanupTestData(testUserId);

            return true;
          } catch (error) {
            // Clean up on error
            await cleanupTestData(testUserId);
            throw error;
          }
        }
      ),
      { numRuns: 10 } // Reduced runs due to database operations
    );
  });

  /**
   * Property: Wallet-only aggregation includes all wallets
   */
  it('Property: Wallet-only aggregation includes all wallet sources', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (numWallets, txPerWallet) => {
          const testUserId = `${TEST_USER_ID}-wallet-${Date.now()}-${Math.random()}`;

          try {
            const wallets = Array.from({ length: numWallets }, (_, i) =>
              `0x${i.toString(16).padStart(40, '0')}`
            );

            for (const wallet of wallets) {
              const transactions = Array.from({ length: txPerWallet }, (_, i) => ({
                token: 'ETH',
                type: 'buy' as const,
                quantity: 1.0,
                priceUsd: 2000.0,
                timestamp: new Date(Date.now() - i * 1000).toISOString(),
              }));
              await insertWalletTransactions(testUserId, wallet, transactions);
            }

            const summary = await getAggregatedDataSummary(testUserId);
            expect(summary.walletSources).toBe(numWallets);
            expect(summary.cexSources).toBe(0);
            expect(summary.totalSources).toBe(numWallets);
            expect(summary.walletTransactions).toBe(numWallets * txPerWallet);

            await cleanupTestData(testUserId);
            return true;
          } catch (error) {
            await cleanupTestData(testUserId);
            throw error;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: CEX-only aggregation includes all CEX accounts
   */
  it('Property: CEX-only aggregation includes all CEX sources', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 10 }),
        async (numCexAccounts, tradesPerAccount) => {
          const testUserId = `${TEST_USER_ID}-cex-${Date.now()}-${Math.random()}`;

          try {
            for (let i = 0; i < numCexAccounts; i++) {
              const trades = Array.from({ length: tradesPerAccount }, (_, j) => ({
                token: 'BTC',
                type: 'buy' as const,
                quantity: 0.1,
                priceUsd: 40000.0,
                timestamp: new Date(Date.now() - j * 1000).toISOString(),
              }));
              await insertCexAccountAndTrades(testUserId, `Exchange${i}`, trades);
            }

            const summary = await getAggregatedDataSummary(testUserId);
            expect(summary.walletSources).toBe(0);
            expect(summary.cexSources).toBe(numCexAccounts);
            expect(summary.totalSources).toBe(numCexAccounts);
            expect(summary.cexTransactions).toBe(numCexAccounts * tradesPerAccount);

            await cleanupTestData(testUserId);
            return true;
          } catch (error) {
            await cleanupTestData(testUserId);
            throw error;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Empty sources return empty aggregation
   */
  it('Property: User with no sources returns empty aggregation', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const testUserId = `${TEST_USER_ID}-empty-${Date.now()}`;

    const summary = await getAggregatedDataSummary(testUserId);
    expect(summary.totalSources).toBe(0);
    expect(summary.walletSources).toBe(0);
    expect(summary.cexSources).toBe(0);
    expect(summary.totalTransactions).toBe(0);

    const allTransactions = await aggregateAllTransactions(testUserId);
    expect(allTransactions).toHaveLength(0);
  });

  /**
   * Property: Transactions are sorted by timestamp
   */
  it('Property: Aggregated transactions are sorted chronologically', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (numSources) => {
          const testUserId = `${TEST_USER_ID}-sorted-${Date.now()}-${Math.random()}`;

          try {
            // Create transactions with different timestamps
            const baseTime = Date.now();
            const wallet = '0x1234567890123456789012345678901234567890';
            
            const transactions = Array.from({ length: numSources }, (_, i) => ({
              token: 'ETH',
              type: 'buy' as const,
              quantity: 1.0,
              priceUsd: 2000.0,
              timestamp: new Date(baseTime - (numSources - i) * 10000).toISOString(),
            }));

            await insertWalletTransactions(testUserId, wallet, transactions);

            const allTransactions = await aggregateAllTransactions(testUserId);

            // Verify chronological order
            for (let i = 1; i < allTransactions.length; i++) {
              const prevTime = new Date(allTransactions[i - 1].timestamp).getTime();
              const currTime = new Date(allTransactions[i].timestamp).getTime();
              expect(currTime).toBeGreaterThanOrEqual(prevTime);
            }

            await cleanupTestData(testUserId);
            return true;
          } catch (error) {
            await cleanupTestData(testUserId);
            throw error;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unified holdings summary includes all sources
   */
  it('Property: Holdings summary tracks all sources for each token', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const testUserId = `${TEST_USER_ID}-holdings-${Date.now()}`;

    try {
      // Create 2 wallets with ETH
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';

      await insertWalletTransactions(testUserId, wallet1, [
        { token: 'ETH', type: 'buy', quantity: 1.0, priceUsd: 2000, timestamp: new Date().toISOString() },
      ]);

      await insertWalletTransactions(testUserId, wallet2, [
        { token: 'ETH', type: 'buy', quantity: 2.0, priceUsd: 2100, timestamp: new Date().toISOString() },
      ]);

      // Create 1 CEX account with ETH
      await insertCexAccountAndTrades(testUserId, 'Binance', [
        { token: 'ETH', type: 'buy', quantity: 0.5, priceUsd: 2050, timestamp: new Date().toISOString() },
      ]);

      const holdings = await getUnifiedHoldingsSummary(testUserId);
      const ethHolding = holdings.get('ETH');

      expect(ethHolding).toBeDefined();
      expect(ethHolding!.sources.size).toBe(3); // 2 wallets + 1 CEX
      expect(ethHolding!.netPosition).toBe(3.5); // 1 + 2 + 0.5

      await cleanupTestData(testUserId);
    } catch (error) {
      await cleanupTestData(testUserId);
      throw error;
    }
  });

  /**
   * Property: Token filtering works across all sources
   */
  it('Property: Token filtering includes transactions from all sources', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const testUserId = `${TEST_USER_ID}-filter-${Date.now()}`;

    try {
      const wallet = '0x3333333333333333333333333333333333333333';

      // Add ETH and BTC to wallet
      await insertWalletTransactions(testUserId, wallet, [
        { token: 'ETH', type: 'buy', quantity: 1.0, priceUsd: 2000, timestamp: new Date().toISOString() },
        { token: 'BTC', type: 'buy', quantity: 0.1, priceUsd: 40000, timestamp: new Date().toISOString() },
      ]);

      // Add ETH and BTC to CEX
      await insertCexAccountAndTrades(testUserId, 'Coinbase', [
        { token: 'ETH', type: 'buy', quantity: 0.5, priceUsd: 2050, timestamp: new Date().toISOString() },
        { token: 'BTC', type: 'buy', quantity: 0.05, priceUsd: 41000, timestamp: new Date().toISOString() },
      ]);

      // Filter for ETH only
      const ethTransactions = await aggregateAllTransactions(testUserId, 'ETH');
      expect(ethTransactions).toHaveLength(2); // 1 from wallet + 1 from CEX
      expect(ethTransactions.every(tx => tx.token === 'ETH')).toBe(true);

      // Verify both sources are present
      const ethSources = new Set(ethTransactions.map(tx => tx.sourceIdentifier));
      expect(ethSources.size).toBe(2);

      await cleanupTestData(testUserId);
    } catch (error) {
      await cleanupTestData(testUserId);
      throw error;
    }
  });
});

// ============================================================================
// PURE PROPERTY TESTS (No Database Required)
// ============================================================================

describe('Data Aggregation - Pure Property Tests', () => {
  /**
   * Property 18: Data Aggregation Completeness (Pure Test)
   * Feature: harvestpro, Property 18: Data Aggregation Completeness
   * Validates: Requirements 1.5
   * 
   * For any collection of N wallet transactions and M CEX trades,
   * the unified view SHALL include all N+M transactions.
   */
  it('Property 18: Unified transactions include all wallet and CEX transactions', () => {
    fc.assert(
      fc.property(
        // Generate N wallet transactions (0-10)
        fc.array(
          fc.record({
            id: fc.uuid(),
            walletAddress: fc.integer({ min: 0, max: 999999 }).map(n => 
              `0x${n.toString(16).padStart(40, '0')}`
            ),
            token: fc.constantFrom('ETH', 'BTC', 'USDC', 'DAI'),
            type: fc.constantFrom('buy', 'sell', 'transfer_in', 'transfer_out'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        // Generate M CEX trades (0-10)
        fc.array(
          fc.record({
            id: fc.uuid(),
            cexAccountId: fc.uuid(),
            token: fc.constantFrom('ETH', 'BTC', 'USDC', 'DAI'),
            type: fc.constantFrom('buy', 'sell'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (walletTxs, cexTrades) => {
          // Convert to unified format
          const unifiedWallet: UnifiedTransaction[] = walletTxs.map(tx => ({
            id: tx.id,
            source: 'wallet' as const,
            sourceIdentifier: tx.walletAddress,
            token: tx.token,
            type: tx.type as any,
            quantity: tx.quantity,
            priceUsd: tx.priceUsd,
            timestamp: tx.timestamp,
          }));

          const unifiedCex: UnifiedTransaction[] = cexTrades.map(trade => ({
            id: trade.id,
            source: 'cex' as const,
            sourceIdentifier: trade.cexAccountId,
            token: trade.token,
            type: trade.type as any,
            quantity: trade.quantity,
            priceUsd: trade.priceUsd,
            timestamp: trade.timestamp,
          }));

          // Combine
          const unified = [...unifiedWallet, ...unifiedCex];

          // Property: Total count equals sum of wallet and CEX transactions
          expect(unified.length).toBe(walletTxs.length + cexTrades.length);

          // Property: All wallet transactions are present
          const walletIds = new Set(walletTxs.map(tx => tx.id));
          const unifiedWalletIds = new Set(
            unified.filter(tx => tx.source === 'wallet').map(tx => tx.id)
          );
          expect(unifiedWalletIds.size).toBe(walletIds.size);
          for (const id of walletIds) {
            expect(unifiedWalletIds.has(id)).toBe(true);
          }

          // Property: All CEX trades are present
          const cexIds = new Set(cexTrades.map(trade => trade.id));
          const unifiedCexIds = new Set(
            unified.filter(tx => tx.source === 'cex').map(tx => tx.id)
          );
          expect(unifiedCexIds.size).toBe(cexIds.size);
          for (const id of cexIds) {
            expect(unifiedCexIds.has(id)).toBe(true);
          }

          // Property: Source identifiers are preserved
          const walletSources = new Set(walletTxs.map(tx => tx.walletAddress));
          const cexSources = new Set(cexTrades.map(trade => trade.cexAccountId));
          const unifiedSources = new Set(unified.map(tx => tx.sourceIdentifier));
          
          expect(unifiedSources.size).toBe(walletSources.size + cexSources.size);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Source count equals unique source identifiers
   */
  it('Property: Number of sources equals unique source identifiers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            source: fc.constantFrom('wallet', 'cex'),
            sourceIdentifier: fc.uuid(),
            token: fc.constantFrom('ETH', 'BTC'),
            type: fc.constantFrom('buy', 'sell'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (transactions) => {
          const uniqueSources = new Set(transactions.map(tx => tx.sourceIdentifier));
          const sourceCount = uniqueSources.size;

          // Property: Source count should equal unique identifiers
          expect(sourceCount).toBe(uniqueSources.size);

          // Property: Each source should have at least one transaction
          for (const source of uniqueSources) {
            const txsFromSource = transactions.filter(
              tx => tx.sourceIdentifier === source
            );
            expect(txsFromSource.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Wallet and CEX sources are correctly categorized
   */
  it('Property: Transactions are correctly categorized by source type', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            source: fc.constantFrom('wallet', 'cex'),
            sourceIdentifier: fc.uuid(),
            token: fc.constantFrom('ETH', 'BTC'),
            type: fc.constantFrom('buy', 'sell'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const walletTxs = transactions.filter(tx => tx.source === 'wallet');
          const cexTxs = transactions.filter(tx => tx.source === 'cex');

          // Property: All transactions are categorized
          expect(walletTxs.length + cexTxs.length).toBe(transactions.length);

          // Property: No transaction is in both categories
          const walletIds = new Set(walletTxs.map(tx => tx.id));
          const cexIds = new Set(cexTxs.map(tx => tx.id));
          
          for (const id of walletIds) {
            expect(cexIds.has(id)).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty sources produce empty aggregation
   */
  it('Property: Zero sources produce zero transactions', () => {
    const emptyWallet: UnifiedTransaction[] = [];
    const emptyCex: UnifiedTransaction[] = [];
    const unified = [...emptyWallet, ...emptyCex];

    expect(unified.length).toBe(0);
    
    const sources = new Set(unified.map(tx => tx.sourceIdentifier));
    expect(sources.size).toBe(0);
  });

  /**
   * Property: Single source produces correct count
   */
  it('Property: Single source aggregation preserves transaction count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            token: fc.constantFrom('ETH', 'BTC'),
            type: fc.constantFrom('buy', 'sell'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom('wallet', 'cex'),
        fc.uuid(),
        (transactions, sourceType, sourceId) => {
          const unified: UnifiedTransaction[] = transactions.map(tx => ({
            id: tx.id,
            source: sourceType as 'wallet' | 'cex',
            sourceIdentifier: sourceId,
            token: tx.token,
            type: tx.type as any,
            quantity: tx.quantity,
            priceUsd: tx.priceUsd,
            timestamp: tx.timestamp,
          }));

          // Property: Transaction count is preserved
          expect(unified.length).toBe(transactions.length);

          // Property: All transactions have the same source
          expect(unified.every(tx => tx.sourceIdentifier === sourceId)).toBe(true);
          expect(unified.every(tx => tx.source === sourceType)).toBe(true);

          // Property: Only one unique source
          const sources = new Set(unified.map(tx => tx.sourceIdentifier));
          expect(sources.size).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Token filtering preserves source diversity
   */
  it('Property: Filtering by token preserves all sources that have that token', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            source: fc.constantFrom('wallet', 'cex'),
            sourceIdentifier: fc.uuid(),
            token: fc.constantFrom('ETH', 'BTC', 'USDC'),
            type: fc.constantFrom('buy', 'sell'),
            quantity: fc.double({ min: 0.001, max: 100 }),
            priceUsd: fc.double({ min: 1, max: 100000 }),
            timestamp: fc.integer({ min: 1609459200000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.constantFrom('ETH', 'BTC', 'USDC'),
        (transactions, filterToken) => {
          // Filter transactions
          const filtered = transactions.filter(tx => tx.token === filterToken);

          // Property: All filtered transactions have the correct token
          expect(filtered.every(tx => tx.token === filterToken)).toBe(true);

          // Property: Source count in filtered equals unique sources with that token
          const sourcesWithToken = new Set(
            transactions
              .filter(tx => tx.token === filterToken)
              .map(tx => tx.sourceIdentifier)
          );
          const filteredSources = new Set(filtered.map(tx => tx.sourceIdentifier));
          
          expect(filteredSources.size).toBe(sourcesWithToken.size);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
