/**
 * Enterprise export utilities for CSV and PDF generation
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  timestamp: Date;
}

export function exportToCSV(data: ExportData): void {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.title.toLowerCase().replace(/\s+/g, '_')}_${formatDateForFilename(data.timestamp)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ExportData): void {
  // Mock PDF export - in real implementation, use jsPDF or similar
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .timestamp { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${data.title}</div>
        <div class="timestamp">Generated on ${data.timestamp.toLocaleString()}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${data.headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Exported from WhalePlus Dashboard | ${window.location.hostname}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

export function prepareWhaleAnalyticsExport(whales: unknown[]): ExportData {
  return {
    title: 'Whale Analytics Report',
    timestamp: new Date(),
    headers: ['Address', 'Label', 'Balance (ETH)', 'Risk Score', 'Recent Activity', 'Chain', 'Provider'],
    rows: whales.map(whale => [
      whale.fullAddress,
      whale.label,
      whale.balance.toFixed(2),
      whale.riskScore,
      whale.recentActivity,
      whale.chain,
      whale.provider
    ])
  };
}

export function preparePortfolioExport(assets: unknown[], totalValue: number): ExportData {
  return {
    title: 'Portfolio Summary Report',
    timestamp: new Date(),
    headers: ['Asset', 'Symbol', 'Allocation %', 'Value (USD)', 'Price', '24h Change %', 'Holdings'],
    rows: [
      ...assets.map(asset => [
        asset.name,
        asset.symbol,
        asset.allocation?.toFixed(2) || '0.00',
        asset.value?.toLocaleString() || '0',
        asset.price?.toLocaleString() || '0',
        asset.change24h?.toFixed(2) || '0.00',
        asset.holdings?.toFixed(4) || '0.0000'
      ]),
      ['', '', '', '', '', '', ''],
      ['TOTAL PORTFOLIO VALUE', '', '100.00', totalValue.toLocaleString(), '', '', '']
    ]
  };
}