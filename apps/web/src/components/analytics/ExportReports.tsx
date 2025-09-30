import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface ExportData {
  whaleTransactions: any[];
  analytics: any[];
  alerts: any[];
}

export const ExportReports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'whale' | 'analytics' | 'alerts'>('whale');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const generateCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = async (data: any[], filename: string) => {
    // Simple PDF generation using HTML canvas
    const content = `
      <html>
        <head><title>WhalePlus Report</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🐋 WhalePlus ${reportType.toUpperCase()} Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <p>Period: Last ${dateRange}</p>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>${Object.keys(data[0] || {}).map(key => `<th style="padding: 8px;">${key}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${Object.values(row).map(val => `<td style="padding: 8px;">${val}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getMockData = (): any[] => {
    switch (reportType) {
      case 'whale':
        return [
          { date: '2025-01-15', address: '0x1234...5678', amount: '1,000 ETH', value: '$2.5M', type: 'Transfer' },
          { date: '2025-01-14', address: '0x8765...4321', amount: '500 BTC', value: '$25M', type: 'Exchange' },
          { date: '2025-01-13', address: '0xabcd...efgh', amount: '2,000 ETH', value: '$5M', type: 'DeFi' }
        ];
      case 'analytics':
        return [
          { metric: 'Total Alerts', value: '1,234', change: '+15%' },
          { metric: 'Active Whales', value: '89', change: '+8%' },
          { metric: 'Volume Tracked', value: '$125M', change: '+22%' }
        ];
      case 'alerts':
        return [
          { time: '2025-01-15 14:30', type: 'Large Transfer', amount: '$2.5M', status: 'Delivered' },
          { time: '2025-01-15 12:15', type: 'Exchange Movement', amount: '$25M', status: 'Delivered' },
          { time: '2025-01-14 18:45', type: 'DeFi Activity', amount: '$5M', status: 'Delivered' }
        ];
      default:
        return [];
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const data = getMockData();
      const filename = `whaleplus_${reportType}_report`;
      
      if (format === 'csv') {
        generateCSV(data, filename);
      } else {
        await generatePDF(data, filename);
      }
      
      toast({
        title: "Report exported",
        description: `${format.toUpperCase()} report downloaded successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to generate report"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whale">Whale Transactions</SelectItem>
                <SelectItem value="analytics">Analytics Summary</SelectItem>
                <SelectItem value="alerts">Alert History</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => handleExport('csv')} 
            disabled={loading}
            className="flex-1"
          >
            <Table className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => handleExport('pdf')} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};