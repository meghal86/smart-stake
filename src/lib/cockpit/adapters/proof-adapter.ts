/**
 * Proof/Receipts Adapter
 * 
 * Converts Proof/Receipt records into the unified Action model.
 * 
 * Adapter Rules (F2.5):
 * - lane = Watch
 * - used for pulse + peek drawer; typically cta.kind = "Review"
 * 
 * Requirements: F2.5
 */

import {
  ActionDraft,
  ProofReceiptInput,
  AdapterContext,
  ActionSeverity,
  ActionProvenance,
  CTAKind,
} from '../types';

/**
 * Determines severity for a proof/receipt
 * 
 * Proofs are informational, so they're typically low severity
 */
function determineSeverity(_proof: ProofReceiptInput): ActionSeverity {
  return 'low';
}

/**
 * Proofs are always confirmed (they represent completed transactions)
 */
function determineProvenance(_proof: ProofReceiptInput): ActionProvenance {
  return 'confirmed';
}

/**
 * Adapts a Proof/Receipt to an ActionDraft
 * 
 * @param proof - The Proof/Receipt input
 * @param _context - Adapter context (unused for Proof, but kept for interface consistency)
 * @returns ActionDraft ready for ranking pipeline
 */
export function adaptProofReceipt(
  proof: ProofReceiptInput,
  _context: AdapterContext
): ActionDraft {
  const severity = determineSeverity(proof);
  const provenance = determineProvenance(proof);
  
  // Proofs are always Review-only (informational)
  const ctaKind: CTAKind = 'Review';
  const is_executable = false;
  
  return {
    id: `proof_${proof.id}`,
    lane: 'Watch',
    title: proof.title,
    severity,
    provenance,
    is_executable,
    cta: {
      kind: ctaKind,
      href: proof.href,
    },
    impact_chips: [], // Proofs don't have impact chips
    event_time: proof.updated_at || proof.created_at,
    expires_at: null, // Proofs don't expire
    source: {
      kind: 'proof',
      ref_id: proof.id,
    },
    // Internal timestamps for freshness computation
    _created_at: proof.created_at,
    _updated_at: proof.updated_at || null,
  };
}

/**
 * Batch adapts multiple Proof/Receipts
 * 
 * @param proofs - Array of Proof/Receipt inputs
 * @param context - Adapter context
 * @returns Array of ActionDrafts
 */
export function adaptProofReceipts(
  proofs: ProofReceiptInput[],
  context: AdapterContext
): ActionDraft[] {
  return proofs.map(proof => adaptProofReceipt(proof, context));
}
