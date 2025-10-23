/**
 * ScoreCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreCard } from '@/components/guardian/ScoreCard';

describe('ScoreCard Component', () => {
  const defaultProps = {
    score: 85,
    grade: 'B' as const,
    flags: 2,
    critical: 0,
    lastScan: '3m ago',
    chains: ['ethereum', 'base'],
    onRescan: vi.fn(),
    onFixRisks: vi.fn(),
  };

  it('should render score and grade', () => {
    render(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should display correct flag count', () => {
    render(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show critical flag count when present', () => {
    render(<ScoreCard {...defaultProps} critical={1} />);
    
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('should call onRescan when rescan button clicked', () => {
    const onRescan = vi.fn();
    render(<ScoreCard {...defaultProps} onRescan={onRescan} />);
    
    const rescanButton = screen.getByText('Rescan Wallet');
    fireEvent.click(rescanButton);
    
    expect(onRescan).toHaveBeenCalledTimes(1);
  });

  it('should call onFixRisks when fix button clicked', () => {
    const onFixRisks = vi.fn();
    render(<ScoreCard {...defaultProps} onFixRisks={onFixRisks} />);
    
    const fixButton = screen.getByText('Fix Risks');
    fireEvent.click(fixButton);
    
    expect(onFixRisks).toHaveBeenCalledTimes(1);
  });

  it('should disable fix button when no flags', () => {
    render(<ScoreCard {...defaultProps} flags={0} />);
    
    const fixButton = screen.getByText('Fix Risks');
    expect(fixButton).toBeDisabled();
  });

  it('should show rescanning state', () => {
    render(<ScoreCard {...defaultProps} isRescanning={true} />);
    
    const rescanButton = screen.getByText('Rescan Wallet');
    expect(rescanButton).toBeDisabled();
  });

  it('should display last scan time', () => {
    render(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('3m ago')).toBeInTheDocument();
  });

  it('should display chain list', () => {
    render(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('ethereum, base')).toBeInTheDocument();
  });

  it('should show auto-refresh status', () => {
    render(<ScoreCard {...defaultProps} autoRefreshEnabled={true} />);
    
    expect(screen.getByText('Auto-refresh on')).toBeInTheDocument();
  });

  it('should apply correct color class for high score', () => {
    const { container } = render(<ScoreCard {...defaultProps} score={95} />);
    
    // Check for green color class
    const scoreElement = container.querySelector('.text-green-500');
    expect(scoreElement).toBeInTheDocument();
  });

  it('should apply correct color class for medium score', () => {
    const { container } = render(<ScoreCard {...defaultProps} score={65} />);
    
    // Check for yellow color class
    const scoreElement = container.querySelector('.text-yellow-500');
    expect(scoreElement).toBeInTheDocument();
  });

  it('should apply correct color class for low score', () => {
    const { container } = render(<ScoreCard {...defaultProps} score={45} />);
    
    // Check for red color class
    const scoreElement = container.querySelector('.text-red-500');
    expect(scoreElement).toBeInTheDocument();
  });
});

