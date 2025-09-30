import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Image, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  data: any;
  type: 'narrative' | 'watchlist' | 'entity' | 'alerts';
  className?: string;
}

export default function ExportButton({ data, type, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    setIsExporting(true);
    
    try {
      const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        // Generate real CSV data
        const csvData = generateCSVData(data, type);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Generate real PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.text(`${type.toUpperCase()} Export`, 20, 20);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Data: ${JSON.stringify(data, null, 2)}`, 20, 40);
        doc.save(filename);
      } else if (format === 'png') {
        // Generate real PNG using html2canvas
        const { default: html2canvas } = await import('html2canvas');
        const element = document.querySelector('[data-export-target]') || document.body;
        const canvas = await html2canvas(element as HTMLElement);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSVData = (data: any, type: string): string => {
    if (type === 'watchlist' && Array.isArray(data)) {
      const headers = ['entityType', 'entityId', 'label', 'sentiment', 'whalePressure', 'risk', 'updatedAt'];
      const csvRows = [
        headers.join(','),
        ...data.map((item: any) => {
          const sentiment = item.snapshots?.sentiment ?? '';
          const whalePressure = item.snapshots?.whalePressure ?? '';
          const risk = item.snapshots?.risk ?? '';
          const updatedAt = item.snapshots?.updatedAt ?? '';
          return `${item.entityType},${item.entityId},"${item.label || ''}",${sentiment},${whalePressure},${risk},${updatedAt}`;
        })
      ];
      return csvRows.join('\n');
    }
    
    // Generic CSV for other data types
    return JSON.stringify(data, null, 2);
  };

  const getExportOptions = () => {
    switch (type) {
      case 'narrative':
        return [
          { label: 'PDF Report', format: 'pdf' as const, icon: FileText },
          { label: 'PNG Summary', format: 'png' as const, icon: Image },
        ];
      case 'watchlist':
        return [
          { label: 'CSV Export', format: 'csv' as const, icon: FileText },
          { label: 'PDF Report', format: 'pdf' as const, icon: FileText },
        ];
      case 'entity':
        return [
          { label: 'PDF Analysis', format: 'pdf' as const, icon: FileText },
          { label: 'PNG Chart', format: 'png' as const, icon: Image },
        ];
      case 'alerts':
        return [
          { label: 'CSV Rules', format: 'csv' as const, icon: FileText },
          { label: 'PDF Report', format: 'pdf' as const, icon: FileText },
        ];
      default:
        return [];
    }
  };

  const exportOptions = getExportOptions();

  if (exportOptions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className={cn("flex items-center gap-2", className)}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuItem
          onClick={() => {
            // Share functionality
            if (navigator.share) {
              navigator.share({
                title: `${type} Export`,
                text: `Check out this ${type} export from WhalePlus Hub 2`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
