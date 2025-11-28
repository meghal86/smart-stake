'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}

type RiskTodayProps = {
  riskIndex: number
  volatilityPct?: number
  activeWhales?: number
  source?: 'live' | 'cache'
  lastUpdated?: string
  showAnalyst?: boolean
  onToggleAnalyst?: (next: boolean) => void
  onOpenAlert?: () => void
  plan?: 'Lite' | 'Pro' | 'Institutional'
  theme?: 'light' | 'dark'
  trackEvent?: (name: string, props?: Record<string, unknown>) => void
  pulseOnNextRender?: boolean
}

export default function RiskToday({
  riskIndex,
  volatilityPct,
  activeWhales,
  source = 'live',
  lastUpdated,
  showAnalyst = false,
  onToggleAnalyst,
  onOpenAlert,
  plan = 'Lite',
  theme,
  trackEvent,
  pulseOnNextRender
}: RiskTodayProps) {
  const band = getBand(riskIndex)
  const color = bandColor(band)
  const helper = helperCopy(band)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const prevUpdated = usePrevious(lastUpdated)
  const prevRisk = usePrevious(riskIndex)

  useEffect(() => {
    trackEvent?.('risk_rendered', { riskIndex, band: band.key, source, lastUpdated, plan, theme })
  }, [riskIndex, band.key, source, lastUpdated, plan, theme, trackEvent])

  useEffect(() => {
    const gotNewData =
      (!!lastUpdated && lastUpdated !== prevUpdated) ||
      (prevRisk !== undefined && Math.round(prevRisk) !== Math.round(riskIndex))

    if ((gotNewData || pulseOnNextRender) && ringRef.current) {
      ringRef.current.classList.remove('ring-pulse')
      void ringRef.current.offsetWidth
      ringRef.current.classList.add('ring-pulse')

      trackEvent?.('risk_pulse_shown', {
        reason: pulseOnNextRender ? 'manual' : 'data_change',
        source,
        riskIndex,
        band: band.key,
        updatedAt: lastUpdated ?? null
      })
    }
  }, [riskIndex, lastUpdated, pulseOnNextRender, prevRisk, prevUpdated, source, band.key, trackEvent])

  const circumference = 2 * Math.PI * 28
  const progress = Math.min(100, Math.max(0, riskIndex))
  const dash = (progress / 100) * circumference
  const showCta = band.order >= 3

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border transition-colors duration-300',
        'bg-white border-slate-200 dark:bg-white/5 dark:border-white/10'
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-4 p-4">
        <div ref={ringRef} className="relative h-16 w-16 shrink-0 transition-transform will-change-transform" data-test="risk-ring">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-label={`Risk ring, ${band.label}`} role="img">
            <circle cx="32" cy="32" r="28" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="8" fill="none" />
            <circle
              cx="32" cy="32" r="28" strokeWidth="8" fill="none"
              className={cn('transition-all duration-500 ease-out', color?.ring)}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className={cn('text-sm font-semibold', color?.text)}>
              {band.label}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Risk Today</h3>
            {showAnalyst && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{riskIndex}/100</span>
            )}
            {onToggleAnalyst && (
              <button
                onClick={() => {
                  onToggleAnalyst(!showAnalyst)
                  trackEvent?.('risk_analyst_toggle', { to: !showAnalyst })
                }}
                className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted"
                aria-label="Toggle analyst mode"
              >
                {showAnalyst ? 'Hide score' : 'Show score'}
              </button>
            )}
          </div>

          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
            {helper}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {typeof activeWhales === 'number' && <span>Active Whales: <b className="font-medium">{activeWhales}</b></span>}
            {typeof volatilityPct === 'number' && <span>Volatility: <b className="font-medium">{volatilityPct}%</b></span>}
            <span className="inline-flex items-center gap-1">
              {source === 'live' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Cached</span>
              )}
              {lastUpdated && <span className="text-slate-400">• Last updated {formatTime(lastUpdated)}</span>}
            </span>
          </div>
        </div>

        {showCta && (
          <button
            onClick={() => {
              onOpenAlert?.()
              trackEvent?.('risk_do_next_clicked', { band: band.key, riskIndex, source })
            }}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
              color?.cta
            )}
            aria-label="Set price alert"
          >
            Set Price Alert
          </button>
        )}
      </div>
    </section>
  )
}

function getBand(v: number) {
  if (v >= 80) return { key: 'extreme', label: 'Extreme', order: 5 }
  if (v >= 60) return { key: 'high', label: 'High', order: 4 }
  if (v >= 40) return { key: 'caution', label: 'Caution', order: 3 }
  if (v >= 25) return { key: 'stable', label: 'Stable', order: 2 }
  return { key: 'calm', label: 'Calm', order: 1 }
}

function helperCopy(band: ReturnType<typeof getBand>) {
  switch (band.key) {
    case 'calm': return 'Calm seas — typical moves ±1–2%.'
    case 'stable': return 'Mostly steady — moves around ±2%.'
    case 'caution': return 'Choppy seas — prices may move ±2–4% today.'
    case 'high': return 'Rough seas — swings of ±4–7% are likely.'
    case 'extreme': return 'Storm risk — expect fast, large moves.'
  }
}

function bandColor(band: ReturnType<typeof getBand>) {
  switch (band.key) {
    case 'calm':
      return { ring: 'stroke-emerald-500', text: 'text-emerald-500', cta: 'bg-white text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20' }
    case 'stable':
      return { ring: 'stroke-teal-500', text: 'text-teal-500', cta: 'bg-white text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/20' }
    case 'caution':
      return { ring: 'stroke-amber-500', text: 'text-amber-500', cta: 'bg-amber-600 text-white hover:bg-amber-500' }
    case 'high':
      return { ring: 'stroke-orange-500', text: 'text-orange-500', cta: 'bg-orange-600 text-white hover:bg-orange-500' }
    case 'extreme':
      return { ring: 'stroke-rose-500', text: 'text-rose-500', cta: 'bg-rose-600 text-white hover:bg-rose-500' }
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  } catch {
    return 'recently'
  }
}
