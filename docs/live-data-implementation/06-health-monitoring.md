# 06 - Health Monitoring

## Health Check Endpoint

**File**: `src/app/api/healthz/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Check data freshness
    const { data: freshness } = await supabase
      .from('data_freshness')
      .select('*')
      .single()
    
    // Check 24h volume
    const { data: volume } = await supabase
      .from('volume_24h')
      .select('*')
      .single()
    
    const latestEventAgeSec = freshness?.age_seconds || 999999
    const provenance = latestEventAgeSec <= 180 ? 'Real' : 'Simulated'
    
    // Determine status
    let status = 200
    if (latestEventAgeSec > 600) status = 500      // Critical
    else if (latestEventAgeSec > 180) status = 206  // Degraded
    
    return Response.json({
      status: status === 200 ? 'healthy' : status === 206 ? 'degraded' : 'unhealthy',
      latestEventAgeSec,
      provenance,
      vol24h: volume?.total_volume || 0,
      timestamp: new Date().toISOString()
    }, { status })
    
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

## Status Page Component

**File**: `src/app/status/page.tsx`

```typescript
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
          details={`Last update: ${health?.latestEventAgeSec}s ago`}
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
```

## Ops Dashboard

**File**: `src/app/internal/ops/page.tsx`

```typescript
'use client'

export default function OpsDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['ops-metrics'],
    queryFn: fetchOpsMetrics,
    refetchInterval: 10000
  })
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Operations Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Data Freshness"
          value={`${metrics?.dataAge || 0}s`}
          status={getDataFreshnessStatus(metrics?.dataAge)}
        />
        
        <MetricCard
          title="Ingestion Rate"
          value={`${metrics?.ingestionRate || 0}/min`}
          status="healthy"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${metrics?.errorRate || 0}%`}
          status={metrics?.errorRate > 5 ? 'unhealthy' : 'healthy'}
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Errors</h2>
        <ErrorLog errors={metrics?.recentErrors || []} />
      </div>
    </div>
  )
}
```

## Alert System

**File**: `supabase/functions/qc-alerts/index.ts`

```typescript
Deno.serve(async (req) => {
  const alerts = []
  
  // Check data freshness
  const { data: freshness } = await supabase
    .from('data_freshness')
    .select('*')
    .single()
  
  if (freshness?.age_seconds > 600) {
    alerts.push({
      severity: 'critical',
      message: `Data is ${freshness.age_seconds}s stale (>10min threshold)`
    })
  }
  
  // Check invariants
  const { data: negativeAmounts } = await supabase
    .rpc('check_negative_amounts')
  
  if (negativeAmounts > 0) {
    alerts.push({
      severity: 'high',
      message: `Found ${negativeAmounts} negative USD amounts`
    })
  }
  
  // Send Slack alerts
  if (alerts.length > 0) {
    await sendSlackAlerts(alerts)
  }
  
  return new Response(JSON.stringify({ alerts }))
})

async function sendSlackAlerts(alerts) {
  const webhook = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!webhook) return
  
  const message = {
    text: '🚨 AlphaWhale Data Quality Alert',
    blocks: alerts.map(alert => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${alert.severity.toUpperCase()}*: ${alert.message}`
      }
    }))
  }
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })
}
```

## Telemetry Events

**File**: `src/lib/analytics.ts`

```typescript
export function trackDataEvent(event: string, properties: Record<string, any>) {
  // Track data quality events
  analytics.track(event, {
    ...properties,
    dataMode: process.env.NEXT_PUBLIC_DATA_MODE,
    timestamp: new Date().toISOString()
  })
}

// Usage examples:
trackDataEvent('data_ingestion_started', { provider: 'alchemy' })
trackDataEvent('data_ingestion_completed', { count: 42, duration: 1200 })
trackDataEvent('data_ingestion_failed', { provider: 'alchemy', error: 'timeout' })
```

---

**Next**: [Testing Strategy](./07-testing-strategy.md)