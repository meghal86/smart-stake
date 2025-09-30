import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PredictionOutcome = {
  prediction_id: string;
  realized_return: number;
  was_correct: boolean;
  realized_ts: string;
};

export function usePredictionOutcomes(ids: string[]) {
  // Disabled for real-time predictions - no historical outcomes exist
  return { outcomes: [], loading: false };
}