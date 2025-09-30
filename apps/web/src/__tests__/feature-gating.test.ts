import { describe, it, expect } from 'vitest'
import { gate } from '@/lib/featureFlags'

describe('Feature Gating', () => {
  it('should gate features correctly for LITE plan', () => {
    expect(gate.digestFull('LITE')).toBe(false)
    expect(gate.indexDrill('LITE')).toBe(false)
    expect(gate.fullCalendar('LITE')).toBe(false)
    expect(gate.webhooks('LITE')).toBe(false)
  })

  it('should gate features correctly for PRO plan', () => {
    expect(gate.digestFull('PRO')).toBe(true)
    expect(gate.indexDrill('PRO')).toBe(true)
    expect(gate.fullCalendar('PRO')).toBe(true)
    expect(gate.webhooks('PRO')).toBe(false)
  })

  it('should gate features correctly for ENTERPRISE plan', () => {
    expect(gate.digestFull('ENTERPRISE')).toBe(true)
    expect(gate.indexDrill('ENTERPRISE')).toBe(true)
    expect(gate.fullCalendar('ENTERPRISE')).toBe(true)
    expect(gate.webhooks('ENTERPRISE')).toBe(true)
  })
})
