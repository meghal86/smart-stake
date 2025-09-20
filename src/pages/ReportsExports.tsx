import { FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportReports } from '@/components/analytics/ExportReports';
import { PlanGate } from '@/components/PlanGate';

export default function ReportsExports() {

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Reports & Exports</h1>
              <p className="text-sm text-muted-foreground">Generate reports and export data</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>

        {/* Export Reports Component */}
        <PlanGate min="pro" feature="Data Export">
          <ExportReports />
        </PlanGate>
      </div>
    </div>
  );
}