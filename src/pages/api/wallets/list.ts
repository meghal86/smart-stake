/**
 * GET /api/wallets/list
 * 
 * Returns the list of wallets for the authenticated user.
 * This is a placeholder that will be replaced by Edge Functions in production.
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 13.1
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

interface WalletResponse {
  id: string;
  address: string;
  chain_namespace: string;
  is_primary: boolean;
  label?: string;
  guardian_scores?: Record<string, number>;
  balance_cache?: Record<string, unknown>;
  created_at: string;
}

interface ApiResponse {
  wallets: WalletResponse[];
  quota?: {
    used: number;
    total: number;
    plan: string;
    used_rows: number;
  };
  active_hint?: {
    primary_wallet_id: string;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed',
      },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }

    // Fetch wallets for user
    // This is a placeholder - in production, this would call an Edge Function
    // For now, return empty list
    const wallets: WalletResponse[] = [];

    return res.status(200).json({
      wallets,
      quota: {
        used: 0,
        total: 5,
        plan: 'free',
        used_rows: 0,
      },
      active_hint: undefined,
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch wallets',
      },
    });
  }
}
