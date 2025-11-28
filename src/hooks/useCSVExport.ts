import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type ExportType = 'chain_risk' | 'whale_clusters' | 'alerts' | 'correlation_analysis';

interface ExportOptions {
  exportType: ExportType;
  window?: string;
  filters?: Record<string, unknown>;
}

export function useCSVExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const exportData = async (options: ExportOptions) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to export data",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('export-csv-pro', {
        body: {
          exportType: options.exportType,
          window: options.window || '24h',
          filters: options.filters || {}
        }
      });

      if (error) {
        if (error.message.includes('Pro subscription required')) {
          toast({
            title: "Pro Subscription Required",
            description: "CSV exports are available for Pro subscribers only",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Create and download the CSV file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName(options.exportType, options.window || '24h');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${formatExportType(options.exportType)} data exported successfully`,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting
  };
}

function getFileName(exportType: ExportType, window: string): string {
  const date = new Date().toISOString().split('T')[0];
  const typeMap = {
    chain_risk: 'chain_risk',
    whale_clusters: 'whale_clusters',
    alerts: 'alerts',
    correlation_analysis: 'correlation_analysis'
  };
  
  return `${typeMap[exportType]}_${window}_${date}.csv`;
}

function formatExportType(exportType: ExportType): string {
  const typeMap = {
    chain_risk: 'Chain Risk',
    whale_clusters: 'Whale Clusters',
    alerts: 'Alerts',
    correlation_analysis: 'Correlation Analysis'
  };
  
  return typeMap[exportType];
}