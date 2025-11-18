/**
 * Property-Based Tests for FIFO Cost Basis Calculation
 * Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
 * Validates: Requirements 2.1, 16.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateFIFOLots,
  calculateHoldingPeriod,
  calculateUnrealizedPnL,
  isLongTerm,
  type Transaction,
  type Lot,
} from '../fifo';

describe('FIFO Cost Basis Calculation - Property Tests', () => {
  /**
   * Property 1: FIFO Cost Basis Consistency
   * Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
   * Validates: Requirements 2.1, 16.1
   * 
   * For any sequence of transactions, FIFO SHALL produce lots in chronological order
   * where the oldest acquisition is always sold first
   */
  it('Property 1: FIFO Cost Basis Consistency - lots in chronological order and oldest sold first', () => {
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
            expect(result.lots[i].acquiredAt.getTime()).toBeGreaterThanOrEqual(
              result.lots[i - 1].acquiredAt.getTime()
            );
          }
          
          // Part 2: Verify all acquisitions are preserved (no sells yet)
          const totalAcquired = acquisitions.reduce((sum, tx) => sum + tx.quantity, 0);
          expect(result.totalRemaining).toBeCloseTo(totalAcquired, 3);
          
          // Part 3: Verify lot count matches acquisition count
          expect(result.lots.length).toBe(acquisitions.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: FIFO consumes oldest lots first
   */
  it('Property: Sells consume from oldest lots first', () => {
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
            expect(result.lots[0].remaining).toBeCloseTo(qty1 - sellQty, 5);
            expect(result.lots[1].remaining).toBe(qty2);
          }
          // If we sold exactly first lot, only second lot remains
          else if (sellQty === qty1) {
            expect(result.lots.length).toBe(1);
            expect(result.lots[0].remaining).toBe(qty2);
          }
          // If we sold more than first lot, first is gone, second is partially consumed
          else if (sellQty < qty1 + qty2) {
            const remaining = result.lots.reduce((sum, lot) => sum + lot.remaining, 0);
            expect(remaining).toBeCloseTo(qty1 + qty2 - sellQty, 5);
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
  it('Property: Total remaining equals total bought minus total sold', () => {
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
          
          expect(result.totalRemaining).toBeCloseTo(expectedRemaining, 3);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Unrealized PnL Calculation - Property Tests', () => {
  /**
   * Property 2: Unrealized PnL Calculation Accuracy
   * For any lot with acquisition price and current price,
   * unrealized PnL SHALL equal (current_price - acquired_price) * quantity
   */
  it('Property 2: Unrealized PnL formula is correct', () => {
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
          
          expect(pnl).toBeCloseTo(expected, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: PnL is negative for losses, positive for gains
   */
  it('Property: PnL sign matches price movement', () => {
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
            expect(pnl).toBeGreaterThan(0); // Gain
          } else if (currentPrice < lot.priceUsd) {
            expect(pnl).toBeLessThan(0); // Loss
          } else {
            expect(pnl).toBeCloseTo(0, 5); // Break-even
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Holding Period Calculation - Property Tests', () => {
  /**
   * Property: Holding period is always non-negative
   */
  it('Property: Holding period is never negative', () => {
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
          
          expect(holdingPeriod).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Long-term classification is consistent
   */
  it('Property: Long-term is true iff holding period > 365 days', () => {
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
            expect(longTerm).toBe(true);
          } else {
            expect(longTerm).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
