/**
 * HarvestPro CSV Export Generation
 * Generates Form 8949-compatible CSV files for tax reporting
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { HarvestSession, HarvestOpportunity } from '@/types/harvestpro';

export interface HarvestedLotForExport {
  token: string;
  dateAcquired: Date;
  dateSold: Date;
  quantity: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  term: 'Short-term' | 'Long-term';
  source: string;
  txHash: string | null;
  feeUsd: number;
}

export interface CSVRow {
  Description: string;
  'Date Acquired': string;
  'Date Sold': string;
  Proceeds: string;
  'Cost Basis': string;
  'Gain or Loss': string;
  Term: string;
  Quantity: string;
  Source: string;
  'Tx Hash': string;
  'Fee USD': string;
}

/**
 * Format a monetary value with exactly 2 decimal places
 * Requirement 11.3: Format monetary values with 2 decimal places
 */
export function formatMonetaryValue(value: number): string {
  return value.toFixed(2);
}

/**
 * Convert a HarvestSession to an array of HarvestedLotForExport
 */
export function sessionToHarvestedLots(session: HarvestSession): HarvestedLotForExport[] {
  const soldDate = session.updatedAt ? new Date(session.updatedAt) : new Date();
  
  return session.opportunitiesSelected.map((opp: HarvestOpportunity) => {
    // Calculate cost basis: acquired price * quantity
    const costBasis = opp.remainingQty * (opp.unrealizedLoss / opp.remainingQty + (opp.unrealizedLoss > 0 ? 0 : Math.abs(opp.unrealizedLoss / opp.remainingQty)));
    
    // For a loss harvest, proceeds are lower than cost basis
    // proceeds = costBasis + gainLoss (where gainLoss is negative for losses)
    const proceeds = costBasis + opp.unrealizedLoss;
    
    // Determine term based on holding period (assuming > 365 days is long-term)
    const acquiredDate = new Date(opp.createdAt);
    const holdingPeriodDays = Math.floor((soldDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24));
    const term = holdingPeriodDays > 365 ? 'Long-term' : 'Short-term';
    
    // Find transaction hash from execution steps
    const onChainStep = session.executionSteps.find(step => 
      step.type === 'on-chain' && step.transactionHash
    );
    
    // Calculate total fees (gas + slippage + trading fees)
    const totalFees = opp.gasEstimate + opp.slippageEstimate + opp.tradingFees;
    
    return {
      token: opp.token,
      dateAcquired: acquiredDate,
      dateSold: soldDate,
      quantity: opp.remainingQty,
      costBasis: costBasis,
      proceeds: proceeds,
      gainLoss: opp.unrealizedLoss, // Negative for losses
      term: term,
      source: opp.metadata.venue || 'Unknown',
      txHash: onChainStep?.transactionHash || null,
      feeUsd: totalFees,
    };
  });
}

/**
 * Generate Form 8949-style CSV from harvest session
 * 
 * Requirements:
 * - 11.1: Generate CSV file within 2 seconds
 * - 11.2: Include all required columns (description, date acquired, date sold, proceeds, cost basis, gain/loss)
 * - 11.3: Format monetary values with 2 decimal places
 * - 11.4: Include a row for each harvested lot
 * - 11.5: Ensure compatibility with Excel, Google Sheets, Numbers
 * - Enhanced Req 21 AC1-5: Add term, quantity, source, tx_hash, fee_usd columns and metadata header
 * - Enhanced Req 30 AC5: Demo export watermark for demo data
 */
export function generateForm8949CSV(session: HarvestSession, isDemo: boolean = false): string {
  const lots = sessionToHarvestedLots(session);
  
  // Enhanced Req 21 AC2: Add metadata header
  // Enhanced Req 30 AC5: Demo export watermark for demo data
  const metadataHeader = isDemo 
    ? 'DEMO DATA - NOT FOR TAX FILING'
    : 'Accounting: FIFO, Not a tax filing';
  
  // Enhanced Req 30 AC5: Additional disclaimer for demo exports
  const disclaimerLine = isDemo 
    ? 'Sample data for demonstration only'
    : '';
  
  // Enhanced Req 21 AC1: Include all required columns including new ones
  const headers = [
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
  
  // Build CSV rows
  const rows: CSVRow[] = lots.map((lot) => ({
    // Description: quantity + token symbol
    Description: `${lot.quantity.toFixed(8)} ${lot.token}`,
    // Date format: YYYY-MM-DD (ISO 8601 date only)
    'Date Acquired': lot.dateAcquired.toISOString().split('T')[0],
    'Date Sold': lot.dateSold.toISOString().split('T')[0],
    // Requirement 11.3: Format monetary values with 2 decimal places
    Proceeds: formatMonetaryValue(lot.proceeds),
    'Cost Basis': formatMonetaryValue(lot.costBasis),
    'Gain or Loss': formatMonetaryValue(lot.gainLoss),
    // Enhanced Req 21 AC1: New columns
    Term: lot.term,
    Quantity: lot.quantity.toFixed(8),
    Source: lot.source,
    'Tx Hash': lot.txHash || '',
    'Fee USD': formatMonetaryValue(lot.feeUsd),
  }));
  
  // Convert to CSV string
  // Requirement 11.5: Ensure compatibility with Excel, Google Sheets, Numbers
  // Using standard CSV format with proper escaping
  const csvLines: string[] = [];
  
  // Enhanced Req 21 AC2: Add metadata header as first line
  // Enhanced Req 30 AC5: Demo watermark for demo exports
  csvLines.push(metadataHeader);
  
  // Enhanced Req 30 AC5: Add disclaimer for demo exports
  if (isDemo && disclaimerLine) {
    csvLines.push(disclaimerLine);
  }
  
  csvLines.push(''); // Empty line for separation
  
  // Add header row
  csvLines.push(headers.join(','));
  
  // Add data rows (Requirement 11.4: Include a row for each harvested lot)
  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header as keyof CSVRow];
      // Escape values that contain commas, quotes, or newlines
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

/**
 * Generate CSV from an array of harvested lots (for testing)
 */
export function generateCSVFromLots(lots: HarvestedLotForExport[], isDemo: boolean = false): string {
  const metadataHeader = isDemo 
    ? 'DEMO DATA - NOT FOR TAX FILING'
    : 'Accounting: FIFO, Not a tax filing';
  
  const disclaimerLine = isDemo 
    ? 'Sample data for demonstration only'
    : '';
  
  const headers = [
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
  
  const rows: CSVRow[] = lots.map((lot) => ({
    Description: `${lot.quantity.toFixed(8)} ${lot.token}`,
    'Date Acquired': lot.dateAcquired.toISOString().split('T')[0],
    'Date Sold': lot.dateSold.toISOString().split('T')[0],
    Proceeds: formatMonetaryValue(lot.proceeds),
    'Cost Basis': formatMonetaryValue(lot.costBasis),
    'Gain or Loss': formatMonetaryValue(lot.gainLoss),
    Term: lot.term,
    Quantity: lot.quantity.toFixed(8),
    Source: lot.source,
    'Tx Hash': lot.txHash || '',
    'Fee USD': formatMonetaryValue(lot.feeUsd),
  }));
  
  const csvLines: string[] = [];
  
  // Add metadata header
  csvLines.push(metadataHeader);
  
  // Add disclaimer for demo exports
  if (isDemo && disclaimerLine) {
    csvLines.push(disclaimerLine);
  }
  
  csvLines.push(''); // Empty line for separation
  csvLines.push(headers.join(','));
  
  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header as keyof CSVRow];
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

/**
 * Parse CSV string back to rows (for testing round-trip)
 */
export function parseCSV(csv: string): CSVRow[] {
  const lines = csv.split('\n');
  
  // Skip metadata header and empty line
  let headerLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Description')) {
      headerLineIndex = i;
      break;
    }
  }
  
  if (headerLineIndex === 0 || headerLineIndex >= lines.length - 1) {
    return [];
  }
  
  const headers = lines[headerLineIndex].split(',');
  const rows: CSVRow[] = [];
  
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const row: unknown = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as CSVRow);
  }
  
  return rows;
}
