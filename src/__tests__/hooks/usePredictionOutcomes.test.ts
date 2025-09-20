import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePredictionOutcomes } from '@/hooks/usePredictionOutcomes';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

const mockOutcomes = [
  {
    prediction_id: 'pred_1',
    realized_return: 0.032,
    was_correct: true,
    realized_ts: '2025-01-21T16:00:00Z'
  }
];

describe('usePredictionOutcomes', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockOutcomes,
          error: null
        })
      })
    } as any);
  });

  it('fetches outcomes for given prediction IDs', async () => {
    const { result } = renderHook(() => 
      usePredictionOutcomes(['pred_1', 'pred_2'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.outcomes).toEqual(mockOutcomes);
  });

  it('handles empty prediction IDs array', () => {
    const { result } = renderHook(() => 
      usePredictionOutcomes([])
    );

    expect(result.current.outcomes).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'API Error' }
        })
      })
    } as any);

    const { result } = renderHook(() => 
      usePredictionOutcomes(['pred_1'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.outcomes).toEqual([]);
  });
});