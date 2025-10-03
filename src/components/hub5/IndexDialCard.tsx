'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface IndexDialCardProps {
  variant: 'sentiment' | 'pressure' | 'risk'
  value: number
  delta?: number
  className?: string
}

const config = {
  sentiment: {
    title: 'Market Sentiment',
    meaning: 'Buyers are stronger than sellers right now',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: TrendingUp
  },
  pressure: {
    title: 'Whale Pressure',
    meaning: 'Net inflow to big wallets over 24h',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: Activity
  },
  risk: {
    title: 'Market Risk',
    meaning: 'Higher value = riskier conditions for longs',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: TrendingDown
  }
}

export function IndexDialCard({ variant, value, delta, className }: IndexDialCardProps) {
  const { title, meaning, color, bgColor, icon: Icon } = config[variant]
  
  return (
    <Card className={`rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/40 dark:border-slate-800 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-label mb-1">
              {title}
            </h3>
            <div className="text-kpi text-3xl">
              {variant === 'sentiment' ? `${value}%` : variant === 'risk' ? `${value}/100` : value}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>

        {/* Meaning explanation */}
        <p className="text-meta mb-3">
          {meaning}
        </p>

        {/* Delta */}
        {delta !== undefined && (
          <div className="flex items-center gap-2">
            {delta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              delta >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
            <span className="text-meta">vs yesterday</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}