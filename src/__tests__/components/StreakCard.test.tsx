import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StreakCard } from '@/components/hub/StreakCard'

const mockStreak = {
  streak_count: 5,
  last_seen_date: '2024-01-01'
}

describe('StreakCard', () => {
  it('renders streak count correctly', () => {
    render(<StreakCard streak={mockStreak} />)
    
    expect(screen.getByText('Day 5')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows appropriate message for streak count', () => {
    render(<StreakCard streak={mockStreak} />)
    
    expect(screen.getByText('Building momentum!')).toBeInTheDocument()
  })

  it('shows visited today status', () => {
    const today = new Date().toISOString().split('T')[0]
    const todayStreak = { ...mockStreak, last_seen_date: today }
    
    render(<StreakCard streak={todayStreak} />)
    
    expect(screen.getByText('Visited today')).toBeInTheDocument()
  })

  it('shows not visited today status', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStreak = { ...mockStreak, last_seen_date: yesterday.toISOString().split('T')[0] }
    
    render(<StreakCard streak={yesterdayStreak} />)
    
    expect(screen.getByText('Not visited today')).toBeInTheDocument()
  })

  it('shows appropriate badge for streak level', () => {
    render(<StreakCard streak={mockStreak} />)
    
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })
})
