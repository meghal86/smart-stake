/**
 * AI Coaching Bottom Sheet: Explain | What Changed | Do Next
 */

'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Signal, SignalInsight } from '@/types/signal';
import { trackEvent } from '@/lib/telemetry';
import { Bell, TrendingUp, AlertCircle } from 'lucide-react';

interface SignalInsightSheetProps {
  signal: Signal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignalInsightSheet({ signal, open, onOpenChange }: SignalInsightSheetProps) {
  const [insight, setInsight] = useState<SignalInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('explain');

  useEffect(() => {
    if (!signal || !open) return;

    setIsLoading(true);
    setError(null);

    // Generate mock insight based on signal data
    setTimeout(() => {
      const mockInsight: SignalInsight = {
        id: `insight_${signal.id}`,
        signalId: signal.id,
        explanation: `Large ${signal.asset} ${signal.direction} detected. This ${signal.amountUsd > 10000000 ? 'mega whale' : 'whale'} movement of $${(signal.amountUsd / 1e6).toFixed(1)}M suggests ${signal.direction === 'outflow' ? 'potential selling pressure or cold storage movement' : 'accumulation behavior and reduced selling pressure'}.`,
        whatChanged: `${signal.asset} ${signal.direction === 'outflow' ? 'reserves decreased' : 'reserves increased'} by $${(signal.amountUsd / 1e6).toFixed(1)}M. Historical data shows similar movements preceded ${signal.direction === 'outflow' ? 'price volatility' : '7-14 day price increases'} in ${Math.floor(Math.random() * 30 + 60)}% of cases.`,
        doNext: [
          {
            title: 'Create Price Alert',
            description: `Get notified if ${signal.asset} price moves ±5% in next 24h`,
            action: 'create_alert',
            actionData: { asset: signal.asset, threshold: 5 },
          },
          {
            title: 'Follow This Pattern',
            description: `Track similar whale movements for ${signal.asset}`,
            action: 'follow_pattern',
            actionData: { pattern: signal.direction },
          },
        ],
        generatedAt: new Date().toISOString(),
        cached: false,
      };
      
      setInsight(mockInsight);
      setIsLoading(false);
      
      trackEvent('signal_explain_opened', {
        id: signal.id,
        type: signal.direction,
        cached: false,
      });
    }, 500);
  }, [signal, open]);

  const handleDoNextClick = (action: string) => {
    trackEvent('signal_do_next_clicked', {
      id: signal?.id,
      action,
    });

    if (action === 'create_alert') {
      // Open alert creation modal
    } else if (action === 'follow_pattern') {
      trackEvent('signal_follow_pattern_clicked', {
        id: signal?.id,
      });
      // Open pattern following flow
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setActiveTab('explain');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {signal?.asset} {signal?.direction}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explain">Explain</TabsTrigger>
            <TabsTrigger value="changed">What Changed</TabsTrigger>
            <TabsTrigger value="next">Do Next</TabsTrigger>
          </TabsList>

          <TabsContent value="explain" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            ) : insight ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>{insight.explanation}</p>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="changed" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : insight ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>{insight.whatChanged}</p>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="next" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : insight ? (
              <div className="space-y-3">
                {insight.doNext.map((action, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {action.action === 'create_alert' && (
                          <Bell className="h-4 w-4 text-primary" />
                        )}
                        {action.action === 'follow_pattern' && (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        )}
                        <h4 className="font-medium">{action.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleDoNextClick(action.action)}
                    >
                      {action.action === 'create_alert' && 'Create Alert'}
                      {action.action === 'follow_pattern' && 'Follow Pattern'}
                      {action.action === 'view_details' && 'View Details'}
                      {action.action === 'custom' && 'Take Action'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
