import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bell,
  Clock3,
  Database,
  Radio,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { ExplainModal } from '@/components/signals/ExplainModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

type SignalTab = 'top' | 'all' | 'raw';
type FilterKey = 'all' | 'large' | 'exchanges' | 'live';

const tabOptions: Array<{ id: SignalTab; label: string }> = [
  { id: 'top', label: 'Top flows' },
  { id: 'all', label: 'All signals' },
  { id: 'raw', label: 'Raw ledger' },
];

const filterOptions: Array<{ id: FilterKey; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'large', label: 'Large moves' },
  { id: 'exchanges', label: 'Exchange flow' },
  { id: 'live', label: 'Live only' },
];

const formatUsd = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatTimeAgo = (timestamp: string) => {
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getRiskTone = (risk: Signal['risk']) => {
  if (risk === 'critical') return 'text-[#e7b0b0] border-[#e7b0b0]/20 bg-[#e7b0b0]/8';
  if (risk === 'high') return 'text-[#d6c08d] border-[#d6c08d]/20 bg-[#d6c08d]/8';
  if (risk === 'medium') return 'text-[#a7c0ff] border-[#a7c0ff]/20 bg-[#a7c0ff]/8';
  return 'text-[#b9d5c0] border-[#b9d5c0]/20 bg-[#b9d5c0]/8';
};

const getDirectionLabel = (signal: Signal) => {
  if (signal.direction === 'outflow' || signal.direction === 'distribution') return 'Distribution';
  if (signal.direction === 'neutral') return 'Neutral';
  return 'Accumulation';
};

export default function SignalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SignalTab) || 'top';

  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;

    const fetchSignals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        try {
          const { data, error: functionError } = await supabase.functions.invoke('whale-alerts');
          if (!functionError && data?.transactions && !cancelled) {
            const transformedSignals: Signal[] = data.transactions.map((tx: Record<string, unknown>, index: number) => ({
              id: String(tx.hash || `signal_${index}_${Date.now()}`),
              asset: String(tx.symbol || 'ETH').toUpperCase(),
              direction: tx.from && typeof tx.from === 'object' && (tx.from as { owner_type?: string }).owner_type === 'exchange'
                ? 'outflow'
                : 'inflow',
              amountUsd: Number(tx.amount_usd || tx.amount) || 0,
              timestamp: new Date(
                typeof tx.timestamp === 'number'
                  ? tx.timestamp * 1000
                  : Date.now() - Math.random() * 3_600_000
              ).toISOString(),
              ownerType: 'whale',
              source: 'whale_alert',
              risk: Number(tx.amount_usd || 0) > 10_000_000 ? 'high' : Number(tx.amount_usd || 0) > 5_000_000 ? 'medium' : 'low',
              isLive: true,
              reason: `Large ${String(tx.symbol || 'ETH').toUpperCase()} movement detected`,
              impactScore: Math.log(Number(tx.amount_usd || 1_000_000)) * (Number(tx.amount_usd || 0) > 10_000_000 ? 1.5 : 1),
              txHash: typeof tx.hash === 'string' ? tx.hash : undefined,
            }));

            setSignals(transformedSignals);
            setIsConnected(true);
            setLastRefresh(new Date());
            return;
          }
        } catch (invokeError) {
          console.warn('whale-alerts function unavailable, falling back to cached digest', invokeError);
        }

        const { data: digestData, error: digestError } = await supabase
          .from('whale_digest')
          .select('*')
          .order('event_time', { ascending: false })
          .limit(80);

        if (digestError) {
          throw digestError;
        }

        if (!cancelled) {
          const transformedSignals: Signal[] = (digestData || []).map((item: Record<string, unknown>) => ({
            id: String(item.id),
            asset: String(item.asset || 'ETH'),
            direction: Number(item.severity || 0) > 3 ? 'outflow' : 'inflow',
            amountUsd: Number(item.amount_usd || 0),
            timestamp: String(item.event_time || new Date().toISOString()),
            ownerType: 'whale',
            source: String(item.source || 'digest'),
            risk: Number(item.severity || 0) > 4 ? 'high' : 'medium',
            isLive: false,
            reason: String(item.summary || 'Whale flow recorded'),
            impactScore: Math.log(Number(item.amount_usd || 1_000_000)) * (Number(item.severity || 0) > 3 ? 1.5 : 1),
          }));

          setSignals(transformedSignals);
          setIsConnected(false);
          setLastRefresh(new Date());
        }
      } catch (fetchError) {
        console.error('Failed to fetch signals:', fetchError);
        if (!cancelled) {
          setError('Unable to load the signal desk right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSignals();
    const interval = window.setInterval(fetchSignals, 120_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      if (activeFilter === 'large' && signal.amountUsd < 10_000_000) return false;
      if (activeFilter === 'exchanges' && signal.direction !== 'outflow') return false;
      if (activeFilter === 'live' && !signal.isLive) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        signal.asset.toLowerCase().includes(query) ||
        signal.source.toLowerCase().includes(query) ||
        (signal.reason || '').toLowerCase().includes(query)
      );
    });
  }, [activeFilter, searchQuery, signals]);

  const topSignals = useMemo(
    () =>
      [...filteredSignals]
        .sort((a, b) => (b.impactScore || b.amountUsd) - (a.impactScore || a.amountUsd))
        .slice(0, 8),
    [filteredSignals],
  );

  const totalVolume = filteredSignals.reduce((sum, signal) => sum + signal.amountUsd, 0);
  const inflowVolume = filteredSignals
    .filter((signal) => signal.direction === 'inflow' || signal.direction === 'accumulation')
    .reduce((sum, signal) => sum + signal.amountUsd, 0);
  const outflowVolume = filteredSignals
    .filter((signal) => signal.direction === 'outflow' || signal.direction === 'distribution')
    .reduce((sum, signal) => sum + signal.amountUsd, 0);
  const criticalCount = filteredSignals.filter((signal) => signal.risk === 'high' || signal.risk === 'critical').length;

  const displayedSignals = activeTab === 'top' ? topSignals : filteredSignals;

  const openExplain = (signal: Signal) => {
    setSelectedSignal(signal);
    setExplainModalOpen(true);
    trackEvent('explain_modal_opened', {
      id: signal.id,
      source: 'signals_feed_origin_shell',
    });
  };

  const handleCreateAlert = () => {
    if (!selectedSignal) return;
    trackEvent('alert_created', {
      id: selectedSignal.id,
      asset: selectedSignal.asset,
      source: 'signals_feed_origin_shell',
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f6f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_35%)]" />
      <GlobalHeader className="border-white/8 bg-[#050505]/94" />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
              Signal desk
            </div>
            <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">Live flow across every watched wallet</h1>
            <p className="mt-2 text-sm text-[#9c978f] sm:text-base">
              A cleaner read on inflows, exchange exits, and large movements without dropping you back into the older signal UI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/cockpit')}
              className="border-white/10 bg-white/[0.03] text-[#f6f2ea] hover:bg-white/[0.06]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to cockpit
            </Button>
            <Button
              variant="outline"
              onClick={() => trackEvent('signals_alert_create_clicked', { source: 'signals_header' })}
              className="border-white/10 bg-white/[0.03] text-[#f6f2ea] hover:bg-white/[0.06]"
            >
              <Bell className="mr-2 h-4 w-4" />
              Create alert
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Tracked volume</p>
                    <p className="mt-3 text-3xl text-[#f6f2ea]" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                      {formatUsd(totalVolume)}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Net direction</p>
                    <p className="mt-3 flex items-center gap-2 text-2xl text-[#f6f2ea]">
                      {inflowVolume >= outflowVolume ? (
                        <TrendingUp className="h-5 w-5 text-[#b9d5c0]" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-[#e7b0b0]" />
                      )}
                      {formatUsd(Math.abs(inflowVolume - outflowVolume))}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">High priority</p>
                    <p className="mt-3 text-3xl text-[#f6f2ea]" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                      {criticalCount}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:max-w-[320px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a82]" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search asset, source, or narrative"
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.03] pl-9 text-[#f6f2ea] placeholder:text-[#7f7a72]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tabOptions.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          activeTab === tab.id
                            ? 'border-white/12 bg-white/[0.08] text-[#f6f2ea]'
                            : 'border-white/8 bg-white/[0.03] text-[#9c978f] hover:bg-white/[0.05]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">
                    {activeTab === 'top' ? 'Priority signal stack' : activeTab === 'all' ? 'Complete signal stream' : 'Raw ledger view'}
                  </p>
                  <p className="mt-2 text-sm text-[#9c978f]">
                    {displayedSignals.length} entries after current filters
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        activeFilter === filter.id
                          ? 'border-white/12 bg-white/[0.08] text-[#f6f2ea]'
                          : 'border-white/8 bg-white/[0.03] text-[#9c978f] hover:bg-white/[0.05]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[28px] border border-white/8 bg-white/[0.02] p-5 animate-pulse">
                      <div className="h-4 w-24 rounded bg-white/10" />
                      <div className="mt-4 h-8 w-40 rounded bg-white/10" />
                      <div className="mt-3 h-4 w-full rounded bg-white/10" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[28px] border border-[#e7b0b0]/20 bg-[#e7b0b0]/8 p-6 text-[#f1d6d6]">
                  {error}
                </div>
              ) : displayedSignals.length === 0 ? (
                <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-10 text-center">
                  <Activity className="mx-auto h-10 w-10 text-[#8f8a82]" />
                  <p className="mt-4 text-lg text-[#f6f2ea]">No signals match the current view</p>
                  <p className="mt-2 text-sm text-[#9c978f]">Clear the filter or search query to widen the desk.</p>
                </div>
              ) : activeTab === 'raw' ? (
                <div className="overflow-hidden rounded-[28px] border border-white/8">
                  <div className="hidden grid-cols-[120px_1fr_120px_120px_110px] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[#8f8a82] md:grid">
                    <span>Asset</span>
                    <span>Reason</span>
                    <span>Direction</span>
                    <span>Amount</span>
                    <span>Time</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {displayedSignals.slice(0, 24).map((signal) => (
                      <button
                        key={signal.id}
                        type="button"
                        onClick={() => openExplain(signal)}
                        className="grid w-full gap-3 bg-transparent px-4 py-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[120px_1fr_120px_120px_110px] md:items-center"
                      >
                        <span className="text-sm text-[#f6f2ea]">{signal.asset}</span>
                        <span className="text-sm text-[#b8b2a7]">{signal.reason || 'Whale flow recorded'}</span>
                        <span className="text-sm text-[#9c978f]">{getDirectionLabel(signal)}</span>
                        <span className="text-sm text-[#f6f2ea]">{formatUsd(signal.amountUsd)}</span>
                        <span className="text-sm text-[#8f8a82]">{formatTimeAgo(signal.timestamp)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {displayedSignals.map((signal) => (
                    <button
                      key={signal.id}
                      type="button"
                      onClick={() => openExplain(signal)}
                      className="rounded-[28px] border border-white/8 bg-white/[0.02] p-5 text-left transition hover:border-white/14 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">{signal.source.replace(/_/g, ' ')}</span>
                            {signal.isLive && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#b9d5c0]/20 bg-[#b9d5c0]/8 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#b9d5c0]">
                                <Radio className="h-3 w-3" />
                                Live
                              </span>
                            )}
                          </div>
                          <h3
                            className="mt-4 text-3xl text-[#f6f2ea]"
                            style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                          >
                            {signal.asset}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[#b8b2a7]">
                            {signal.reason || 'Whale flow recorded'}.
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${getRiskTone(signal.risk)}`}>
                          {signal.risk}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[20px] border border-white/8 bg-[#050505] p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f8a82]">Move</p>
                          <p className="mt-2 text-lg text-[#f6f2ea]">{formatUsd(signal.amountUsd)}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/8 bg-[#050505] p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f8a82]">Direction</p>
                          <p className="mt-2 text-lg text-[#f6f2ea]">{getDirectionLabel(signal)}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/8 bg-[#050505] p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f8a82]">Freshness</p>
                          <p className="mt-2 text-lg text-[#f6f2ea]">{formatTimeAgo(signal.timestamp)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Feed status</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="flex items-center gap-2 text-sm text-[#9c978f]">
                    <Radio className={`h-4 w-4 ${isConnected ? 'text-[#b9d5c0]' : 'text-[#d6c08d]'}`} />
                    Provider
                  </span>
                  <span className="text-sm text-[#f6f2ea]">{isConnected ? 'Live' : 'Cached'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="flex items-center gap-2 text-sm text-[#9c978f]">
                    <Clock3 className="h-4 w-4 text-[#8f8a82]" />
                    Last refresh
                  </span>
                  <span className="text-sm text-[#f6f2ea]">{formatTimeAgo(lastRefresh.toISOString())}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-[#9c978f]">
                    <Database className="h-4 w-4 text-[#8f8a82]" />
                    Rows in view
                  </span>
                  <span className="text-sm text-[#f6f2ea]">{displayedSignals.length}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#b7c8f0]">Narrative read</p>
              <p
                className="mt-4 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {inflowVolume >= outflowVolume ? 'Accumulation bias' : 'Distribution bias'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#d8dde8]">
                {inflowVolume >= outflowVolume
                  ? 'Tracked wallets are leaning into inflow and custody accumulation.'
                  : 'More size is rotating out toward exchanges and liquid venues.'}
              </p>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Why it matters</p>
              <div className="mt-4 space-y-4 text-sm text-[#b8b2a7]">
                <div className="flex gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-[#d6c08d]" />
                  <p>Guardian and Hunter decisions should be made off the same live flow, not a disconnected older signals page.</p>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-[#a7c0ff]" />
                  <p>This desk now keeps the same visual system as cockpit, portfolio, harvest, and hunter.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <ExplainModal
        signal={selectedSignal}
        open={explainModalOpen}
        onOpenChange={setExplainModalOpen}
        onCreateAlert={handleCreateAlert}
      />

      <FooterNav currentRoute="/signals" />
    </div>
  );
}
