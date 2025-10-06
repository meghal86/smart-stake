'use client'
import { useEffect, useState } from 'react'
import { Plan } from '@/lib/featureFlags'
import { supabase } from '@/integrations/supabase/client'

type DigestItem = {
  id: string
  event_time: string
  asset: string
  summary: string
  severity: number
}

export default function DigestCard() {
  const [items, setItems] = useState<DigestItem[]>([])
  const [plan, setPlan] = useState<Plan>('LITE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.functions.invoke('whale-alerts').then(({ data, error }) => {
      if (error) {
        console.error('❌ Whale Alert API failed:', error)
        setError(error.message)
        return
      }
      if (!data?.transactions) {
        setError('No whale data received')
        return
      }
      const transformed = data.transactions.slice(0, 5).map((tx: any) => ({
        id: `${tx.hash || tx.id}-${tx.timestamp}`,
        event_time: new Date(tx.timestamp * 1000).toISOString(),
        asset: tx.symbol,
        summary: `${tx.amount?.toFixed(2)} ${tx.symbol} → ${tx.to?.owner_type || 'Unknown'}`,
        severity: tx.amount_usd > 10000000 ? 5 : tx.amount_usd > 5000000 ? 4 : 3
      }))
      setItems(transformed)
      setError(null)
    })
  }, [])

  const severityColors = {
    1: 'text-green-400',
    2: 'text-yellow-400', 
    3: 'text-orange-400',
    4: 'text-red-400',
    5: 'text-red-500'
  }

  const isLite = plan === 'LITE'

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow">
      <h2 className="text-xl font-semibold text-white mb-4">🐋 Daily Whale Digest</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800">
            <div className={`text-sm font-bold ${severityColors[item.severity as keyof typeof severityColors]}`}>
              {item.severity}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-teal-400">{item.asset}</span>
              </div>
              <p className="text-sm text-slate-300">{item.summary}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(item.event_time).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded">
          <p className="text-red-500 text-sm font-semibold">⚠️ Live Data Error</p>
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {isLite && !error && (
        <div className="mt-4 text-right">
          <button
            className="text-sm text-teal-400 underline hover:text-teal-300"
            onClick={() => alert('Pro only — Upgrade to see the full digest.')}
          >
            See All → Pro
          </button>
        </div>
      )}
    </div>
  )
}