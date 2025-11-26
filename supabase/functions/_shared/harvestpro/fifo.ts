/**
 * FIFO Cost Basis Calculation Engine (Deno/Edge Functions)
 * Implements First-In-First-Out accounting for cryptocurrency tax lots
 * 
 * This is the server-side implementation for Supabase Edge Functions.
 * Migrated from src/lib/harvestpro/fifo.ts
 */

import type { TransactionType } from './types.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  timestamp: Date;
  type: TransactionType;
  quantity: number;
  priceUsd: number;
}

export interface Lot {
  acquiredAt: Date;
  quantity: number;
  priceUsd: number;
  remaining: number;
}

export interface FIFOResult {
  lots: Lot[];
  totalAcquired: number;
  totalRemaining: number;
}

// Database transaction interface (for conversion)
export interface WalletTransaction {
  timestamp: string; // ISO 8601
  transactionType: TransactionType;
  quantity: number;
  priceUsd: number;
}

// ============================================================================
// FIFO CALCULATION
// ============================================================================

/**
 * Calculate FIFO lots from a sequence of transactions
 * 
 * @param transactions - Array of transactions (buys, sells, transfers)
 * @returns FIFOResult with lots and totals
 * 
 * Algorithm:
 * 1. Sort transactions chronologically
 * 2. For buys/transfers_in: Create new lots
 * 3. For sells/transfers_out: Consume from oldest lots first (FIFO)
 * 4. Return only lots with remaining quantity > 0
 */
export function calculateFIFOLots(transactions: Transaction[]): FIFOResult {
  // Sort transactions chronologically (oldest first)
  const sorted = [...transactions].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  const lots: Lot[] = [];
  let totalAcquired = 0;
  
  for (const tx of sorted) {
    if (tx.type === 'buy' || tx.type === 'transfer_in') {
      // Add new lot for acquisitions
      lots.push({
        acquiredAt: tx.timestamp,
        quantity: tx.quantity,
        priceUsd: tx.priceUsd,
        remaining: tx.quantity,
      });
      totalAcquired += tx.quantity;
    } else if (tx.type === 'sell' || tx.type === 'transfer_out') {
      // Consume from oldest lots first (FIFO)
      let remaining = tx.quantity;
      
      for (const lot of lots) {
        if (remaining <= 0) break;
        if (lot.remaining <= 0) continue;
        
        const consumed = Math.min(lot.remaining, remaining);
        lot.remaining -= consumed;
        remaining -= consumed;
      }
      
      // If we still have remaining quantity, it means we're selling more than we have
      // This shouldn't happen in a valid transaction history, but we handle it gracefully
      if (remaining > 0) {
        console.warn(
          `FIFO calculation warning: Attempting to sell ${tx.quantity} but only had ${tx.quantity - remaining} available at ${tx.timestamp.toISOString()}`
        );
      }
    }
  }
  
  // Filter to only lots with remaining quantity
  const activeLots = lots.filter(lot => lot.remaining > 0);
  const totalRemaining = activeLots.reduce((sum, lot) => sum + lot.remaining, 0);
  
  return {
    lots: activeLots,
    totalAcquired,
    totalRemaining,
  };
}


/**
 * Convert database WalletTransaction to Transaction format
 */
export function walletTransactionToTransaction(tx: WalletTransaction): Transaction {
  return {
    timestamp: new Date(tx.timestamp),
    type: tx.transactionType,
    quantity: tx.quantity,
    priceUsd: tx.priceUsd,
  };
}

/**
 * Calculate FIFO lots from database transactions
 * 
 * @param dbTransactions - Array of WalletTransaction from database
 * @returns FIFOResult with lots and totals
 */
export function calculateFIFOLotsFromDB(dbTransactions: WalletTransaction[]): FIFOResult {
  const transactions = dbTransactions.map(walletTransactionToTransaction);
  return calculateFIFOLots(transactions);
}

/**
 * Calculate cost basis for a specific lot
 * 
 * @param lot - The lot to calculate cost basis for
 * @returns Total cost basis in USD
 */
export function calculateCostBasis(lot: Lot): number {
  return lot.remaining * lot.priceUsd;
}

/**
 * Calculate total cost basis for all lots
 * 
 * @param lots - Array of lots
 * @returns Total cost basis in USD
 */
export function calculateTotalCostBasis(lots: Lot[]): number {
  return lots.reduce((sum, lot) => sum + calculateCostBasis(lot), 0);
}

/**
 * Get the oldest lot (for FIFO priority)
 * 
 * @param lots - Array of lots
 * @returns The oldest lot or null if no lots
 */
export function getOldestLot(lots: Lot[]): Lot | null {
  if (lots.length === 0) return null;
  
  return lots.reduce((oldest, lot) => 
    lot.acquiredAt < oldest.acquiredAt ? lot : oldest
  );
}

/**
 * Calculate holding period in days for a lot
 * 
 * @param lot - The lot to calculate holding period for
 * @param currentDate - Current date (defaults to now)
 * @returns Holding period in days
 */
export function calculateHoldingPeriod(lot: Lot, currentDate: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = currentDate.getTime() - lot.acquiredAt.getTime();
  return Math.floor(diffMs / msPerDay);
}

/**
 * Determine if a lot qualifies as long-term (> 365 days)
 * 
 * @param lot - The lot to check
 * @param currentDate - Current date (defaults to now)
 * @returns True if long-term, false if short-term
 */
export function isLongTerm(lot: Lot, currentDate: Date = new Date()): boolean {
  return calculateHoldingPeriod(lot, currentDate) > 365;
}

/**
 * Calculate unrealized PnL for a lot
 * 
 * @param lot - The lot to calculate PnL for
 * @param currentPrice - Current market price per unit
 * @returns Unrealized PnL in USD (negative for loss, positive for gain)
 */
export function calculateUnrealizedPnL(lot: Lot, currentPrice: number): number {
  return (currentPrice - lot.priceUsd) * lot.remaining;
}

/**
 * Calculate total unrealized PnL for all lots
 * 
 * @param lots - Array of lots
 * @param currentPrice - Current market price per unit
 * @returns Total unrealized PnL in USD
 */
export function calculateTotalUnrealizedPnL(lots: Lot[], currentPrice: number): number {
  return lots.reduce((sum, lot) => sum + calculateUnrealizedPnL(lot, currentPrice), 0);
}
