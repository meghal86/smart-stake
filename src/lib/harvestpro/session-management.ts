/**
 * HarvestPro Session Management
 * Handles harvest session lifecycle and state transitions
 */

import { createClient } from '@/lib/supabase/client';
import type {
  HarvestSession,
  HarvestOpportunity,
  ExecutionStep,
  HarvestSessionStatus,
} from '@/types/harvestpro';
import { isValidTransition } from './__tests__/session-state-transitions.test';

export interface CreateSessionParams {
  userId: string;
  opportunityIds: string[];
}

export interface UpdateSessionParams {
  sessionId: string;
  userId: string;
  status?: HarvestSessionStatus;
  opportunityIds?: string[];
  realizedLossesTotal?: number;
  netBenefitTotal?: number;
  executionSteps?: ExecutionStep[];
  exportUrl?: string;
  proofHash?: string;
}

/**
 * Create a new harvest session in draft status
 */
export async function createHarvestSession(
  params: CreateSessionParams
): Promise<HarvestSession> {
  const supabase = createClient();

  // Fetch the selected opportunities
  const { data: opportunities, error: oppError } = await supabase
    .from('harvest_opportunities')
    .select('*')
    .in('id', params.opportunityIds)
    .eq('user_id', params.userId);

  if (oppError) {
    throw new Error(`Failed to fetch opportunities: ${oppError.message}`);
  }

  if (!opportunities || opportunities.length === 0) {
    throw new Error('No valid opportunities found');
  }

  if (opportunities.length !== params.opportunityIds.length) {
    throw new Error('Some opportunity IDs are invalid or not owned by user');
  }

  // Calculate totals
  const realizedLossesTotal = opportunities.reduce(
    (sum, opp) => sum + opp.unrealized_loss,
    0
  );
  const netBenefitTotal = opportunities.reduce(
    (sum, opp) => sum + opp.net_tax_benefit,
    0
  );

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('harvest_sessions')
    .insert({
      user_id: params.userId,
      status: 'draft',
      opportunities_selected: opportunities,
      realized_losses_total: realizedLossesTotal,
      net_benefit_total: netBenefitTotal,
      execution_steps: [],
      export_url: null,
      proof_hash: null,
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  return mapDatabaseSessionToType(session);
}

/**
 * Get a harvest session by ID
 */
export async function getHarvestSession(
  sessionId: string,
  userId: string
): Promise<HarvestSession | null> {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('harvest_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  return mapDatabaseSessionToType(session);
}

/**
 * Update a harvest session
 */
export async function updateHarvestSession(
  params: UpdateSessionParams
): Promise<HarvestSession> {
  const supabase = createClient();

  // First, get the current session to validate state transition
  const currentSession = await getHarvestSession(params.sessionId, params.userId);
  
  if (!currentSession) {
    throw new Error('Session not found');
  }

  // Validate state transition if status is being updated
  if (params.status && params.status !== currentSession.status) {
    if (!isValidTransition(currentSession.status, params.status)) {
      throw new Error(
        `Invalid state transition: ${currentSession.status} → ${params.status}`
      );
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.status !== undefined) {
    updateData.status = params.status;
  }

  if (params.opportunityIds !== undefined) {
    // Fetch new opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from('harvest_opportunities')
      .select('*')
      .in('id', params.opportunityIds)
      .eq('user_id', params.userId);

    if (oppError) {
      throw new Error(`Failed to fetch opportunities: ${oppError.message}`);
    }

    updateData.opportunities_selected = opportunities;
    
    // Recalculate totals
    updateData.realized_losses_total = opportunities.reduce(
      (sum: number, opp: HarvestOpportunity) => sum + opp.unrealizedLoss,
      0
    );
    updateData.net_benefit_total = opportunities.reduce(
      (sum: number, opp: HarvestOpportunity) => sum + opp.netTaxBenefit,
      0
    );
  }

  if (params.realizedLossesTotal !== undefined) {
    updateData.realized_losses_total = params.realizedLossesTotal;
  }

  if (params.netBenefitTotal !== undefined) {
    updateData.net_benefit_total = params.netBenefitTotal;
  }

  if (params.executionSteps !== undefined) {
    updateData.execution_steps = params.executionSteps;
  }

  if (params.exportUrl !== undefined) {
    updateData.export_url = params.exportUrl;
  }

  if (params.proofHash !== undefined) {
    updateData.proof_hash = params.proofHash;
  }

  // Update session
  const { data: session, error } = await supabase
    .from('harvest_sessions')
    .update(updateData)
    .eq('session_id', params.sessionId)
    .eq('user_id', params.userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return mapDatabaseSessionToType(session);
}

/**
 * Cancel a harvest session
 */
export async function cancelHarvestSession(
  sessionId: string,
  userId: string
): Promise<HarvestSession> {
  return updateHarvestSession({
    sessionId,
    userId,
    status: 'cancelled',
  });
}

/**
 * Delete a harvest session (soft delete by cancelling)
 */
export async function deleteHarvestSession(
  sessionId: string,
  userId: string
): Promise<void> {
  await cancelHarvestSession(sessionId, userId);
}

/**
 * Map database session to TypeScript type
 */
function mapDatabaseSessionToType(dbSession: unknown): HarvestSession {
  return {
    sessionId: dbSession.session_id,
    userId: dbSession.user_id,
    createdAt: dbSession.created_at,
    updatedAt: dbSession.updated_at,
    status: dbSession.status,
    opportunitiesSelected: dbSession.opportunities_selected || [],
    realizedLossesTotal: dbSession.realized_losses_total || 0,
    netBenefitTotal: dbSession.net_benefit_total || 0,
    executionSteps: dbSession.execution_steps || [],
    exportUrl: dbSession.export_url,
    proofHash: dbSession.proof_hash,
  };
}
