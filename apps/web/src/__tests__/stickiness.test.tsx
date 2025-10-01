import { render, screen, fireEvent } from '@testing-library/react';
import { ForYouRow } from '../components/ForYouRow';
import { AlertsFeed } from '../components/AlertsFeed';
import { MobileDock } from '../components/MobileDock';
import { ProTeaser } from '../components/ProTeaser';

// Mock hooks
jest.mock('../hooks/useGate', () => ({
  useGate: () => ({ hasFlag: () => true, hasFeature: () => true })
}));

jest.mock('../hooks/useTelemetry', () => ({
  useTelemetry: () => ({ track: jest.fn() })
}));

describe('Stickiness Components', () => {
  test('ForYouRow renders with mock data', () => {
    render(<ForYouRow />);
    expect(screen.getByText('🎯 For You')).toBeInTheDocument();
  });

  test('AlertsFeed renders alerts section', () => {
    render(<AlertsFeed />);
    expect(screen.getByText('🔔 Alerts Feed')).toBeInTheDocument();
    expect(screen.getByText('Create Alert')).toBeInTheDocument();
  });

  test('MobileDock renders navigation items', () => {
    render(<MobileDock />);
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  test('ProTeaser renders upgrade CTA', () => {
    render(<ProTeaser />);
    expect(screen.getByText('Unlock AlphaWhale Pro')).toBeInTheDocument();
    expect(screen.getByText('Start 7-day trial (no card)')).toBeInTheDocument();
  });

  test('AlertsFeed create modal opens and closes', () => {
    render(<AlertsFeed />);
    
    const createButton = screen.getByText('Create Alert');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Create Alert')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Alert title')).toBeInTheDocument();
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
  });

  test('ForYouRow handles follow/unfollow interactions', async () => {
    render(<ForYouRow />);
    
    // Wait for mock data to load
    await screen.findByText('Whale #1234');
    
    const followButtons = screen.getAllByText(/Follow|Unfollow/);
    if (followButtons.length > 0) {
      fireEvent.click(followButtons[0]);
    }
  });
});