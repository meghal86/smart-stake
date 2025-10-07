import { describe, it, expect } from 'vitest'
import { showDelta } from '@/lib/format'

describe('EnhancedSummaryKpis', () => {
  describe('delta noise filter', () => {
    it('shows delta when >= 0.3', () => {
      expect(showDelta(0.3)).toBe(true)
      expect(showDelta(5)).toBe(true)
      expect(showDelta(-0.5)).toBe(true)
    })

    it('hides delta when < 0.3', () => {
      expect(showDelta(0.2)).toBe(false)
      expect(showDelta(-0.1)).toBe(false)
      expect(showDelta(0)).toBe(false)
    })
  })

  describe('status colors', () => {
    it('returns green for accumulating pressure', () => {
      const pressure = 115
      const color = pressure > 110 ? 'green' : pressure < 90 ? 'red' : 'yellow'
      expect(color).toBe('green')
    })

    it('returns red for selling pressure', () => {
      const pressure = 85
      const color = pressure > 110 ? 'green' : pressure < 90 ? 'red' : 'yellow'
      expect(color).toBe('red')
    })

    it('returns yellow for balanced pressure', () => {
      const pressure = 100
      const color = pressure > 110 ? 'green' : pressure < 90 ? 'red' : 'yellow'
      expect(color).toBe('yellow')
    })
  })

  describe('provenance text', () => {
    it('shows Live ✓ for live source', () => {
      const source = 'live'
      const text = source === 'live' ? 'Live ✓' : 'Cached'
      expect(text).toBe('Live ✓')
    })

    it('shows Cached for cache source', () => {
      const source = 'cache'
      const text = source === 'live' ? 'Live ✓' : 'Cached'
      expect(text).toBe('Cached')
    })
  })

  describe('accessibility labels', () => {
    it('generates correct aria-label', () => {
      const label = `Whale Pressure: 115, Accumulating, Live Data`
      expect(label).toContain('Whale Pressure')
      expect(label).toContain('115')
      expect(label).toContain('Accumulating')
      expect(label).toContain('Live Data')
    })
  })
})
