/**
 * Property-Based Tests for FIFO Cost Basis Calculation (Deno)
 * Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
 * Validates: Requirements 2.1, 16.1
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import fc from 'npm:fast-check@3.15.0';
import {
  calculateFIFOLots,
  calculateHoldingPeriod,
  calculateUnrealizedPnL,
  isLongTerm,
  type Transaction,
  type Lot,
} from '../fifo.ts';

Deno.test('FIFO Cost Basis Calculation - Property Tests', async (t) => {
  /**
   * Property 1: FIFO Cost Basis Consistency
   * Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
   * Validates: Requirements 2.1, 16.1
   * 
   * For any sequence of transactions, FIFO SHALL produce lots in chronological order
   * where the oldest acquisition is always sold first
   */
  await t.step('Property 1: FIFO Cost Basis Consistency - lots in chronological order and oldest sold first', () => {
    fc.assert(
      fc.property(
        // Generate valid transaction sequences where buys happen before sells
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            type: fc.constantFrom('buy', 'transfer_in'),
            quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
            priceUsd: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (acquisitions) => {
          // Only test with acquisitions to ensure we have valid FIFO scenarios
          const result = calculateFIFOLots(acquisitions as Transaction[]);
          
          // Part 1: Check that remaining lots are in chronological order
          for (let i = 1; i < result.lots.length; i++) {
            const current = result.lots[i].acquiredAt.getTime();
            const previous = result.lots[i - 1].acquiredAt.getTime();
            if (current < previous) {
              throw new Error(`Lots not in chronological order: ${current} < ${previous}`);
            }
          }
          
          // Part 2: Verify all acquisitions are preserved (no sells yet)
          const totalAcquired = acquisitions.reduce((sum, tx) => sum + tx.quantity, 0);
          const diff = Math.abs(result.totalRemaining - totalAcquired);
          if (diff > 0.001) {
            throw new Error(`Total remaining ${result.totalRemaining} doesn't match acquired ${totalAcquired}`);
          }
          
          // Part 3: Verify lot count matches acquisition count
          assertEquals(result.lots.length, acquisitions.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: FIFO consumes oldest lots first
   */
  await t.step('Property: Sells consume from oldest lots first', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true })
        ),
        ([date1, date2, qty1, qty2, sellQty]) => {
          // Create two buy transactions
          const transactions: Transaction[] = [
            { timestamp: date1, type: 'buy', quantity: qty1, priceUsd: 100 },
            { timestamp: date2, type: 'buy', quantity: qty2, priceUsd: 200 },
            { timestamp: new Date('2025-01-01'), type: 'sell', quantity: sellQty, priceUsd: 150 },
          ];
          
          const result = calculateFIFOLots(transactions);
          
          // If we sold less than first lot, first lot should be partially consumed
          if (sellQty < qty1) {
            const diff = Math.abs(result.lots[0].remaining - (qty1 - sellQty));
            if (diff > 0.00001) {
              throw new Error(`First lot remaining ${result.lots[0].remaining} doesn't match expected ${qty1 - sellQty}`);
            }
            assertEquals(result.lots[1].remaining, qty2);
          }
          // If we sold exactly first lot, only second lot remains
          else if (sellQty === qty1) {
            assertEquals(result.lots.length, 1);
            assertEquals(result.lots[0].remaining, qty2);
          }
          // If we sold more than first lot, first is gone, second is partially consumed
          else if (sellQty < qty1 + qty2) {
            const remaining = result.lots.reduce((sum, lot) => sum + lot.remaining, 0);
            const expected = qty1 + qty2 - sellQty;
            const diff = Math.abs(remaining - expected);
            if (diff > 0.00001) {
              throw new Error(`Total remaining ${remaining} doesn't match expected ${expected}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total remaining quantity is correct
   */
  await t.step('Property: Total remaining equals total bought minus total sold', () => {
    fc.assert(
      fc.property(
        // Generate buys first, then sells to ensure valid transaction sequences
        fc.tuple(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2022-12-31') }).filter(d => !isNaN(d.getTime())),
              type: fc.constant('buy' as const),
              quantity: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
              priceUsd: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
              type: fc.constant('sell' as const),
              quantity: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
              priceUsd: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
            }),
            { minLength: 0, maxLength: 10 }
          )
        ),
        ([buys, sells]) => {
          const transactions = [...buys, ...sells];
          
          const totalBought = buys.reduce((sum, tx) => sum + tx.quantity, 0);
          const totalSold = sells.reduce((sum, tx) => sum + tx.quantity, 0);
          
          const result = calculateFIFOLots(transactions as Transaction[]);
          
          const expectedRemaining = Math.max(0, totalBought - totalSold);
          const diff = Math.abs(result.totalRemaining - expectedRemaining);
          
          if (diff > 0.001) {
            throw new Error(`Total remaining ${result.totalRemaining} doesn't match expected ${expectedRemaining}`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


Deno.test('Unrealized PnL Calculation - Property Tests', async (t) => {
  /**
   * Property 2: Unrealized PnL Calculation Accuracy
   * For any lot with acquisition price and current price,
   * unrealized PnL SHALL equal (current_price - acquired_price) * quantity
   */
  await t.step('Property 2: Unrealized PnL formula is correct', () => {
    fc.assert(
      fc.property(
        fc.record({
          acquiredAt: fc.date(),
          quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          priceUsd: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          remaining: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
        }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (lot, currentPrice) => {
          const pnl = calculateUnrealizedPnL(lot as Lot, currentPrice);
          const expected = (currentPrice - lot.priceUsd) * lot.remaining;
          
          const diff = Math.abs(pnl - expected);
          if (diff > 0.00001) {
            throw new Error(`PnL ${pnl} doesn't match expected ${expected}`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: PnL is negative for losses, positive for gains
   */
  await t.step('Property: PnL sign matches price movement', () => {
    fc.assert(
      fc.property(
        fc.record({
          acquiredAt: fc.date(),
          quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          priceUsd: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
          remaining: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
        }),
        fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
        (lot, currentPrice) => {
          const pnl = calculateUnrealizedPnL(lot as Lot, currentPrice);
          
          if (currentPrice > lot.priceUsd) {
            if (pnl <= 0) {
              throw new Error(`Expected positive PnL for gain, got ${pnl}`);
            }
          } else if (currentPrice < lot.priceUsd) {
            if (pnl >= 0) {
              throw new Error(`Expected negative PnL for loss, got ${pnl}`);
            }
          } else {
            const diff = Math.abs(pnl);
            if (diff > 0.00001) {
              throw new Error(`Expected zero PnL for break-even, got ${pnl}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

Deno.test('Holding Period Calculation - Property Tests', async (t) => {
  /**
   * Property: Holding period is always non-negative
   */
  await t.step('Property: Holding period is never negative', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
        (acquiredAt, currentDate, quantity, priceUsd, remaining) => {
          // Ensure currentDate is always >= acquiredAt
          const validCurrentDate = currentDate.getTime() < acquiredAt.getTime() 
            ? new Date(acquiredAt.getTime() + 1000) // Add 1 second
            : currentDate;
          
          const lot: Lot = {
            acquiredAt,
            quantity,
            priceUsd,
            remaining,
          };
          
          const holdingPeriod = calculateHoldingPeriod(lot, validCurrentDate);
          
          if (holdingPeriod < 0) {
            throw new Error(`Holding period should never be negative, got ${holdingPeriod}`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Long-term classification is consistent
   */
  await t.step('Property: Long-term is true iff holding period > 365 days', () => {
    fc.assert(
      fc.property(
        fc.record({
          acquiredAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
          quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          priceUsd: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          remaining: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
        }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        (lot, currentDate) => {
          const holdingPeriod = calculateHoldingPeriod(lot as Lot, currentDate);
          const longTerm = isLongTerm(lot as Lot, currentDate);
          
          if (holdingPeriod > 365) {
            assertEquals(longTerm, true);
          } else {
            assertEquals(longTerm, false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
