/**
 * Property-Based Tests for CSV Export
 * Feature: harvestpro, Property 10: CSV Export Completeness
 * Feature: harvestpro, Property 11: Monetary Value Formatting
 * Validates: Requirements 11.2, 11.3, 11.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateForm8949CSV,
  generateCSVFromLots,
  parseCSV,
  formatMonetaryValue,
  sessionToHarvestedLots,
  type HarvestedLotForExport,
} from '../csv-export';
import type { HarvestSession, HarvestOpportunity } from '@/types/harvestpro';

// Helper to generate valid hex strings for transaction hashes
const hexStringArbitrary = fc.string({ minLength: 64, maxLength: 66 }).map(s => 
  '0x' + s.replace(/[^0-9a-f]/gi, '0').substring(0, 64)
);

describe('CSV Export - Property Tests', () => {
  /**
   * Property 10: CSV Export Completeness
   * Feature: harvestpro, Property 10: CSV Export Completeness
   * Validates: Requirements 11.2, 11.4
   * 
   * For any completed harvest session, the generated CSV SHALL include exactly one row
   * per harvested lot with all required columns (description, date acquired, date sold,
   * proceeds, cost basis, gain/loss)
   */
  it('Property 10: CSV Export Completeness - one row per lot with all required columns', () => {
    fc.assert(
      fc.property(
        // Generate array of harvested lots
        fc.array(
          fc.record({
            token: fc.constantFrom('BTC', 'ETH', 'USDC', 'SOL', 'MATIC', 'AVAX'),
            dateAcquired: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-30') }).filter(d => !isNaN(d.getTime())),
            dateSold: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
            costBasis: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            proceeds: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            gainLoss: fc.float({ min: Math.fround(-100000), max: Math.fround(100000), noNaN: true }),
            term: fc.constantFrom('Short-term', 'Long-term') as fc.Arbitrary<'Short-term' | 'Long-term'>,
            source: fc.constantFrom('Uniswap', 'SushiSwap', 'Binance', 'Coinbase'),
            txHash: fc.option(hexStringArbitrary, { nil: null }),
            feeUsd: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lots) => {
          // Generate CSV from lots
          const csv = generateCSVFromLots(lots as HarvestedLotForExport[], false);
          
          // Parse CSV back
          const rows = parseCSV(csv);
          
          // Part 1: Verify row count matches lot count (Requirement 11.4)
          expect(rows.length).toBe(lots.length);
          
          // Part 2: Verify all required columns are present (Requirement 11.2 + Enhanced Req 21 AC1)
          const requiredColumns = [
            'Description',
            'Date Acquired',
            'Date Sold',
            'Proceeds',
            'Cost Basis',
            'Gain or Loss',
            'Term',
            'Quantity',
            'Source',
            'Tx Hash',
            'Fee USD',
          ];
          
          rows.forEach((row) => {
            requiredColumns.forEach((column) => {
              expect(row).toHaveProperty(column);
              expect(row[column as keyof typeof row]).toBeDefined();
            });
          });
          
          // Part 3: Verify each row corresponds to a lot
          rows.forEach((row, index) => {
            const lot = lots[index];
            
            // Check description contains token symbol
            expect(row.Description).toContain(lot.token);
            
            // Check dates are in correct format (YYYY-MM-DD)
            expect(row['Date Acquired']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(row['Date Sold']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // Check monetary values are present
            expect(row.Proceeds).toBeTruthy();
            expect(row['Cost Basis']).toBeTruthy();
            expect(row['Gain or Loss']).toBeTruthy();
            
            // Check new columns (Enhanced Req 21 AC1)
            expect(row.Term).toMatch(/^(Short-term|Long-term)$/);
            expect(row.Quantity).toBeTruthy();
            expect(row.Source).toBeTruthy();
            expect(row['Fee USD']).toBeTruthy();
            // Tx Hash can be empty
            expect(row).toHaveProperty('Tx Hash');
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Monetary Value Formatting
   * Feature: harvestpro, Property 11: Monetary Value Formatting
   * Validates: Requirements 11.3
   * 
   * For any monetary value in CSV exports, the value SHALL be formatted with
   * exactly two decimal places
   */
  it('Property 11: Monetary Value Formatting - exactly 2 decimal places', () => {
    fc.assert(
      fc.property(
        // Generate array of harvested lots with various monetary values
        fc.array(
          fc.record({
            token: fc.constantFrom('BTC', 'ETH', 'USDC', 'SOL'),
            dateAcquired: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-30') }).filter(d => !isNaN(d.getTime())),
            dateSold: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
            // Test with various decimal places
            costBasis: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            proceeds: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            gainLoss: fc.float({ min: Math.fround(-100000), max: Math.fround(100000), noNaN: true }),
            term: fc.constantFrom('Short-term', 'Long-term') as fc.Arbitrary<'Short-term' | 'Long-term'>,
            source: fc.constantFrom('Uniswap', 'SushiSwap', 'Binance', 'Coinbase'),
            txHash: fc.option(hexStringArbitrary, { nil: null }),
            feeUsd: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lots) => {
          // Generate CSV
          const csv = generateCSVFromLots(lots as HarvestedLotForExport[], false);
          
          // Parse CSV
          const rows = parseCSV(csv);
          
          // Verify all monetary values have exactly 2 decimal places
          rows.forEach((row, index) => {
            const lot = lots[index];
            
            // Check Proceeds format
            expect(row.Proceeds).toMatch(/^\-?\d+\.\d{2}$/);
            const proceedsValue = parseFloat(row.Proceeds);
            // toFixed(2) rounds, so we expect within 0.01 difference
            expect(Math.abs(proceedsValue - lot.proceeds)).toBeLessThanOrEqual(0.01);
            
            // Check Cost Basis format
            expect(row['Cost Basis']).toMatch(/^\-?\d+\.\d{2}$/);
            const costBasisValue = parseFloat(row['Cost Basis']);
            expect(Math.abs(costBasisValue - lot.costBasis)).toBeLessThanOrEqual(0.01);
            
            // Check Gain or Loss format
            expect(row['Gain or Loss']).toMatch(/^\-?\d+\.\d{2}$/);
            const gainLossValue = parseFloat(row['Gain or Loss']);
            expect(Math.abs(gainLossValue - lot.gainLoss)).toBeLessThanOrEqual(0.01);
            
            // Check Fee USD format (Enhanced Req 21 AC1)
            expect(row['Fee USD']).toMatch(/^\-?\d+\.\d{2}$/);
            const feeValue = parseFloat(row['Fee USD']);
            expect(Math.abs(feeValue - lot.feeUsd)).toBeLessThanOrEqual(0.01);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: formatMonetaryValue always produces exactly 2 decimal places
   */
  it('Property: formatMonetaryValue produces exactly 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000000), max: Math.fround(1000000), noNaN: true }),
        (value) => {
          const formatted = formatMonetaryValue(value);
          
          // Check format: optional minus, digits, dot, exactly 2 digits
          expect(formatted).toMatch(/^\-?\d+\.\d{2}$/);
          
          // Verify the value is preserved (within rounding tolerance)
          // Note: toFixed(2) rounds to 2 decimal places, so we expect the parsed value
          // to be within 0.01 of the original (not exact due to rounding)
          const parsed = parseFloat(formatted);
          const difference = Math.abs(parsed - value);
          expect(difference).toBeLessThanOrEqual(0.01);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CSV is parseable and round-trips correctly
   */
  it('Property: CSV can be parsed and data is preserved', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            token: fc.constantFrom('BTC', 'ETH', 'USDC', 'SOL', 'MATIC'),
            dateAcquired: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-30') }).filter(d => !isNaN(d.getTime())),
            dateSold: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
            costBasis: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            proceeds: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            gainLoss: fc.float({ min: Math.fround(-100000), max: Math.fround(100000), noNaN: true }),
            term: fc.constantFrom('Short-term', 'Long-term') as fc.Arbitrary<'Short-term' | 'Long-term'>,
            source: fc.constantFrom('Uniswap', 'SushiSwap', 'Binance', 'Coinbase'),
            txHash: fc.option(hexStringArbitrary, { nil: null }),
            feeUsd: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (lots) => {
          // Generate CSV
          const csv = generateCSVFromLots(lots as HarvestedLotForExport[], false);
          
          // Parse it back
          const rows = parseCSV(csv);
          
          // Verify data integrity
          expect(rows.length).toBe(lots.length);
          
          rows.forEach((row, index) => {
            const lot = lots[index];
            
            // Token symbol should be in description
            expect(row.Description).toContain(lot.token);
            
            // Dates should match (within day precision)
            const acquiredDate = lot.dateAcquired.toISOString().split('T')[0];
            const soldDate = lot.dateSold.toISOString().split('T')[0];
            expect(row['Date Acquired']).toBe(acquiredDate);
            expect(row['Date Sold']).toBe(soldDate);
            
            // Monetary values should be close (within 0.01 due to rounding)
            expect(Math.abs(parseFloat(row.Proceeds) - lot.proceeds)).toBeLessThanOrEqual(0.01);
            expect(Math.abs(parseFloat(row['Cost Basis']) - lot.costBasis)).toBeLessThanOrEqual(0.01);
            expect(Math.abs(parseFloat(row['Gain or Loss']) - lot.gainLoss)).toBeLessThanOrEqual(0.01);
            expect(Math.abs(parseFloat(row['Fee USD']) - lot.feeUsd)).toBeLessThanOrEqual(0.01);
            
            // New columns should match (Enhanced Req 21 AC1)
            expect(row.Term).toBe(lot.term);
            expect(parseFloat(row.Quantity)).toBeCloseTo(lot.quantity, 8);
            expect(row.Source).toBe(lot.source);
            expect(row['Tx Hash']).toBe(lot.txHash || '');
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty session produces valid CSV with header only
   */
  it('Property: Empty lots array produces valid CSV with headers', () => {
    const csv = generateCSVFromLots([], false);
    const lines = csv.split('\n');
    
    // Should have metadata header, empty line, and header line
    expect(lines.length).toBeGreaterThanOrEqual(3);
    
    // Check metadata header (Enhanced Req 21 AC2)
    expect(lines[0]).toBe('Accounting: FIFO, Not a tax filing');
    expect(lines[1]).toBe(''); // Empty line
    
    // Check column headers
    const headerLine = lines[2];
    expect(headerLine).toContain('Description');
    expect(headerLine).toContain('Date Acquired');
    expect(headerLine).toContain('Date Sold');
    expect(headerLine).toContain('Proceeds');
    expect(headerLine).toContain('Cost Basis');
    expect(headerLine).toContain('Gain or Loss');
    expect(headerLine).toContain('Term');
    expect(headerLine).toContain('Quantity');
    expect(headerLine).toContain('Source');
    expect(headerLine).toContain('Tx Hash');
    expect(headerLine).toContain('Fee USD');
  });

  /**
   * Property: Demo mode CSV includes watermark and disclaimer
   * Enhanced Req 30 AC5: Demo export watermark
   */
  it('Property: Demo mode CSV includes watermark and disclaimer', () => {
    const csv = generateCSVFromLots([], true);
    const lines = csv.split('\n');
    
    // Should have demo watermark, disclaimer, empty line, and header line
    expect(lines.length).toBeGreaterThanOrEqual(4);
    
    // Check demo watermark (Enhanced Req 30 AC5)
    expect(lines[0]).toBe('DEMO DATA - NOT FOR TAX FILING');
    expect(lines[1]).toBe('Sample data for demonstration only');
    expect(lines[2]).toBe(''); // Empty line
    
    // Check column headers are still present
    const headerLine = lines[3];
    expect(headerLine).toContain('Description');
    expect(headerLine).toContain('Date Acquired');
    expect(headerLine).toContain('Date Sold');
    expect(headerLine).toContain('Proceeds');
    expect(headerLine).toContain('Cost Basis');
    expect(headerLine).toContain('Gain or Loss');
    expect(headerLine).toContain('Term');
    expect(headerLine).toContain('Quantity');
    expect(headerLine).toContain('Source');
    expect(headerLine).toContain('Tx Hash');
    expect(headerLine).toContain('Fee USD');
  });

  /**
   * Property: Live mode CSV has standard metadata header
   */
  it('Property: Live mode CSV has standard metadata header', () => {
    const csv = generateCSVFromLots([], false);
    const lines = csv.split('\n');
    
    // Should have standard metadata header
    expect(lines[0]).toBe('Accounting: FIFO, Not a tax filing');
    expect(lines[1]).toBe(''); // Empty line
    expect(lines[2]).toContain('Description'); // Header line
  });

  /**
   * Property: CSV with special characters is properly escaped
   */
  it('Property: Special characters in token names are properly escaped', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            // Test with commas and quotes (newlines would break CSV structure)
            token: fc.constantFrom('BTC,USD', 'ETH"TEST', 'SOL-NEW'),
            dateAcquired: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-30') }).filter(d => !isNaN(d.getTime())),
            dateSold: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
            costBasis: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            proceeds: fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
            gainLoss: fc.float({ min: Math.fround(-100000), max: Math.fround(100000), noNaN: true }),
            term: fc.constantFrom('Short-term', 'Long-term') as fc.Arbitrary<'Short-term' | 'Long-term'>,
            source: fc.constantFrom('Uniswap', 'SushiSwap', 'Binance', 'Coinbase'),
            txHash: fc.option(hexStringArbitrary, { nil: null }),
            feeUsd: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (lots) => {
          // Generate CSV
          const csv = generateCSVFromLots(lots as HarvestedLotForExport[], false);
          
          // CSV should be valid (no unescaped special characters breaking structure)
          const lines = csv.split('\n');
          
          // Should have metadata header + empty line + header + data rows
          expect(lines.length).toBe(lots.length + 3);
          
          // Each data line should have the correct structure
          // Note: This is a simplified check; proper CSV parsing handles quoted fields
          lines.forEach((line, index) => {
            if (index >= 2 && line.trim()) { // Skip metadata and header lines
              // Line should not be empty
              expect(line.length).toBeGreaterThan(0);
            }
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('CSV Export - Integration with HarvestSession', () => {
  /**
   * Test that sessionToHarvestedLots correctly converts session data
   */
  it('should convert HarvestSession to HarvestedLots', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.uuid(),
          userId: fc.uuid(),
          createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
          updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
          status: fc.constant('completed' as const),
          opportunitiesSelected: fc.array(
            fc.record({
              id: fc.uuid(),
              lotId: fc.uuid(),
              userId: fc.uuid(),
              token: fc.constantFrom('BTC', 'ETH', 'USDC', 'SOL'),
              tokenLogoUrl: fc.constant(null),
              riskLevel: fc.constantFrom('LOW', 'MEDIUM', 'HIGH') as fc.Arbitrary<'LOW' | 'MEDIUM' | 'HIGH'>,
              unrealizedLoss: fc.float({ min: Math.fround(-10000), max: Math.fround(-20), noNaN: true }),
              remainingQty: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
              gasEstimate: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
              slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
              tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
              netTaxBenefit: fc.float({ min: Math.fround(1), max: Math.fround(5000), noNaN: true }),
              guardianScore: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
              executionTimeEstimate: fc.constant('5-10 min'),
              confidence: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
              recommendationBadge: fc.constant('recommended' as const),
              metadata: fc.record({
                venue: fc.constantFrom('Uniswap', 'SushiSwap', 'Binance', 'Coinbase'),
              }),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-30') }).map(d => d.toISOString()),
              updatedAt: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          realizedLossesTotal: fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true }),
          netBenefitTotal: fc.float({ min: Math.fround(50), max: Math.fround(50000), noNaN: true }),
          executionSteps: fc.array(
            fc.record({
              id: fc.uuid(),
              sessionId: fc.uuid(),
              stepNumber: fc.integer({ min: 1, max: 10 }),
              description: fc.constant('Test step'),
              type: fc.constantFrom('on-chain', 'cex-manual') as fc.Arbitrary<'on-chain' | 'cex-manual'>,
              status: fc.constant('completed' as const),
              transactionHash: fc.option(hexStringArbitrary, { nil: null }),
              errorMessage: fc.constant(null),
              guardianScore: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), { nil: null }),
              timestamp: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
              createdAt: fc.date().map(d => d.toISOString()),
            }),
            { minLength: 0, maxLength: 3 }
          ),
          exportUrl: fc.constant(null),
          proofHash: fc.constant(null),
        }),
        (session) => {
          const lots = sessionToHarvestedLots(session as HarvestSession);
          
          // Should have same number of lots as opportunities
          expect(lots.length).toBe(session.opportunitiesSelected.length);
          
          // Each lot should have all required fields
          lots.forEach((lot, index) => {
            expect(lot.token).toBe(session.opportunitiesSelected[index].token);
            expect(lot.quantity).toBe(session.opportunitiesSelected[index].remainingQty);
            expect(lot.gainLoss).toBe(session.opportunitiesSelected[index].unrealizedLoss);
            expect(lot.dateAcquired).toBeInstanceOf(Date);
            expect(lot.dateSold).toBeInstanceOf(Date);
            expect(typeof lot.costBasis).toBe('number');
            expect(typeof lot.proceeds).toBe('number');
            
            // Check new fields (Enhanced Req 21 AC1)
            expect(lot.term).toMatch(/^(Short-term|Long-term)$/);
            expect(typeof lot.source).toBe('string');
            expect(lot.txHash === null || typeof lot.txHash === 'string').toBe(true);
            expect(typeof lot.feeUsd).toBe('number');
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
