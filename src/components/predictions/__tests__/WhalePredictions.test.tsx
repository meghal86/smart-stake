import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WhalePredictions from '@/pages/WhalePredictions';

// Mock hooks
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    canAccessFeature: jest.fn(() => true)
  })
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' } })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('WhalePredictions', () => {
  test('renders predictions page', () => {
    renderWithRouter(<WhalePredictions />);
    expect(screen.getByText('Whale Predictions')).toBeInTheDocument();
  });

  test('displays tabs', () => {
    renderWithRouter(<WhalePredictions />);
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  test('switches tabs', () => {
    renderWithRouter(<WhalePredictions />);
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Accuracy Rate')).toBeInTheDocument();
  });
});