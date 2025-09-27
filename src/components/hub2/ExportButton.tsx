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
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would generate the actual file
      const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Create a mock download
      const blob = new Blob([`Mock ${format.toUpperCase()} export for ${type}`], { 
        type: format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
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
