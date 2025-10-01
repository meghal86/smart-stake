'use client'

import { useQuery } from '@tanstack/react-query'

export default function StatusPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => fetch('/api/healthz').then(r => r.json()),
    refetchInterval: 30000
  })
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">AlphaWhale System Status</h1>
      
      <div className="grid gap-4">
        <StatusCard
          title="Data Pipeline"
          status={health?.status || 'unknown'}
          details={`Last update: ${health?.latestEventAgeSec || 0}s ago`}
        />
        
        <StatusCard
          title="Data Quality"
          status={health?.provenance === 'Real' ? 'healthy' : 'degraded'}
          details={`Source: ${health?.provenance || 'Unknown'}`}
        />
        
        <StatusCard
          title="24h Volume"
          status="healthy"
          details={`$${(health?.vol24h || 0).toLocaleString()}`}
        />
      </div>
    </div>
  )
}

function StatusCard({ title, status, details }) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    unhealthy: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <span className={`px-2 py-1 rounded text-sm ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{details}</p>
    </div>
  )
}