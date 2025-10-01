export type Plan = 'LITE'|'PRO'|'ENTERPRISE'

export const gate = {
  digestFull:   (p: Plan) => p !== 'LITE',
  indexDrill:   (p: Plan) => p !== 'LITE',
  fullCalendar: (p: Plan) => p !== 'LITE',
  webhooks:     (p: Plan) => p === 'ENTERPRISE',
}

// Feature flags
let flags: any = {}

try {
  flags = require('../../feature_flags.json')
} catch {
  flags = {}
}

export function getFeatureFlag(key: string): boolean {
  const keys = key.split('.')
  let value = flags
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) return false
  }
  
  return Boolean(value)
}

export function isLiveDataEnabled(): boolean {
  const envMode = process.env.NEXT_PUBLIC_DATA_MODE === 'live'
  const flagEnabled = getFeatureFlag('data.live')
  
  return envMode && flagEnabled
}
