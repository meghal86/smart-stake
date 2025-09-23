import { useState } from 'react';
import { Download, Share2, FileText, Image, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface PortfolioSnapshot {
  totalValue: number;
  pnl24h: number;
  riskScore: number;
  topHoldings: Array<{
    token: string;
    percentage: number;
    value: number;
  }>;
  whaleActivity: number;
  timestamp: Date;
}

interface ShareableReportsProps {
  portfolioData: PortfolioSnapshot;
  onGeneratePDF: () => Promise<Blob>;
  onGenerateImage: () => Promise<Blob>;
}

export function ShareableReports({ 
  portfolioData, 
  onGeneratePDF, 
  onGenerateImage 
}: ShareableReportsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await onGeneratePDF();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: "PDF report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImageSnapshot = async () => {
    setIsGenerating(true);
    try {
      const imageBlob = await onGenerateImage();
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-snapshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Snapshot Created",
        description: "Portfolio snapshot has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate portfolio snapshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateShareableLink = async () => {
    // In a real implementation, this would create a shareable link
    const mockShareUrl = `https://whaleplus.app/portfolio/shared/${Date.now()}`;
    setShareUrl(mockShareUrl);
    
    toast({
      title: "Shareable Link Created",
      description: "Your portfolio summary is now shareable for 24 hours.",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: "Shareable link has been copied.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateSocialText = () => {
    const riskLabel = portfolioData.riskScore >= 8 ? 'Low Risk' : 
                     portfolioData.riskScore >= 6 ? 'Medium Risk' : 'High Risk';
    
    return `🐋 My WhalePlus Portfolio Update:\n\n` +
           `💰 Total Value: ${formatValue(portfolioData.totalValue)}\n` +
           `📈 24h P&L: ${portfolioData.pnl24h >= 0 ? '+' : ''}${portfolioData.pnl24h.toFixed(2)}%\n` +
           `🛡️ Risk Score: ${portfolioData.riskScore.toFixed(1)}/10 (${riskLabel})\n` +
           `🐋 Whale Activity: ${portfolioData.whaleActivity} interactions\n\n` +
           `Top Holdings:\n` +
           portfolioData.topHoldings.slice(0, 3).map(h => 
             `• ${h.token}: ${h.percentage.toFixed(1)}% (${formatValue(h.value)})`
           ).join('\n') +
           `\n\n#WhalePlus #CryptoPortfolio #WhaleTracking`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Export & Share</h3>
        </div>
        <Badge variant="outline">
          {new Date(portfolioData.timestamp).toLocaleDateString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* PDF Report */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium">PDF Report</h4>
              <p className="text-sm text-muted-foreground">Comprehensive portfolio analysis</p>
            </div>
          </div>
          <Button 
            onClick={generatePDFReport} 
            disabled={isGenerating}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>

        {/* Image Snapshot */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Image className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Visual Snapshot</h4>
              <p className="text-sm text-muted-foreground">Social media ready image</p>
            </div>
          </div>
          <Button 
            onClick={generateImageSnapshot} 
            disabled={isGenerating}
            className="w-full"
            variant="outline"
          >
            <Image className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Create Snapshot'}
          </Button>
        </div>
      </div>

      {/* Share Options */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Share2 className="h-4 w-4 mr-2" />
            Share Portfolio Summary
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Your Portfolio</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="link" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Shareable Link</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Create Shareable Link</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a secure link to share your portfolio summary. Link expires in 24 hours.
                </p>
                
                {!shareUrl ? (
                  <Button onClick={generateShareableLink} className="w-full">
                    Generate Link
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-background rounded border">
                      <input 
                        type="text" 
                        value={shareUrl} 
                        readOnly 
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(shareUrl)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Link expires: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Social Media Post</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready-to-share text for Twitter, Telegram, or Discord
                </p>
                
                <div className="space-y-3">
                  <textarea 
                    value={generateSocialText()}
                    readOnly
                    className="w-full h-48 p-3 text-sm bg-background border rounded resize-none"
                  />
                  <Button 
                    onClick={() => copyToClipboard(generateSocialText())}
                    className="w-full"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy Text
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Portfolio Summary Preview */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <h4 className="font-medium mb-3">Portfolio Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Value</p>
            <p className="font-medium">{formatValue(portfolioData.totalValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">24h P&L</p>
            <p className={`font-medium ${portfolioData.pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.pnl24h >= 0 ? '+' : ''}{portfolioData.pnl24h.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Risk Score</p>
            <p className="font-medium">{portfolioData.riskScore.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-muted-foreground">Whale Activity</p>
            <p className="font-medium">{portfolioData.whaleActivity}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}