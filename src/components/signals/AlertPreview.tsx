/**
 * AlertPreview - Live preview of alert configuration
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface AlertPreviewProps {
  formData: {
    asset: string;
    direction: 'inflow' | 'outflow';
    threshold: string;
    timeframe: string;
    pushEnabled: boolean;
    emailEnabled: boolean;
    customMessage: string;
  };
  signal: Signal;
}

export function AlertPreview({ formData, signal }: AlertPreviewProps) {
  const formatAmount = (amount: string) => {
    const num = Number(amount);
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}B`;
    return `$${num}M`;
  };

  const mockNotification = {
    title: `🐋 ${formData.asset} Whale Alert`,
    message: formData.customMessage || `Large ${formData.direction} detected: ${formatAmount(formData.threshold)} to ${formData.direction === 'outflow' ? 'exchange' : 'cold storage'}`,
    time: 'Just now'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
          Alert Preview
        </h4>
        
        {/* Mobile Notification Preview */}
        <div className="bg-slate-900 rounded-lg p-3 mb-4">
          <div className="bg-slate-800 rounded-lg p-3 border-l-2 border-[var(--brand-teal,#14B8A6)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[var(--brand-teal,#14B8A6)] rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm mb-1">
                  {mockNotification.title}
                </div>
                <div className="text-slate-300 text-xs leading-relaxed">
                  {mockNotification.message}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {mockNotification.time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Configuration Summary */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Trigger Condition</span>
            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {formData.asset} {formData.direction} &gt; {formatAmount(formData.threshold)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Time Window</span>
            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {formData.timeframe}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Delivery Method</span>
            <div className="flex gap-1">
              {formData.pushEnabled && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                  Push
                </Badge>
              )}
              {formData.emailEnabled && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                  Email
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Alert will be active in ~30 seconds after creation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}