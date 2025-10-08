/**
 * PatternActions - One-tap actions with Robinhood-level simplicity
 */

import { Button } from '@/components/ui/button';
import { Bell, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface PatternActionsProps {
  signal: Signal;
  onCreateAlert: () => void;
  onShare: () => void;
  onExplain: () => void;
}

export function PatternActions({ signal, onCreateAlert, onShare, onExplain }: PatternActionsProps) {
  return (
    <div className="space-y-3">
      {/* Primary Action */}
      <Button
        onClick={onCreateAlert}
        className="w-full bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
      >
        <Bell className="h-4 w-4 mr-2" />
        Create Alert for Pattern
      </Button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-3 w-3" />
          Share Chart
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExplain}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-3 w-3" />
          Explain
        </Button>
      </div>

      {/* Quick Links */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Quick Actions</div>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-slate-700 dark:text-slate-300 hover:text-[var(--brand-teal,#14B8A6)] transition-colors p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
            View similar {signal.asset} patterns
          </button>
          <button className="w-full text-left text-xs text-slate-700 dark:text-slate-300 hover:text-[var(--brand-teal,#14B8A6)] transition-colors p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
            Set up portfolio alerts
          </button>
          <button className="w-full text-left text-xs text-slate-700 dark:text-slate-300 hover:text-[var(--brand-teal,#14B8A6)] transition-colors p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1">
            Open in advanced view
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}