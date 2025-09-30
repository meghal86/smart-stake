'use client'
import { useEffect, useState } from 'react'

type WhaleIndex = { 
  date: string
  score: number
  label: string 
}

export default function IndexDialCard() {
  const [index, setIndex] = useState<WhaleIndex | null>(null)

  useEffect(() => {
    fetch('/api/lite5/whale-index')
      .then((res) => res.json())
      .then((d) => setIndex(d))
  }, [])

  if (!index) return null

  // Gauge color based on score
  const getColor = (score: number) => {
    if (score < 40) return 'text-green-400'
    if (score < 70) return 'text-yellow-400'
    return 'text-red-500'
  }

  const getLabelColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'hot': return 'bg-red-500'
      case 'elevated': return 'bg-orange-500'
      case 'moderate': return 'bg-yellow-500'
      case 'calm': return 'bg-green-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow text-center">
      <h2 className="text-xl font-semibold text-white mb-4">📊 Whale Index</h2>
      <div className="flex flex-col items-center justify-center">
        <div
          className={`text-6xl font-bold ${getColor(index.score)}`}
          aria-label={`Whale activity index: ${index.label}`}
        >
          {index.score}
        </div>
        <div className={`mt-2 rounded-full px-3 py-1 text-sm font-semibold text-white ${getLabelColor(index.label)}`}>
          {index.label}
        </div>
        <p className="mt-3 text-sm text-slate-400">
          {index.score >= 80 && "High whale activity detected"}
          {index.score >= 60 && index.score < 80 && "Moderate whale movement"}
          {index.score >= 40 && index.score < 60 && "Normal market conditions"}
          {index.score < 40 && "Low whale activity"}
        </p>
      </div>
    </div>
  )
}
