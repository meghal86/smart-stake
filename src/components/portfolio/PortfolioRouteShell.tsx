'use client';

import { Link } from 'react-router-dom';
import { RefreshCw, Wallet } from 'lucide-react';
import { PortfolioExperienceShell } from './PortfolioExperienceShell';
import { usePortfolioRouteData } from '@/hooks/portfolio/usePortfolioRouteData';
import { Button } from '@/components/ui/button';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const surfaceClass =
  'rounded-[30px] border border-white/8 bg-[#0b0b0c] shadow-[0_22px_80px_rgba(0,0,0,0.28)]';

export function PortfolioRouteShell() {
  const {
    addresses,
    activeWalletId,
    setActiveWalletId,
    activeWallet,
    walletScopeLabel,
    actions,
    approvals,
    freshness,
    totalValue,
    dailyDelta,
    overallRiskScore,
    trustIndex,
    highRiskApprovals,
    chainExposure,
    topPositions,
    snapshot,
    isLoading,
    isDemo,
    invalidateAll,
  } = usePortfolioRouteData();

  return (
    <PortfolioExperienceShell
      title="Good morning, Meghal"
      subtitle={
        isDemo
          ? 'Demo mode is active. This view is intentionally using sample portfolio data.'
          : 'Live wallet scope, positions, approvals, and recommended actions in one portfolio surface.'
      }
      badge="Portfolio overview"
      guideContext={{
        screenLabel: 'Overview',
        walletScopeLabel,
        totalValue,
        dailyDelta,
        overallRiskScore,
        trustIndex,
        approvalsCount: approvals.length,
        highRiskApprovals,
        actionTitles: actions.map((action) => action.title),
        topPositions: topPositions.map((position) => ({ token: position.token, valueUsd: position.valueUsd })),
        isDemo,
      }}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => void invalidateAll()}
            className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link to="/portfolio/addresses">
            <Button className="rounded-full bg-[#f6f2ea] px-5 text-black hover:bg-white">
              <Wallet className="mr-2 h-4 w-4" />
              Review wallets
            </Button>
          </Link>
        </>
      }
      aside={
        <>
          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Wallet scope</p>
            <p
              className="mt-4 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              {activeWallet ? activeWallet.label || 'Selected wallet' : 'All wallets'}
            </p>
            <p className="mt-2 text-sm text-[#9c978f]">
              {activeWallet
                ? `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}`
                : 'Portfolio totals are aggregated across every saved wallet.'}
            </p>
            <select
              value={activeWalletId ?? 'all'}
              onChange={(event) => setActiveWalletId(event.target.value === 'all' ? null : event.target.value)}
              className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#f6f2ea] outline-none"
            >
              <option value="all">All wallets</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label || `${address.address.slice(0, 6)}...${address.address.slice(-4)}`}
                </option>
              ))}
            </select>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">At a glance</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-sm text-[#9c978f]">Wallets tracked</span>
                <span className="text-xl text-[#f6f2ea]">{addresses.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-sm text-[#9c978f]">High-risk approvals</span>
                <span className="text-xl text-[#f6f2ea]">{highRiskApprovals}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-sm text-[#9c978f]">Recommended actions</span>
                <span className="text-xl text-[#f6f2ea]">{actions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9c978f]">Freshness</span>
                <span className="text-sm text-[#f6f2ea]">
                  {freshness.freshnessSec ? `${Math.round(freshness.freshnessSec)}s` : 'Waiting'}
                </span>
              </div>
            </div>
          </section>
        </>
      }
    >
      <section className={`${surfaceClass} overflow-hidden`}>
        <div className="border-b border-white/8 px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Net worth</p>
        </div>
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="flex items-end gap-3">
              <p className="text-4xl tracking-tight text-[#f6f2ea] sm:text-5xl">{currency(totalValue)}</p>
              <p className={`pb-1 text-sm ${dailyDelta >= 0 ? 'text-[#8ec5a2]' : 'text-[#d98f8f]'}`}>
                {currency(dailyDelta)}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topPositions.length > 0 ? (
                topPositions.map((position) => (
                  <div key={position.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f8a82]">{position.symbol}</p>
                    <p className="mt-3 text-2xl text-[#f6f2ea]">{currency(position.valueUsd)}</p>
                    <p className="mt-2 text-sm text-[#9c978f]">
                      {position.protocol || 'Direct holding'} • chain {position.chainId}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[140px] items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.02] text-sm text-[#8f8a82] sm:col-span-2 xl:col-span-3">
                  {isLoading ? 'Loading positions' : 'No live positions found for this scope'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Risk score', value: `${(overallRiskScore * 10).toFixed(1)}/10` },
              { label: 'Trust index', value: `${trustIndex}%` },
              { label: 'Primary action', value: actions[0]?.title ?? 'No urgent action' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f8a82]">{item.label}</p>
                <p className="mt-3 text-2xl text-[#f6f2ea]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={`${surfaceClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Recommended actions</p>
              <p
                className="mt-3 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                What needs attention
              </p>
            </div>
            <Link to="/portfolio/risk" className="text-sm text-[#a7c0ff]">
              Open risk
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {actions.length > 0 ? (
              actions.slice(0, 4).map((action) => (
                <div key={action.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg text-[#f6f2ea]">{action.title}</p>
                      <p className="mt-2 text-sm text-[#9c978f]">{action.why?.[0] ?? 'Review this recommendation.'}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8f8a82]">
                      {action.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-[#9c978f]">
                {isLoading ? 'Loading actions' : 'No live actions available for this scope'}
              </div>
            )}
          </div>
        </section>

        <section className={`${surfaceClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Chain exposure</p>
              <p
                className="mt-3 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                Where the value sits
              </p>
            </div>
            <Link to="/portfolio/addresses" className="text-sm text-[#a7c0ff]">
              Review wallets
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#8f8a82]">
                Loading chain exposure
              </div>
            ) : chainExposure.length > 0 ? (
              chainExposure.slice(0, 5).map((row) => (
                <div key={row.chain} className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#f6f2ea]">{row.chain}</p>
                    <p className="text-sm text-[#f6f2ea]">{currency(row.value)}</p>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#7ea3f2]"
                      style={{ width: `${Math.min(100, totalValue > 0 ? (row.value / totalValue) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#8f8a82]">
                No chain exposure available yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={`${surfaceClass} p-6`} id="positions">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Positions</p>
            <p
              className="mt-3 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              Largest live holdings
            </p>
          </div>
          <span className="text-sm text-[#8f8a82]">{snapshot?.positions?.length ?? 0} tracked positions</span>
        </div>
        <div className="mt-6 space-y-3">
          {topPositions.length > 0 ? (
            topPositions.map((position) => (
              <div key={`${position.id}-detail`} className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div>
                  <p className="text-sm text-[#f6f2ea]">{position.token}</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">
                    {position.amount} {position.symbol} • {position.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#f6f2ea]">{currency(position.valueUsd)}</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">{position.protocol || 'Direct holding'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#8f8a82]">
              {isLoading ? 'Loading positions' : 'No live positions returned for this scope'}
            </div>
          )}
        </div>
      </section>

      <section className={`${surfaceClass} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Approval watch</p>
            <p
              className="mt-3 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              Approvals with live value at risk
            </p>
          </div>
          <Link to="/portfolio/guardian" className="text-sm text-[#a7c0ff]">
            Open Guardian
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {approvals.length > 0 ? (
            approvals.slice(0, 4).map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div>
                  <p className="text-sm text-[#f6f2ea]">{approval.token}</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">
                    {approval.spender.slice(0, 6)}...{approval.spender.slice(-4)} • {approval.severity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#f6f2ea]">{currency(approval.valueAtRisk)}</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">{approval.amount}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-[#8f8a82]">
              {isLoading ? 'Loading approvals' : 'No approvals returned for this wallet scope'}
            </div>
          )}
        </div>
        {snapshot?.lastUpdated ? (
          <p className="mt-4 text-xs text-[#8f8a82]">Last updated {new Date(snapshot.lastUpdated).toLocaleString()}</p>
        ) : null}
      </section>
    </PortfolioExperienceShell>
  );
}
