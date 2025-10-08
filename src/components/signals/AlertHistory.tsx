/**
 * AlertHistory - Recent events that would have triggered this alert
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AlertHistoryProps {
  asset: string;
  threshold: number;
}

export function AlertHistory({ asset, threshold }: AlertHistoryProps) {
  // Generate mock historical events
  const historicalEvents = Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
    amount: threshold + Math.random() * threshold * 0.5,
    direction: Math.random() > 0.5 ? 'inflow' : 'outflow',
    outcome: Math.random() > 0.3 ? 'positive' : 'negative',
    priceChange: (Math.random() - 0.5) * 8
  }));

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}B`;
    return `$${amount.toFixed(0)}M`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Recent Matches
          </h4>
        </div>
        
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Events that would have triggered this alert
        </div>

        <div className="space-y-2">
          {historicalEvents.map((event, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {formatAmount(event.amount)} {event.direction}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {event.date.toLocaleDateString()}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-medium ${
                  event.priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {event.priceChange >= 0 ? '+' : ''}{event.priceChange.toFixed(1)}%
                </div>
                <Badge className={`text-xs ${
                  event.outcome === 'positive' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {event.outcome}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>Success Rate</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {Math.round(historicalEvents.filter(e => e.outcome === 'positive').length / historicalEvents.length * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}