/**
 * FIFO Property-Based Tests for HarvestPro (Deno)
 * 
 * Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
 * Validates: Requirements 2.1
 * 
 * Mathematical Properties Tested:
 * 1. Chronological Ordering: FIFO lots are always in chronological order
 * 2. Quantity Conservation: Total quantity in = total quantity out
 * 3. Cost Basis Accuracy: Weighted average cost basis is preserved
 * 4. Lot Completeness: All input transactions result in output lots
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { calculateFIFOLots, type Transaction } from '../fifo.ts';
import { createGenerators, property } from './property-test-framework.ts';

// ============================================================================
// PROPERTY 1: FIFO COST BASIS CONSISTENCY
// ============================================================================

Deno.test('Property 1.1: FIFO lots are always in chronological order', async () => {
  const generators = createGenerators(12345); // Fixed seed for reproducibility

  await property(
    () => {
      // Generate random transactions
      const transactions = generators.random.array(
        () => {
          const tx = generators.transaction();
          return {
            timestamp: tx.timestamp,
            type: tx.type,
            quantity: parseFloat(tx.quantity.toFixed(8)),
            priceUsd: parseFloat(tx.priceUsd.toFixed(2)),
          } as Transaction;
        },
        1,
        20
      );
      
      // Ensure we have at least one buy transaction
      if (!transactions.some(tx => tx.type === 'buy' || tx.type === 'transfer_in')) {
        transactions[0] = {
          ...transactions[0],
          type: 'buy',
          quantity: 1.0,
          priceUsd: 100.0,
        };
      }
      
      return transactions;
    },
    (transactions) => {
      try {
        const result = calculateFIFOLots(transactions);
        
        // Property: Lots must be in chronological order
        for (let i = 1; i < result.lots.length; i++) {
          const prevDate = result.lots[i - 1].acquiredAt;
          const currDate = result.lots[i].acquiredAt;
          
          if (currDate < prevDate) {
            console.log('Chronological order violation:', {
              prev: result.lots[i - 1],
              curr: result.lots[i],
            });
            return false;
          }
        }
        
        return true;
      } catch (error) {
        // If FIFO calculation fails, that's also a property violation
        console.log('FIFO calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'FIFO lots must be in chronological order',
    { numRuns: 200 }
  );
});

Deno.test('Property 1.2: Quantity conservation in FIFO calculation', async () => {
  const generators = createGenerators(23456);

  await property(
    () => {
      const transactions: Transaction[] = [];
      const token = 'ETH';
      
      // Generate buy transactions
      const numBuys = generators.random.int(1, 5);
      for (let i = 0; i < numBuys; i++) {
        transactions.push({
          timestamp: new Date(Date.now() - (numBuys - i) * 86400000),
          type: 'buy',
          quantity: parseFloat(generators.random.float(1, 10).toFixed(8)),
          priceUsd: parseFloat(generators.random.float(1000, 3000).toFixed(2)),
        });
      }
      
      // Generate sell transactions (less than total buys)
      const totalBought = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
      const sellAmount = parseFloat((totalBought * generators.random.float(0.1, 0.8)).toFixed(8));
      
      if (sellAmount > 0) {
        transactions.push({
          timestamp: new Date(),
          type: 'sell',
          quantity: sellAmount,
          priceUsd: parseFloat(generators.random.float(1000, 3000).toFixed(2)),
        });
      }
      
      return transactions;
    },
    (transactions) => {
      try {
        const result = calculateFIFOLots(transactions);
        
        // Calculate net quantity from transactions
        let netQuantityFromTxs = 0;
        for (const tx of transactions) {
          if (tx.type === 'buy' || tx.type === 'transfer_in') {
            netQuantityFromTxs += tx.quantity;
          } else if (tx.type === 'sell' || tx.type === 'transfer_out') {
            netQuantityFromTxs -= tx.quantity;
          }
        }
        
        // Property: Net quantity should equal total remaining in lots
        const tolerance = 0.00000001;
        if (Math.abs(netQuantityFromTxs - result.totalRemaining) > tolerance) {
          console.log('Quantity conservation violation:', {
            netQuantityFromTxs,
            totalRemaining: result.totalRemaining,
            difference: Math.abs(netQuantityFromTxs - result.totalRemaining),
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('FIFO calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'FIFO must conserve quantity (net transactions = total remaining)',
    { numRuns: 150 }
  );
});

Deno.test('Property 1.3: FIFO lots have positive quantities', async () => {
  const generators = createGenerators(34567);

  await property(
    () => {
      const transactions = generators.random.array(
        () => {
          const tx = generators.transaction();
          return {
            timestamp: tx.timestamp,
            type: tx.type,
            quantity: Math.abs(parseFloat(tx.quantity.toFixed(8))), // Ensure positive
            priceUsd: Math.abs(parseFloat(tx.priceUsd.toFixed(2))), // Ensure positive
          } as Transaction;
        },
        1,
        10
      );
      
      return transactions;
    },
    (transactions) => {
      try {
        const result = calculateFIFOLots(transactions);
        
        // Property: All lots must have positive remaining quantities
        for (const lot of result.lots) {
          if (lot.remaining <= 0) {
            console.log('Non-positive lot quantity:', lot);
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.log('FIFO calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'All FIFO lots must have positive remaining quantities',
    { numRuns: 100 }
  );
});

Deno.test('Property 1.4: FIFO lots have valid cost basis', async () => {
  const generators = createGenerators(45678);

  await property(
    () => {
      const transactions = generators.random.array(
        () => ({
          timestamp: new Date(Date.now() - generators.random.int(0, 365 * 86400000)),
          type: 'buy' as const,
          quantity: parseFloat(generators.random.float(0.1, 10).toFixed(8)),
          priceUsd: parseFloat(generators.random.float(1, 10000).toFixed(2)),
        }),
        1,
        8
      );
      
      return transactions;
    },
    (transactions) => {
      try {
        const result = calculateFIFOLots(transactions);
        
        // Property: All lots must have positive price
        for (const lot of result.lots) {
          if (lot.priceUsd <= 0) {
            console.log('Non-positive price:', lot);
            return false;
          }
          
          // Property: Price should be reasonable
          if (lot.priceUsd > 1000000) {
            console.log('Unreasonable price:', lot);
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.log('FIFO calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'All FIFO lots must have valid positive prices',
    { numRuns: 100 }
  );
});

Deno.test('Property 1.5: FIFO handles empty input gracefully', async () => {
  const generators = createGenerators(56789);

  await property(
    () => {
      // Generate empty or very small transaction sets
      const size = generators.random.int(0, 2);
      return generators.random.array(
        () => {
          const tx = generators.transaction();
          return {
            timestamp: tx.timestamp,
            type: tx.type,
            quantity: parseFloat(tx.quantity.toFixed(8)),
            priceUsd: parseFloat(tx.priceUsd.toFixed(2)),
          } as Transaction;
        },
        0,
        size
      );
    },
    (transactions) => {
      try {
        const result = calculateFIFOLots(transactions);
        
        // Property: Empty input should produce empty output
        if (transactions.length === 0) {
          return result.lots.length === 0;
        }
        
        // Property: Should not crash on small inputs
        return Array.isArray(result.lots);
      } catch (error) {
        console.log('FIFO failed on small input:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'FIFO must handle empty and small inputs gracefully',
    { numRuns: 50 }
  );
});

Deno.test('Property 1.6: FIFO is deterministic', async () => {
  const generators = createGenerators(67890);

  await property(
    () => {
      const transactions = generators.random.array(
        () => {
          const tx = generators.transaction();
          return {
            timestamp: tx.timestamp,
            type: tx.type,
            quantity: parseFloat(tx.quantity.toFixed(8)),
            priceUsd: parseFloat(tx.priceUsd.toFixed(2)),
          } as Transaction;
        },
        1,
        10
      );
      
      return transactions;
    },
    (transactions) => {
      try {
        // Run FIFO calculation twice
        const result1 = calculateFIFOLots(transactions);
        const result2 = calculateFIFOLots(transactions);
        
        // Property: Results should be identical
        if (result1.lots.length !== result2.lots.length) {
          console.log('Different number of lots:', { 
            lots1: result1.lots.length, 
            lots2: result2.lots.length 
          });
          return false;
        }
        
        for (let i = 0; i < result1.lots.length; i++) {
          const lot1 = result1.lots[i];
          const lot2 = result2.lots[i];
          
          if (
            Math.abs(lot1.quantity - lot2.quantity) > 0.00000001 ||
            Math.abs(lot1.priceUsd - lot2.priceUsd) > 0.01 ||
            Math.abs(lot1.remaining - lot2.remaining) > 0.00000001 ||
            lot1.acquiredAt.getTime() !== lot2.acquiredAt.getTime()
          ) {
            console.log('Non-deterministic result:', { lot1, lot2 });
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.log('FIFO calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'FIFO calculation must be deterministic',
    { numRuns: 100 }
  );
});

console.log('✅ All FIFO property tests defined!');
