import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Bell, Share, Bookmark, Plus, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface QuickActionsProps {
  walletAddress: string;
  onExport?: () => void;
  onAlert?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export function QuickActions({ 
  walletAddress, 
  onExport, 
  onAlert, 
  onShare, 
  onBookmark 
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col gap-2 mb-4 animate-in slide-in-from-bottom-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="rounded-full shadow-lg"
                onClick={onExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Export Report</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shadow-lg"
                onClick={onAlert}
              >
                <Bell className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Set Alert</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shadow-lg"
                onClick={onShare}
              >
                <Share className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Share Analysis</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shadow-lg"
                onClick={onBookmark}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Add to Watchlist</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Main toggle button */}
      <Button
        size="lg"
        className="rounded-full shadow-lg h-14 w-14"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}