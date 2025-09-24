import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Heart, 
  Share2, 
  Download,
  X 
} from 'lucide-react';

interface BottomActionBarProps {
  selectedEntity: any;
  onClose: () => void;
  onTrade?: () => void;
  onWatchlist?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  isPro?: boolean;
}

export function BottomActionBar({
  selectedEntity,
  onClose,
  onTrade,
  onWatchlist,
  onShare,
  onExport,
  isPro = false
}: BottomActionBarProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  if (!selectedEntity) return null;

  const handleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    onWatchlist?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Whale Alert: ${selectedEntity.type}`,
        text: `Check out this whale activity`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
    onShare?.();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-inset-bottom lg:hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {selectedEntity.type === 'alert' ? 'Alert Selected' : 'Whale Selected'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {selectedEntity.address || selectedEntity.id}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        {/* Trade/Hedge Button */}
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={onTrade}
          disabled={!onTrade}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trade
        </Button>

        {/* Watchlist Button */}
        <Button 
          variant={isWatchlisted ? "default" : "outline"} 
          size="sm"
          onClick={handleWatchlist}
        >
          <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
        </Button>

        {/* Share Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>

        {/* Export Button (Pro only) */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onExport}
          disabled={!isPro}
          className="relative"
        >
          <Download className="w-4 h-4" />
          {!isPro && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 text-xs px-1"
            >
              Pro
            </Badge>
          )}
        </Button>
      </div>

      {!isPro && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Upgrade to Pro for export features
        </p>
      )}
    </div>
  );
}