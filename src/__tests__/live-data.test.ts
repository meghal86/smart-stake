import { getWhaleSpotlight } from '@/lib/adapters/whaleSpotlight'
import { getFearIndex } from '@/lib/adapters/fearIndex'
import { fetchPrices } from '@/lib/adapters/prices'

// Mock environment
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Live Data Adapters', () => {
  test('spotlight adapter fallback to mock', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API down'))
    
    const result = await getWhaleSpotlight()
    
    expect(result.provenance).toBe('Simulated')
    expect(result.amount).toBeGreaterThan(0)
  })
  
  test('fear index with live data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        score: 75,
        label: 'Accumulation',
        provenance: 'Real',
        last_updated_iso: new Date().toISOString()
      })
    })
    
    process.env.NEXT_PUBLIC_DATA_MODE = 'live'
    const result = await getFearIndex()
    
    expect(result.provenance).toBe('Real')
    expect(result.score).toBe(75)
  })
  
  test('prices adapter handles errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    
    const result = await fetchPrices(['ethereum'])
    
    expect(result).toEqual({})
  })
  
  test('data mode switching', async () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'mock'
    
    const spotlight = await getWhaleSpotlight()
    const fearIndex = await getFearIndex()
    
    expect(spotlight.provenance).toBe('Simulated')
    expect(fearIndex.provenance).toBe('Simulated')
  })
})