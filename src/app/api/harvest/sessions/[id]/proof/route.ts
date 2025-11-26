/**
 * HarvestPro Proof-of-Harvest API Endpoint
 * GET /api/harvest/sessions/:id/proof
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getHarvestSession } from '@/lib/harvestpro/session-management';
import { generateProofHash } from '@/lib/harvestpro/proof-hash';
import type { ProofOfHarvest, HarvestedLot } from '@/types/harvestpro';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const sessionId = params.id;

    // Fetch the harvest session
    const session = await getHarvestSession(sessionId, user.id);

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Only allow proof generation for completed sessions
    if (session.status !== 'completed') {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Proof can only be generated for completed sessions',
          },
        },
        { status: 400 }
      );
    }

    // Convert opportunities to harvested lots
    const lots: HarvestedLot[] = session.opportunitiesSelected.map((opp) => {
      // Calculate cost basis from unrealized loss
      // unrealizedLoss = proceeds - costBasis
      // For losses: proceeds < costBasis
      // costBasis = proceeds - unrealizedLoss
      const proceeds = opp.remainingQty * (opp.unrealizedLoss / opp.remainingQty);
      const costBasis = proceeds - opp.unrealizedLoss;

      return {
        token: opp.token,
        dateAcquired: new Date(opp.createdAt),
        dateSold: new Date(session.updatedAt),
        quantity: opp.remainingQty,
        costBasis: costBasis,
        proceeds: proceeds,
        gainLoss: opp.unrealizedLoss,
      };
    });

    // Create proof data
    const proofData: ProofOfHarvest = {
      sessionId: session.sessionId,
      userId: session.userId,
      executedAt: session.updatedAt,
      lots: lots,
      totalLoss: session.realizedLossesTotal,
      netBenefit: session.netBenefitTotal,
      proofHash: '', // Will be generated
    };

    // Generate proof hash if not already stored
    let proofHash = session.proofHash;
    if (!proofHash) {
      proofHash = generateProofHash(proofData);
      
      // Store the proof hash in the session
      const { error: updateError } = await supabase
        .from('harvest_sessions')
        .update({ proof_hash: proofHash })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to store proof hash:', updateError);
        // Continue anyway - we can still return the proof
      }
    }

    // Add the proof hash to the response
    proofData.proofHash = proofHash;

    // Return proof data
    return NextResponse.json(proofData, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating proof:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to generate proof',
        },
      },
      { status: 500 }
    );
  }
}
