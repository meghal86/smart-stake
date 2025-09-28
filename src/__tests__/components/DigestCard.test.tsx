import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DigestCard } from '@/components/hub/DigestCard'

const mockDigest = [
  {
    id: 1,
    event_time: '2024-01-01T10:00:00Z',
    asset: 'ETH',
    summary: 'Large ETH transfer to Binance',
    severity: 4,
    source: 'Etherscan'
  },
  {
    id: 2,
    event_time: '2024-01-01T09:00:00Z',
    asset: 'BTC',
    summary: 'Bitcoin whale moved 1000 BTC',
    severity: 3,
    source: 'Bitcoin Explorer'
  }
]

describe('DigestCard', () => {
  it('renders digest events correctly', () => {
    render(<DigestCard digest={mockDigest} userPlan="LITE" />)
    
    expect(screen.getByText('Daily Whale Digest')).toBeInTheDocument()
    expect(screen.getByText('Large ETH transfer to Binance')).toBeInTheDocument()
    expect(screen.getByText('Bitcoin whale moved 1000 BTC')).toBeInTheDocument()
  })

  it('shows upgrade button for LITE plan when more than 3 events', () => {
    const manyDigest = Array(5).fill(mockDigest[0])
    render(<DigestCard digest={manyDigest} userPlan="LITE" />)
    
    expect(screen.getByText('See All → Pro')).toBeInTheDocument()
  })

  it('does not show upgrade button for PRO plan', () => {
    const manyDigest = Array(5).fill(mockDigest[0])
    render(<DigestCard digest={manyDigest} userPlan="PRO" />)
    
    expect(screen.queryByText('See All → Pro')).not.toBeInTheDocument()
  })

  it('displays severity badges correctly', () => {
    render(<DigestCard digest={mockDigest} userPlan="LITE" />)
    
    expect(screen.getByText('Severity 4')).toBeInTheDocument()
    expect(screen.getByText('Severity 3')).toBeInTheDocument()
  })
})
