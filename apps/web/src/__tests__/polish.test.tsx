import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { RefreshButton } from '../components/RefreshButton';
import { ConfidenceChip } from '../components/ConfidenceChip';
import { SyncChip } from '../components/SyncChip';

// Mock hooks
jest.mock('../hooks/useGate', () => ({
  useGate: () => ({ hasFlag: () => true })
}));

jest.mock('../hooks/useTelemetry', () => ({
  useTelemetry: () => ({ track: jest.fn() })
}));

jest.mock('../hooks/useCloudSync', () => ({
  useCloudSync: () => ({
    syncStatus: { status: 'synced', lastSyncAt: new Date() }
  })
}));

describe('Polish Components', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('OnboardingWizard shows when not completed', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Make it yours.')).toBeInTheDocument();
  });

  test('OnboardingWizard progresses through steps', async () => {
    render(<OnboardingWizard />);
    
    // Step 1: Select assets
    const btcCheckbox = screen.getByLabelText('BTC');
    fireEvent.click(btcCheckbox);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Track the smart money.')).toBeInTheDocument();
    });
  });

  test('RefreshButton shows loading state', async () => {
    const mockRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<RefreshButton onRefresh={mockRefresh} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  test('ConfidenceChip shows correct levels', () => {
    const { rerender } = render(<ConfidenceChip amount={2000000} walletActivity={15} />);
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    
    rerender(<ConfidenceChip amount={500000} walletActivity={7} />);
    expect(screen.getByText('Med Confidence')).toBeInTheDocument();
    
    rerender(<ConfidenceChip amount={50000} walletActivity={2} />);
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  test('SyncChip displays sync status', () => {
    render(<SyncChip />);
    expect(screen.getByText(/Synced/)).toBeInTheDocument();
  });

  test('OnboardingWizard validates step requirements', () => {
    render(<OnboardingWizard />);
    
    // Next button should be disabled without selections
    const nextButton = screen.getByText('Next');
    expect(nextButton).toHaveClass('opacity-50');
    
    // Enable after selecting asset
    const btcCheckbox = screen.getByLabelText('BTC');
    fireEvent.click(btcCheckbox);
    
    expect(nextButton).not.toHaveClass('opacity-50');
  });
});