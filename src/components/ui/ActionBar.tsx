/**
 * ActionBar - P0 Standardized Action Bar Component
 * Consistent layout: Create Alert (left), Explain (right), uniform spacing
 */

import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, BarChart3 } from 'lucide-react';

interface ActionBarProps {
  onCreateAlert: () => void;
  onExplain: () => void;
  onViewPattern?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ActionBar({ 
  onCreateAlert, 
  onExplain, 
  onViewPattern, 
  disabled = false,
  size = 'sm' 
}: ActionBarProps) {
  return (
    <div 
      className="flex gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-700"
      role="toolbar"
      aria-label="Signal actions"
    >
      <Button
        size={size}
        onClick={onCreateAlert}
        disabled={disabled}
        className="flex-1 bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
        aria-label="Create alert for this signal"
      >
        <Bell className="h-3 w-3 mr-1" />
        Create Alert
      </Button>
      
      {onViewPattern && (
        <Button
          size={size}
          variant="outline"
          onClick={onViewPattern}
          disabled={disabled}
          className="flex-1"
          aria-label="View pattern analysis"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Pattern
        </Button>
      )}
      
      <Button
        size={size}
        variant="outline"
        onClick={onExplain}
        disabled={disabled}
        aria-label="Explain this signal"
      >
        <MessageCircle className="h-3 w-3 mr-1" />
        Explain
      </Button>
    </div>
  );
}