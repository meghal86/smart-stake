import { Shield, AlertTriangle, Search, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanGate } from '@/components/PlanGate';
import { MarketMakerFlowSentinel } from '@/components/premium/MarketMakerFlowSentinel';
import Scanner from './Scanner';

export default function ScannerCompliance() {
  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Scanner & Compliance</h1>
            <p className="text-sm text-muted-foreground">Advanced scanning, compliance monitoring, and forensics</p>
          </div>
        </div>

        {/* Enterprise Gate */}
        <PlanGate min="enterprise" feature="Scanner & Compliance Suite">
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="sentinel" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                MM Sentinel
              </TabsTrigger>
              <TabsTrigger value="forensics" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                AI Forensics
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-6">
              <Scanner />
            </TabsContent>

            <TabsContent value="sentinel" className="mt-6">
              <MarketMakerFlowSentinel />
            </TabsContent>

            <TabsContent value="forensics" className="mt-6">
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">AI Forensics</h3>
                <p className="text-muted-foreground">
                  Advanced AI-powered forensics for wash trading, collusion, and front-running detection
                </p>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="mt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Compliance Suite</h3>
                <p className="text-muted-foreground">
                  Sanctions screening, audit trails, and regulatory compliance tools
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </PlanGate>
      </div>
    </div>
  );
}