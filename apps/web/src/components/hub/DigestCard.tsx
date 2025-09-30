'use client'
import { useEffect, useState } from 'react'
import { Plan } from '@/lib/featureFlags'

type DigestItem = {
  id: number
  event_time: string
  asset: string
  summary: string
  severity: number
}

export default function DigestCard() {
  const [items, setItems] = useState<DigestItem[]>([])
  const [plan, setPlan] = useState<Plan>('LITE')

  useEffect(() => {
    fetch('/api/lite/digest').then(r=>r.json()).then(d => {
      setItems(d.items || [])
      setPlan(d.plan || 'LITE')
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

      {isLite && (
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