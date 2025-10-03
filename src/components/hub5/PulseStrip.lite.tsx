'use client'

import { useState, useEffect } from 'react'
import AnimatedKPI from './AnimatedKPI'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { Activity, TrendingUp, Shield } from 'lucide-react'

interface KPIData {
  whalePressure: number
  sentiment: number
  riskIndex: number
}

interface PulseStripProps {
  userMode?: 'novice' | 'pro' | 'auto'
  isLoading?: boolean
}

export default function PulseStrip({ userMode = 'auto', isLoading = false }: PulseStripProps) {
  const [data, setData] = useState<KPIData>({ whalePressure: 67, sentiment: 72, riskIndex: 34 })
  const [previousData, setPreviousData] = useState<KPIData | null>(null)

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousData(data)
      setData({
        whalePressure: Math.max(0, Math.min(100, data.whalePressure + (Math.random() - 0.5) * 10)),
        sentiment: Math.max(0, Math.min(100, data.sentiment + (Math.random() - 0.5) * 8)),
        riskIndex: Math.max(0, Math.min(100, data.riskIndex + (Math.random() - 0.5) * 6))
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonLoader type="kpi" />
        <SkeletonLoader type="kpi" />
        <SkeletonLoader type="kpi" />
      </div>
    )
  }

  const getKPITitle = (base: string) => {
    if (userMode === 'novice') {
      switch (base) {
        case 'Whale Pressure': return '🐋 Whale Activity'
        case 'Market Sentiment': return '📈 Market Mood'
        case 'Risk Index': return '⚠️ Risk Level'
        default: return base
      }
    }
    return base
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AnimatedKPI
        title={getKPITitle('Whale Pressure')}
        value={data.whalePressure}
        previousValue={previousData?.whalePressure}
        format="percentage"
        icon={<Activity className="w-4 h-4" />}
      />
      <AnimatedKPI
        title={getKPITitle('Market Sentiment')}
        value={data.sentiment}
        previousValue={previousData?.sentiment}
        format="percentage"
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <AnimatedKPI
        title={getKPITitle('Risk Index')}
        value={data.riskIndex}
        previousValue={previousData?.riskIndex}
        format="number"
        icon={<Shield className="w-4 h-4" />}
      />
    </div>
  )
}