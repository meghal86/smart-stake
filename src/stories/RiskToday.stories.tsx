import type { Meta, StoryObj } from '@storybook/react'
import RiskToday from '@/components/kpi/RiskToday'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/telemetry'

const meta: Meta<typeof RiskToday> = {
  title: 'KPI/RiskToday',
  component: RiskToday,
  parameters: { layout: 'centered' }
}
export default meta
type S = StoryObj<typeof RiskToday>

export const Calm: S = { 
  args: { 
    riskIndex: 12, 
    source: 'live', 
    lastUpdated: new Date().toISOString(),
    trackEvent 
  } 
}

export const Stable: S = { 
  args: { 
    riskIndex: 33, 
    source: 'live', 
    lastUpdated: new Date().toISOString(),
    trackEvent 
  } 
}

export const Caution: S = { 
  args: { 
    riskIndex: 48, 
    source: 'live', 
    lastUpdated: new Date().toISOString(),
    onOpenAlert: () => alert('Alert modal opened'),
    trackEvent 
  } 
}

export const High: S = { 
  args: { 
    riskIndex: 68, 
    source: 'live', 
    lastUpdated: new Date().toISOString(),
    onOpenAlert: () => alert('Alert modal opened'),
    trackEvent 
  } 
}

export const Extreme: S = { 
  args: { 
    riskIndex: 88, 
    source: 'live', 
    lastUpdated: new Date().toISOString(),
    onOpenAlert: () => alert('Alert modal opened'),
    trackEvent 
  } 
}

export const LiveRefreshDemo: S = {
  render: () => {
    const [risk, setRisk] = useState(45)
    const [updated, setUpdated] = useState(new Date().toISOString())
    const [pulse, setPulse] = useState(false)
    
    useEffect(() => {
      const t = setInterval(() => {
        setRisk(v => Math.min(95, Math.max(5, Math.round(v + (Math.random() * 10 - 5)))))
        setUpdated(new Date().toISOString())
        setPulse(true)
        setTimeout(() => setPulse(false), 50)
      }, 3000)
      return () => clearInterval(t)
    }, [])
    
    return (
      <RiskToday 
        riskIndex={risk} 
        lastUpdated={updated} 
        source="live" 
        pulseOnNextRender={pulse}
        trackEvent={trackEvent}
      />
    )
  }
}
