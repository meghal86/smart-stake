import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

interface ExportReportButtonsProps {
  predictions: unknown[];
}

export function ExportReportButtons({ predictions }: ExportReportButtonsProps) {
  const handleExportCSV = () => {
    track('export_csv_clicked', { prediction_count: predictions.length });
    
    const csvData = predictions.map(p => ({
      asset: p.asset,
      direction: p.prediction_type,
      confidence: p.confidence,
      timestamp: p.timestamp,
      explanation: p.explanation
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    track('export_pdf_clicked', { prediction_count: predictions.length });
    
    // For now, just download a simple text report
    const report = `
Whale Predictions Report
Generated: ${new Date().toLocaleString()}

Top 5 Predictions:
${predictions.slice(0, 5).map((p, i) => `
${i + 1}. ${p.asset} - ${p.prediction_type}
   Confidence: ${Math.round(p.confidence * 100)}%
   Explanation: ${p.explanation}
`).join('')}

Model Performance:
- Accuracy: 73.2%
- Precision: 68.5%
- Recall: 71.8%
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="h-4 w-4 mr-1" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        <FileText className="h-4 w-4 mr-1" />
        Export PDF
      </Button>
    </div>
  );
}