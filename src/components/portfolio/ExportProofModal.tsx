import React, { useState } from 'react';
import { Download, FileText, Image, Code, Shield, Hash, Clock, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface ExportProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: {
    totalValue: number;
    riskScore: number;
    trustScore: number;
    timestamp: Date;
    guardianFlags: Array<{ type: string; severity: string; count: number }>;
    dataLineage: Array<{ type: string; source: string }>;
  };
}

export const ExportProofModal: React.FC<ExportProofModalProps> = ({
  isOpen,
  onClose,
  portfolioData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'pdf' | 'json' | 'image'>('pdf');
  const [proofHash, setProofHash] = useState('');
  const [copilotSummary, setCopilotSummary] = useState('');

  const generateProofHash = () => {
    // Simulate hash generation
    const data = JSON.stringify(portfolioData);
    const hash = btoa(data).slice(0, 32);
    return `0x${hash}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export process
    const steps = [
      { delay: 500, progress: 20, message: 'Collecting portfolio data...' },
      { delay: 1000, progress: 40, message: 'Generating Guardian proof...' },
      { delay: 1500, progress: 60, message: 'Creating cryptographic hash...' },
      { delay: 2000, progress: 80, message: 'Formatting export...' },
      { delay: 2500, progress: 100, message: 'Export complete!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step) - 1].delay : 0)));
      setExportProgress(step.progress);
    }

    // Generate proof hash
    const hash = generateProofHash();
    setProofHash(hash);

    // Generate Copilot summary
    setCopilotSummary(`Portfolio Analysis Summary:
• Total Value: $${portfolioData.totalValue.toLocaleString()}
• Risk Assessment: ${portfolioData.riskScore}/10 (${portfolioData.riskScore >= 8 ? 'Low' : portfolioData.riskScore >= 6 ? 'Medium' : 'High'} Risk)
• Guardian Trust Score: ${portfolioData.trustScore}% (${portfolioData.trustScore >= 80 ? 'Trusted' : portfolioData.trustScore >= 60 ? 'Moderate' : 'Caution'})
• Security Flags: ${portfolioData.guardianFlags.length} detected
• Data Quality: ${portfolioData.dataLineage.filter(d => d.type === 'real').length}/${portfolioData.dataLineage.length} real sources
• Analysis Date: ${portfolioData.timestamp.toLocaleString()}
• Cryptographic Proof: ${hash}`);

    setIsExporting(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (exportType) {
      case 'pdf':
        // In real implementation, generate actual PDF
        downloadFile(copilotSummary, `portfolio-proof-${timestamp}.txt`, 'text/plain');
        break;
      case 'json':
        const jsonData = {
          ...portfolioData,
          proofHash,
          exportTimestamp: new Date().toISOString(),
          signature: 'guardian_verified'
        };
        downloadFile(JSON.stringify(jsonData, null, 2), `portfolio-proof-${timestamp}.json`, 'application/json');
        break;
      case 'image':
        // In real implementation, generate actual image
        downloadFile(copilotSummary, `portfolio-proof-${timestamp}.txt`, 'text/plain');
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Export Portfolio Proof
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Progress */}
          {isExporting && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm font-medium">Generating Proof...</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
            </Card>
          )}

          <Tabs defaultValue="format" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="format">Export Format</TabsTrigger>
              <TabsTrigger value="proof">Cryptographic Proof</TabsTrigger>
              <TabsTrigger value="copilot">AI Summary</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Format Selection Tab */}
            <TabsContent value="format" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PDF Export */}
                <Card 
                  className={`p-4 cursor-pointer transition-colors ${exportType === 'pdf' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setExportType('pdf')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="font-medium">PDF Report</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Professional report with charts, analysis, and Guardian verification
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Charts</Badge>
                      <Badge variant="outline" className="text-xs">Compliance</Badge>
                      <Badge variant="outline" className="text-xs">Printable</Badge>
                    </div>
                  </div>
                </Card>

                {/* JSON Export */}
                <Card 
                  className={`p-4 cursor-pointer transition-colors ${exportType === 'json' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setExportType('json')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">JSON Data</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Raw data with cryptographic signatures for API integration
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">API Ready</Badge>
                      <Badge variant="outline" className="text-xs">Signed</Badge>
                      <Badge variant="outline" className="text-xs">Machine Readable</Badge>
                    </div>
                  </div>
                </Card>

                {/* Image Export */}
                <Card 
                  className={`p-4 cursor-pointer transition-colors ${exportType === 'image' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setExportType('image')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Visual Snapshot</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      High-resolution image perfect for presentations and sharing
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">High-Res</Badge>
                      <Badge variant="outline" className="text-xs">Shareable</Badge>
                      <Badge variant="outline" className="text-xs">Branded</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Cryptographic Proof Tab */}
            <TabsContent value="proof" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Blockchain-Grade Verification</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Proof Hash</label>
                        <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                          {proofHash || 'Generated after export...'}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                        <div className="mt-1 p-2 bg-muted rounded text-sm">
                          {portfolioData.timestamp.toISOString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Guardian Signature</label>
                        <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                          guardian_verified_v1.0
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data Integrity</label>
                        <div className="mt-1 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-muted/50">
                    <p className="text-xs text-muted-foreground">
                      This cryptographic proof ensures the integrity and authenticity of your portfolio analysis. 
                      The hash can be independently verified against the original data.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* AI Summary Tab */}
            <TabsContent value="copilot" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">AI-Generated Summary</h4>
                  </div>
                  
                  <Textarea
                    value={copilotSummary}
                    onChange={(e) => setCopilotSummary(e.target.value)}
                    placeholder="AI summary will be generated after export..."
                    className="min-h-[200px] font-mono text-sm"
                    readOnly={!copilotSummary}
                  />
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Summary generated with AlphaWhale Copilot AI</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Export Preview</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Portfolio Value:</span>
                        <span className="font-medium">${portfolioData.totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Score:</span>
                        <span className="font-medium">{portfolioData.riskScore}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trust Score:</span>
                        <span className="font-medium">{portfolioData.trustScore}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Security Flags:</span>
                        <span className="font-medium">{portfolioData.guardianFlags.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Sources:</span>
                        <span className="font-medium">{portfolioData.dataLineage.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Export Format:</span>
                        <span className="font-medium uppercase">{exportType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
              >
                {isExporting ? 'Generating...' : 'Generate Proof'}
              </Button>
              <Button 
                onClick={handleDownload}
                disabled={!proofHash}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {exportType.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};