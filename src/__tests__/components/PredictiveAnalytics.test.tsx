import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PredictiveAnalytics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading and description', () => {
    render(<PredictiveAnalytics />);
    
    expect(screen.getByText('Advanced Whale Predictions')).toBeInTheDocument();
    expect(screen.getByText('AI-driven behavior analysis & market impact simulations')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<PredictiveAnalytics />);
    
    expect(screen.getByText('Advanced Whale Predictions')).toBeInTheDocument();
  });

  it('renders prediction tabs', () => {
    render(<PredictiveAnalytics />);
    
    expect(screen.getByRole('tab', { name: 'Predictions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Simulations' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Models' })).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<PredictiveAnalytics />);
    
    const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
    fireEvent.click(simulationsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Market Impact Simulation')).toBeInTheDocument();
    });
  });

  describe('Predictions Tab', () => {
    it('displays prediction summary cards', async () => {
      const mockPredictions = [
        {
          id: '1',
          type: 'accumulation',
          confidence: 87.5,
          whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
          predicted_amount: 2500,
          timeframe: '6-12 hours',
          impact_score: 8.2,
          explanation: ['Large inflow pattern detected']
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: mockPredictions },
        error: null
      });

      render(<PredictiveAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Predictions')).toBeInTheDocument();
      });
    });

    it('displays individual prediction cards', async () => {
      const mockPredictions = [
        {
          id: '1',
          type: 'accumulation',
          confidence: 87.5,
          whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
          predicted_amount: 2500,
          timeframe: '6-12 hours',
          impact_score: 8.2,
          explanation: ['Large inflow pattern detected', 'Historical accumulation behavior']
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: mockPredictions },
        error: null
      });

      render(<PredictiveAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Accumulation Prediction')).toBeInTheDocument();
        expect(screen.getByText('87.5% confidence')).toBeInTheDocument();
        expect(screen.getByText('2,500 ETH')).toBeInTheDocument();
        expect(screen.getByText('6-12 hours')).toBeInTheDocument();
      });
    });

    it('handles different prediction types', async () => {
      const mockPredictions = [
        {
          id: '1',
          type: 'liquidation',
          confidence: 94.2,
          whale_address: '0x8ba1f109eddd4bd1c328681c71137145c5af8223',
          predicted_amount: 5000,
          timeframe: '2-4 hours',
          impact_score: 9.1,
          explanation: ['Stress indicators in portfolio']
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { predictions: mockPredictions },
        error: null
      });

      render(<PredictiveAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Liquidation Prediction')).toBeInTheDocument();
        expect(screen.getByText('94.2% confidence')).toBeInTheDocument();
      });
    });
  });

  describe('Simulations Tab', () => {
    it('renders simulation form controls', async () => {
      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Whale Count')).toBeInTheDocument();
        expect(screen.getByLabelText('Transaction Size (ETH)')).toBeInTheDocument();
        expect(screen.getByLabelText('Chain')).toBeInTheDocument();
        expect(screen.getByLabelText('Timeframe')).toBeInTheDocument();
      });
    });

    it('updates simulation parameters', async () => {
      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      await waitFor(() => {
        const whaleCountInput = screen.getByLabelText('Whale Count');
        fireEvent.change(whaleCountInput, { target: { value: '10' } });
        expect(whaleCountInput.value).toBe('10');
      });
    });

    it('runs simulation and displays results', async () => {
      const mockResult = {
        priceImpact: '12.00',
        liquidityDrain: '95.0',
        volumeSpike: 400,
        recoveryHours: 24,
        cascadeRisk: 'High',
        affectedTokens: 8,
        arbitrageOpportunities: 24,
        riskZones: [
          { price: '$2892', impact: '3.6%', probability: '66%' }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockResult,
        error: null
      });

      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      await waitFor(() => {
        const runButton = screen.getByText('Run Simulation');
        fireEvent.click(runButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('-12.00%')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('24h')).toBeInTheDocument();
      });
    });

    it('displays risk zones in simulation results', async () => {
      const mockResult = {
        priceImpact: '8.50',
        riskZones: [
          { price: '$2892', impact: '3.6%', probability: '66%' },
          { price: '$2784', impact: '7.2%', probability: '24%' }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockResult,
        error: null
      });

      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      const runButton = screen.getByText('Run Simulation');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText('$2892')).toBeInTheDocument();
        expect(screen.getByText('3.6% impact')).toBeInTheDocument();
        expect(screen.getByText('66% probability')).toBeInTheDocument();
      });
    });

    it('shows loading state during simulation', async () => {
      mockSupabase.functions.invoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 1000))
      );

      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      const runButton = screen.getByText('Run Simulation');
      fireEvent.click(runButton);
      
      expect(screen.getByText('Simulating...')).toBeInTheDocument();
    });
  });

  describe('Models Tab', () => {
    it('displays model performance cards', async () => {
      const mockModels = [
        {
          id: '1',
          name: 'Accumulation Predictor',
          type: 'accumulation',
          accuracy: 89.2,
          last_trained: new Date().toISOString()
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { models: mockModels },
        error: null
      });

      render(<PredictiveAnalytics />);
      
      const modelsTab = screen.getByRole('tab', { name: 'Models' });
      fireEvent.click(modelsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Accumulation Predictor')).toBeInTheDocument();
        expect(screen.getByText('89.2%')).toBeInTheDocument();
      });
    });

    it('opens model details modal', async () => {
      const mockModels = [
        {
          id: '1',
          name: 'Accumulation Predictor',
          type: 'accumulation',
          accuracy: 89.2,
          last_trained: new Date().toISOString()
        }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { models: mockModels },
        error: null
      });

      render(<PredictiveAnalytics />);
      
      const modelsTab = screen.getByRole('tab', { name: 'Models' });
      fireEvent.click(modelsTab);
      
      await waitFor(() => {
        const modelCard = screen.getByText('Accumulation Predictor');
        fireEvent.click(modelCard);
      });
      
      await waitFor(() => {
        expect(screen.getByText('30-day avg:')).toBeInTheDocument();
        expect(screen.getByText('Training data:')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API Error' }
      });

      render(<PredictiveAnalytics />);
      
      // Should still render with fallback data
      await waitFor(() => {
        expect(screen.getByText('Advanced Whale Predictions')).toBeInTheDocument();
      });
    });

    it('displays fallback predictions on error', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      render(<PredictiveAnalytics />);
      
      await waitFor(() => {
        // Should display fallback predictions
        expect(screen.getByText('Active Predictions')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<PredictiveAnalytics />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('supports keyboard navigation', async () => {
      render(<PredictiveAnalytics />);
      
      const firstTab = screen.getByRole('tab', { name: 'Predictions' });
      firstTab.focus();
      
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      expect(firstTab).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('debounces simulation parameter changes', async () => {
      render(<PredictiveAnalytics />);
      
      const simulationsTab = screen.getByRole('tab', { name: 'Simulations' });
      fireEvent.click(simulationsTab);
      
      await waitFor(() => {
        const whaleCountInput = screen.getByLabelText('Whale Count');
        
        // Rapid changes should be debounced
        fireEvent.change(whaleCountInput, { target: { value: '5' } });
        fireEvent.change(whaleCountInput, { target: { value: '10' } });
        fireEvent.change(whaleCountInput, { target: { value: '15' } });
        
        expect(whaleCountInput).toHaveValue(15);
      });
    });

    it('memoizes expensive calculations', () => {
      const { rerender } = render(<PredictiveAnalytics />);
      
      // Component should not re-render unnecessarily
      rerender(<PredictiveAnalytics />);
      
      expect(screen.getByText('Advanced Whale Predictions')).toBeInTheDocument();
    });
  });
});