import type { ComponentType } from 'react';
import { AlertTriangle, Bell, DollarSign, Activity, Fish } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface KpiSummaryProps {
  volume24h: number;
  activeWhales: number;
  riskAlerts: number;
  avgRiskScore: number;
  loading?: boolean;
  volumeDelta?: number;
  whalesDelta?: number;
  riskAlertsDelta?: number;
  riskScoreDelta?: number;
  onCreateAlert?: (context: any) => void;
  onCardClick?: (type: string) => void;
}

type DeltaDescriptor = {
  text: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
};

type KpiCard = {
  id: string;
  label: string;
  shortLabel: string;
  value: string;
  delta: DeltaDescriptor;
  icon: ComponentType<{ className?: string }>;
  accentText: string;
  accentRing: string;
  accentCard: string;
  description: string;
};

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1
});

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const fullNumber = new Intl.NumberFormat('en-US');

const formatDelta = (delta: number): DeltaDescriptor => {
  if (!Number.isFinite(delta)) {
    return { text: '—', color: 'text-muted-foreground', trend: 'flat' };
  }
  if (delta > 0) {
    return { text: `+${delta.toFixed(1)}%`, color: 'text-emerald-500', trend: 'up' };
  }
  if (delta < 0) {
    return { text: `${delta.toFixed(1)}%`, color: 'text-red-500', trend: 'down' };
  }
  return { text: '0.0%', color: 'text-muted-foreground', trend: 'flat' };
};

export function KpiSummary({
  volume24h,
  activeWhales,
  riskAlerts,
  avgRiskScore,
  loading,
  volumeDelta = 0,
  whalesDelta = 0,
  riskAlertsDelta = 0,
  riskScoreDelta = 0,
  onCreateAlert,
  onCardClick
}: KpiSummaryProps) {
  const { track } = useAnalytics();
  const isMobile = useIsMobile();
  const showAllCards = !isMobile;

  const riskTone = avgRiskScore >= 70
    ? {
        accentText: 'text-red-600',
        accentRing: 'bg-red-500/15',
        accentCard: 'ring-1 ring-inset ring-red-200/70 hover:ring-red-300/80 shadow-[0_18px_48px_-26px_rgba(248,113,113,0.75)]',
        badgeBg: 'bg-red-500/10',
        badgeText: 'text-red-600'
      }
    : avgRiskScore >= 40
      ? {
          accentText: 'text-amber-600',
          accentRing: 'bg-amber-500/15',
          accentCard: 'ring-1 ring-inset ring-amber-200/70 hover:ring-amber-300/80 shadow-[0_18px_48px_-26px_rgba(245,158,11,0.55)]',
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-600'
        }
      : {
          accentText: 'text-emerald-600',
          accentRing: 'bg-emerald-500/15',
          accentCard: 'ring-1 ring-inset ring-emerald-200/70 hover:ring-emerald-300/80 shadow-[0_18px_48px_-26px_rgba(16,185,129,0.55)]',
          badgeBg: 'bg-emerald-500/10',
          badgeText: 'text-emerald-600'
        };

  const cards: KpiCard[] = [
    {
      id: 'volume',
      label: '24h Volume',
      shortLabel: 'Volume',
      value: compactCurrency.format(volume24h),
      delta: formatDelta(volumeDelta),
      icon: DollarSign,
      accentText: 'text-emerald-600',
      accentRing: 'bg-emerald-500/15',
      accentCard: 'ring-1 ring-inset ring-emerald-200/70 hover:ring-emerald-300/80 shadow-[0_18px_48px_-26px_rgba(16,185,129,0.55)]',
      description: 'Cross-venue liquidity'
    },
    {
      id: 'whales',
      label: 'Active Whales',
      shortLabel: 'Whales',
      value: isMobile ? compactNumber.format(activeWhales) : fullNumber.format(activeWhales),
      delta: formatDelta(whalesDelta),
      icon: Fish,
      accentText: 'text-sky-600',
      accentRing: 'bg-sky-500/15',
      accentCard: 'ring-1 ring-inset ring-sky-200/70 hover:ring-sky-300/80 shadow-[0_18px_48px_-26px_rgba(14,165,233,0.45)]',
      description: 'Addresses > $1M tracked'
    },
    {
      id: 'risk',
      label: 'Risk Alerts',
      shortLabel: 'Alerts',
      value: fullNumber.format(riskAlerts),
      delta: formatDelta(riskAlertsDelta),
      icon: AlertTriangle,
      accentText: 'text-amber-600',
      accentRing: 'bg-amber-500/15',
      accentCard: 'ring-1 ring-inset ring-amber-200/70 hover:ring-amber-300/80 shadow-[0_18px_48px_-26px_rgba(245,158,11,0.55)]',
      description: 'Triggered last 24h'
    },
    {
      id: 'score',
      label: 'Risk Score',
      shortLabel: 'Risk',
      value: avgRiskScore.toFixed(0),
      delta: formatDelta(riskScoreDelta),
      icon: Activity,
      accentText: riskTone.accentText,
      accentRing: riskTone.accentRing,
      accentCard: riskTone.accentCard,
      description: 'Composite risk index'
    }
  ];

  const cardsToRender = showAllCards ? cards : cards.filter(card => card.id !== 'score');
  const mobileRiskSummary: DeltaDescriptor = formatDelta(riskScoreDelta);

  const gridClasses = cn(
    'grid gap-2 sm:gap-3 lg:gap-4',
    'grid-cols-1 sm:grid-cols-2',
    showAllCards ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3'
  );

  if (loading) {
    const skeletonCount = cardsToRender.length || (showAllCards ? 4 : 3);
    return (
      <div className={gridClasses} aria-hidden>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={`kpi-skeleton-${index}`} className="rounded-2xl border border-border/50 bg-card/60 p-4 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-6 w-24" />
            <Skeleton className="mt-2 h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const handleCardClick = (cardId: string) => {
    track('kpi_card_clicked', { cardId, currentTab: 'market' });
    onCardClick?.(cardId);
  };

  const handleAlertClick = (cardId: string, title: string, value: string) => {
    track('kpi_alert_clicked', { cardId, title });
    onCreateAlert?.({
      type: cardId,
      metric: title,
      threshold: value
    });
  };

  return (
    <div className={gridClasses} role="list">
      {cardsToRender.map((card) => {
        const Icon = card.icon;
        const title = isMobile ? card.shortLabel : card.label;

        return (
          <Card
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(card.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCardClick(card.id);
              }
            }}
            className={cn(
              'group relative flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/95 p-3 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-border/60 dark:bg-card/80',
              'hover:-translate-y-0.5 focus-visible:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)] sm:p-4',
              card.accentCard
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={cn('rounded-xl p-2 transition-colors duration-200', card.accentRing, card.accentText)}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                    {title}
                  </span>
                  <span className={cn('text-lg font-semibold sm:text-xl xl:text-2xl', card.accentText)}>
                    {card.value}
                  </span>
                </div>
              </div>

              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAlertClick(card.id, card.label, card.value);
                      }}
                      aria-label={`Create alert for ${card.label}`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="text-xs font-medium">Create alert</span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className={cn('font-medium', card.delta.color)}>{card.delta.text}</span>
              <span className="text-muted-foreground">vs prior 24h</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground sm:text-xs">
              <span>{card.description}</span>
              {card.id === 'risk' && !showAllCards && (
                <Tooltip>
                  <TooltipTrigger className="font-medium text-foreground underline underline-offset-2">
                    Risk {avgRiskScore.toFixed(0)}
                  </TooltipTrigger>
                  <TooltipContent className="space-y-1 text-xs">
                    <p className="font-medium">Composite risk score</p>
                    <p className={mobileRiskSummary.color}>{mobileRiskSummary.text}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {card.id === 'risk' && showAllCards && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                    riskTone.badgeBg,
                    riskTone.badgeText
                  )}
                >
                  Risk {avgRiskScore.toFixed(0)}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
