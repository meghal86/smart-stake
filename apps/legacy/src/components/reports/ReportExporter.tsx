import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, FileText, Table, Code, Calendar } from 'lucide-react';

interface ReportConfig {
  format: 'PDF' | 'CSV' | 'JSON';
  dateRange: { start: Date; end: Date };
  sections: {
    portfolioSummary: boolean;
    transactionHistory: boolean;
    riskAnalysis: boolean;
    complianceChecks: boolean;
    defiActivity: boolean;
  };
  branding?: { logo: string; companyName: string };
}

interface ReportExporterProps {
  walletAddress: string;
}

export function ReportExporter({ walletAddress }: ReportExporterProps) {
  const [config, setConfig] = useState<ReportConfig>({
    format: 'PDF',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    sections: {
      portfolioSummary: true,
      transactionHistory: true,
      riskAnalysis: true,
      complianceChecks: true,
      defiActivity: false
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleExport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create mock download
    const reportData = {
      walletAddress,
      generatedAt: new Date().toISOString(),
      config,
      summary: {
        totalValue: '$195,000',
        riskScore: '6/10',
        transactionCount: 1247,
        complianceFlags: 2
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-analysis-${walletAddress.slice(0, 8)}-${config.format.toLowerCase()}.${config.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <FileText className="h-4 w-4" />;
      case 'CSV': return <Table className="h-4 w-4" />;
      case 'JSON': return <Code className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Download className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Export Report</h3>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">Report Format</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['PDF', 'CSV', 'JSON'] as const).map((format) => (
              <Button
                key={format}
                variant={config.format === format ? 'default' : 'outline'}
                onClick={() => setConfig({ ...config, format })}
                className="flex items-center gap-2"
              >
                {getFormatIcon(format)}
                {format}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Date Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, start: new Date(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, end: new Date(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Report Sections</Label>
          <div className="space-y-3">
            {Object.entries(config.sections).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    sections: { ...config.sections, [key]: checked }
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {config.format === 'PDF' && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Branding (Optional)</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="companyName" className="text-xs text-muted-foreground">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium">Report Preview</div>
              <div className="text-sm text-muted-foreground">
                {Object.values(config.sections).filter(Boolean).length} sections selected
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Estimated size</div>
              <div className="font-medium">
                {config.format === 'PDF' ? '2.5 MB' : config.format === 'CSV' ? '450 KB' : '125 KB'}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate & Download Report
              </>
            )}
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100">Report Features</div>
              <ul className="text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                <li>• Comprehensive wallet analysis with risk scoring</li>
                <li>• Transaction flow visualization and counterparty analysis</li>
                <li>• Compliance screening against sanctions lists</li>
                <li>• DeFi position tracking and yield analysis</li>
                <li>• Professional formatting suitable for compliance teams</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}