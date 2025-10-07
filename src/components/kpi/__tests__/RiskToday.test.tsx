import { describe, it, expect } from 'vitest'

describe('RiskToday', () => {
  describe('band mapping', () => {
    const getBand = (v: number) => {
      if (v >= 80) return 'extreme'
      if (v >= 60) return 'high'
      if (v >= 40) return 'caution'
      if (v >= 25) return 'stable'
      return 'calm'
    }

    it('maps 0-24 to calm', () => {
      expect(getBand(0)).toBe('calm')
      expect(getBand(24)).toBe('calm')
    })

    it('maps 25-39 to stable', () => {
      expect(getBand(25)).toBe('stable')
      expect(getBand(39)).toBe('stable')
    })

    it('maps 40-59 to caution', () => {
      expect(getBand(40)).toBe('caution')
      expect(getBand(59)).toBe('caution')
    })

    it('maps 60-79 to high', () => {
      expect(getBand(60)).toBe('high')
      expect(getBand(79)).toBe('high')
    })

    it('maps 80-100 to extreme', () => {
      expect(getBand(80)).toBe('extreme')
      expect(getBand(100)).toBe('extreme')
    })
  })

  describe('helper copy', () => {
    it('returns calm seas for calm band', () => {
      const copy = 'Calm seas — typical moves ±1–2%.'
      expect(copy).toContain('Calm seas')
    })

    it('returns choppy seas for caution band', () => {
      const copy = 'Choppy seas — prices may move ±2–4% today.'
      expect(copy).toContain('Choppy seas')
    })

    it('returns storm risk for extreme band', () => {
      const copy = 'Storm risk — expect fast, large moves.'
      expect(copy).toContain('Storm risk')
    })
  })

  describe('CTA visibility', () => {
    it('shows CTA when band order >= 3', () => {
      const showCta = (order: number) => order >= 3
      expect(showCta(1)).toBe(false)
      expect(showCta(2)).toBe(false)
      expect(showCta(3)).toBe(true)
      expect(showCta(4)).toBe(true)
      expect(showCta(5)).toBe(true)
    })
  })
})
