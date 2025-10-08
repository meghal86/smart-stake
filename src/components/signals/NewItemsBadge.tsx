/**
 * New Items Badge - Shows "New (12)" pill and pauses auto-scroll
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';

interface NewItemsBadgeProps {
  count: number;
  onViewNew: () => void;
  className?: string;
}

export function NewItemsBadge({ count, onViewNew, className = '' }: NewItemsBadgeProps) {
  if (count === 0) return null;

  const handleClick = () => {
    trackEvent('new_items_seen', { count });
    onViewNew();
  };

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-20 ${className}`}>
      <Button
        onClick={handleClick}
        className="bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
        size="sm"
      >
        <ArrowUp className="h-4 w-4 mr-1" />
        New
        <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
          {count}
        </Badge>
      </Button>
    </div>
  );
}