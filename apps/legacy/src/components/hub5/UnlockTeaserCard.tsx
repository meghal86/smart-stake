'use client'
import { useEffect, useState } from 'react'
import { Plan } from '@/lib/featureFlags'

type Unlock = { 
  token: string
  unlock_time: string
  amount_usd: number
  chain?: string
}

export default function UnlockTeaserCard() {
  const [plan, setPlan] = useState<Plan>('LITE')
  const [next, setNext] = useState<Unlock|null>(null)
  const [list, setList] = useState<Unlock[]>([])

  useEffect(() => {
    fetch('/api/lite5/unlocks').then(r=>r.json()).then(d => {
      if (d.items) { 
        setList(d.items)
        setPlan(d.plan)
      } else { 
        setNext(d.next)
        setPlan(d.plan)
      }
    })
  }, [])

  const isLite = plan === 'LITE'
  const dateStr = (iso: string) => new Date(iso).toLocaleDateString()
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow">
      <h2 className="text-xl font-semibold text-white mb-4">🔒 Token Unlocks</h2>

      {isLite && next && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {next.token}
              </div>
              <div>
                <div className="font-semibold text-white">{next.token}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-400">{formatAmount(next.amount_usd)}</div>
              <div className="text-sm text-slate-400">
                {dateStr(next.unlock_time)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <button 
              className="text-sm text-teal-400 underline hover:text-teal-300"
              onClick={() => alert('Pro only — Full calendar requires upgrade.')}
            >
              See Full Calendar → Pro
            </button>
          </div>
        </>
      )}

      {!isLite && (
        <ul className="space-y-2">
          {list.map((u, i) => (
            <li key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {u.token}
                </div>
                <div>
                  <div className="font-semibold text-white">{u.token}</div>
                  <div className="text-xs text-slate-400">{u.chain}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-teal-400">{formatAmount(u.amount_usd)}</div>
                <div className="text-xs text-slate-400">{dateStr(u.unlock_time)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
