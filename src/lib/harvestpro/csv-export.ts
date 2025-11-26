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
}

export interface CSVRow {
  Description: string;
  'Date Acquired': string;
  'Date Sold': string;
  Proceeds: string;
  'Cost Basis': string;
  'Gain or Loss': string;
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
    
    return {
      token: opp.token,
      dateAcquired: new Date(opp.createdAt), // This should come from lot data
      dateSold: soldDate,
      quantity: opp.remainingQty,
      costBasis: costBasis,
      proceeds: proceeds,
      gainLoss: opp.unrealizedLoss, // Negative for losses
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
 */
export function generateForm8949CSV(session: HarvestSession): string {
  const lots = sessionToHarvestedLots(session);
  
  // Requirement 11.2: Include all required columns
  const headers = [
    'Description',
    'Date Acquired',
    'Date Sold',
    'Proceeds',
    'Cost Basis',
    'Gain or Loss',
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
  }));
  
  // Convert to CSV string
  // Requirement 11.5: Ensure compatibility with Excel, Google Sheets, Numbers
  // Using standard CSV format with proper escaping
  const csvLines: string[] = [];
  
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
export function generateCSVFromLots(lots: HarvestedLotForExport[]): string {
  const headers = [
    'Description',
    'Date Acquired',
    'Date Sold',
    'Proceeds',
    'Cost Basis',
    'Gain or Loss',
  ];
  
  const rows: CSVRow[] = lots.map((lot) => ({
    Description: `${lot.quantity.toFixed(8)} ${lot.token}`,
    'Date Acquired': lot.dateAcquired.toISOString().split('T')[0],
    'Date Sold': lot.dateSold.toISOString().split('T')[0],
    Proceeds: formatMonetaryValue(lot.proceeds),
    'Cost Basis': formatMonetaryValue(lot.costBasis),
    'Gain or Loss': formatMonetaryValue(lot.gainLoss),
  }));
  
  const csvLines: string[] = [];
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
  if (lines.length < 2) {
    return [];
  }
  
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as CSVRow);
  }
  
  return rows;
}
