/**
 * Daily Pulse Generation Engine
 * 
 * Generates timezone-aware daily pulse content for the cockpit.
 * 
 * Requirements: 9.1, 9.2, 11.2, 11.3
 */

import { createClient } from '@/integrations/supabase/server';
import { 
  ActionDraft, 
  AdapterContext,
  GuardianFindingInput,
  HunterOpportunityInput,
  PortfolioDeltaInput,
  ProofReceiptInput
} from './types';
import { adaptGuardianFindings } from './adapters/guardian-adapter';
import { adaptHunterOpportunities } from './adapters/hunter-adapter';
import { adaptPortfolioDeltas } from './adapters/portfolio-adapter';
import { adaptProofReceipts } from './adapters/proof-adapter';

// ============================================================================
// Types
// ============================================================================

/**
 * Pulse row categories
 */
export type PulseCategory = 
  | 'expiring_opportunity'
  | 'new_opportunity'
  | 'updated_opportunity'
  | 'portfolio_delta'
  | 'guardian_delta'
  | 'proof_receipt';

/**
 * Individual pulse row
 */
export interface PulseRow {
  kind: PulseCategory;
  title: string;
  chip?: string; // Optional chip text (e.g., "8h left", "New")
  cta: {
    label: string;
    href: string;
  };
  provenance: 'confirmed' | 'simulated' | 'heuristic';
  event_time: string; // RFC3339/ISO8601
  priority: number; // For sorting within category
}

/**
 * Generated pulse payload
 */
export interface PulsePayload {
  pulse_date: string; // YYYY-MM-DD
  timezone: string; // IANA timezone
  rows: PulseRow[];
  generated_at: string; // RFC3339/ISO8601
}

/**
 * Pulse generation context
 */
export interface PulseGenerationContext {
  user_id: string;
  pulse_date: string; // YYYY-MM-DD
  timezone: string; // IANA timezone
  last_opened_at: string | null;
  wallet_scope: 'active' | 'all';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Pulse content constraints (Locked)
 */
export const PULSE_CONSTRAINTS = {
  MAX_ROWS_TOTAL: 8,
  MAX_ROWS_PER_CATEGORY: 3,
  EXPIRING_THRESHOLD_HOURS: 72,
} as const;

/**
 * Category priorities for ranking pulse sources (Locked)
 * Lower number = higher priority
 */
export const CATEGORY_PRIORITIES: Record<PulseCategory, number> = {
  expiring_opportunity: 1, // Highest priority
  new_opportunity: 2,
  updated_opportunity: 3,
  portfolio_delta: 4,
  guardian_delta: 5,
  proof_receipt: 6, // Lowest priority
} as const;

// ============================================================================
// Core Generation Logic
// ============================================================================

/**
 * Generates daily pulse content for a user
 * 
 * @param context - Pulse generation context
 * @returns Generated pulse payload
 */
export async function generateDailyPulse(context: PulseGenerationContext): Promise<PulsePayload> {
  // Fetch data from all sources
  const [
    guardianFindings,
    hunterOpportunities,
    portfolioDeltas,
    proofReceipts
  ] = await Promise.all([
    fetchGuardianFindings(context),
    fetchHunterOpportunities(context),
    fetchPortfolioDeltas(context),
    fetchProofReceipts(context)
  ]);

  // Create adapter context
  const adapterContext: AdapterContext = {
    last_opened_at: context.last_opened_at,
    degraded_mode: false, // TODO: Implement degraded mode detection
    saved_ref_ids: new Set(), // TODO: Fetch user's saved items
    wallet_roles: new Map(), // TODO: Fetch user's wallet roles
    alert_tags: new Set(), // TODO: Fetch user's alert rule tags
  };

  // Adapt all sources to unified Action model
  const guardianActions = adaptGuardianFindings(guardianFindings, adapterContext);
  const hunterActions = adaptHunterOpportunities(hunterOpportunities, adapterContext);
  const portfolioActions = adaptPortfolioDeltas(portfolioDeltas, adapterContext);
  const proofActions = adaptProofReceipts(proofReceipts, adapterContext);

  // Generate pulse rows from each source
  const pulseRows: PulseRow[] = [];
  
  // Add expiring opportunities (Hunter only, <72h)
  pulseRows.push(...generateExpiringRows(hunterActions, context));
  
  // Add new opportunities (all sources, event_time > last_opened_at)
  pulseRows.push(...generateNewRows([...guardianActions, ...hunterActions, ...portfolioActions], context));
  
  // Add updated opportunities (all sources, updated since last open)
  pulseRows.push(...generateUpdatedRows([...guardianActions, ...hunterActions, ...portfolioActions], context));
  
  // Add portfolio deltas (significant changes)
  pulseRows.push(...generatePortfolioDeltaRows(portfolioActions, context));
  
  // Add Guardian micro-deltas (new findings)
  pulseRows.push(...generateGuardianDeltaRows(guardianActions, context));
  
  // Add recent proofs/receipts
  pulseRows.push(...generateProofRows(proofActions, context));

  // Apply constraints and ranking
  const finalRows = applyPulseConstraints(pulseRows);

  return {
    pulse_date: context.pulse_date,
    timezone: context.timezone,
    rows: finalRows,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generates pulse for a specific date, with on-demand fallback
 * 
 * @param user_id - User ID
 * @param pulse_date - Date in YYYY-MM-DD format
 * @param timezone - User's IANA timezone
 * @param wallet_scope - Wallet scope filter
 * @returns Pulse payload or null if no content
 */
export async function getPulseForDate(
  user_id: string,
  pulse_date: string,
  timezone: string,
  wallet_scope: 'active' | 'all' = 'active'
): Promise<PulsePayload | null> {
  const supabase = await createClient();
  
  // Try to fetch existing pulse
  const { data: existingPulse } = await supabase
    .from('daily_pulse')
    .select('payload')
    .eq('user_id', user_id)
    .eq('pulse_date', pulse_date)
    .single();

  if (existingPulse) {
    return existingPulse.payload as PulsePayload;
  }

  // Generate on-demand if missing
  const { data: cockpitState } = await supabase
    .from('cockpit_state')
    .select('last_opened_at')
    .eq('user_id', user_id)
    .single();

  const context: PulseGenerationContext = {
    user_id,
    pulse_date,
    timezone,
    last_opened_at: cockpitState?.last_opened_at || null,
    wallet_scope,
  };

  const pulse = await generateDailyPulse(context);

  // Store generated pulse
  await supabase
    .from('daily_pulse')
    .upsert({
      user_id,
      pulse_date,
      payload: pulse,
    });

  return pulse;
}

// ============================================================================
// Row Generation Functions
// ============================================================================

/**
 * Generates expiring opportunity rows
 */
function generateExpiringRows(hunterActions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  const now = new Date();
  const expiringThreshold = new Date(now.getTime() + PULSE_CONSTRAINTS.EXPIRING_THRESHOLD_HOURS * 60 * 60 * 1000);

  return hunterActions
    .filter(action => {
      if (!action.expires_at) return false;
      const expiresAt = new Date(action.expires_at);
      return expiresAt <= expiringThreshold && expiresAt > now;
    })
    .map(action => {
      const expiresAt = new Date(action.expires_at!);
      const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      return {
        kind: 'expiring_opportunity' as PulseCategory,
        title: action.title,
        chip: `${hoursLeft}h left`,
        cta: {
          label: 'Open',
          href: action.cta.href,
        },
        provenance: action.provenance,
        event_time: action.event_time,
        priority: -hoursLeft, // Sooner expiration = higher priority (lower number)
      };
    })
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

/**
 * Generates new opportunity rows
 */
function generateNewRows(actions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  if (!context.last_opened_at) return [];

  const lastOpenedAt = new Date(context.last_opened_at);

  return actions
    .filter(action => {
      const eventTime = new Date(action.event_time);
      return eventTime > lastOpenedAt;
    })
    .map(action => ({
      kind: 'new_opportunity' as PulseCategory,
      title: action.title,
      chip: 'New',
      cta: {
        label: action.cta.kind === 'Review' ? 'View' : action.cta.kind,
        href: action.cta.href,
      },
      provenance: action.provenance,
      event_time: action.event_time,
      priority: new Date(action.event_time).getTime(), // Newer = higher priority
    }))
    .sort((a, b) => b.priority - a.priority) // Sort by newest first
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

/**
 * Generates updated opportunity rows
 */
function generateUpdatedRows(actions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  if (!context.last_opened_at) return [];

  const lastOpenedAt = new Date(context.last_opened_at);

  return actions
    .filter(action => {
      if (!action._updated_at || action._updated_at === action._created_at) return false;
      const updatedAt = new Date(action._updated_at);
      const createdAt = new Date(action._created_at);
      return updatedAt > lastOpenedAt && updatedAt > createdAt;
    })
    .map(action => ({
      kind: 'updated_opportunity' as PulseCategory,
      title: action.title,
      chip: 'Updated',
      cta: {
        label: action.cta.kind === 'Review' ? 'View' : action.cta.kind,
        href: action.cta.href,
      },
      provenance: action.provenance,
      event_time: action.event_time,
      priority: new Date(action._updated_at!).getTime(),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

/**
 * Generates portfolio delta rows
 */
function generatePortfolioDeltaRows(portfolioActions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  // Filter for significant portfolio changes
  return portfolioActions
    .filter(action => {
      // Only include high or critical severity deltas
      return action.severity === 'high' || action.severity === 'critical';
    })
    .map(action => ({
      kind: 'portfolio_delta' as PulseCategory,
      title: action.title,
      cta: {
        label: 'View',
        href: action.cta.href,
      },
      provenance: action.provenance,
      event_time: action.event_time,
      priority: action.severity === 'critical' ? 2 : 1,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

/**
 * Generates Guardian micro-delta rows
 */
function generateGuardianDeltaRows(guardianActions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  if (!context.last_opened_at) return [];

  const lastOpenedAt = new Date(context.last_opened_at);

  return guardianActions
    .filter(action => {
      const eventTime = new Date(action.event_time);
      return eventTime > lastOpenedAt && action.severity !== 'critical'; // Critical handled separately
    })
    .map(action => ({
      kind: 'guardian_delta' as PulseCategory,
      title: action.title,
      chip: action.severity === 'high' ? 'High' : undefined,
      cta: {
        label: 'Review',
        href: action.cta.href,
      },
      provenance: action.provenance,
      event_time: action.event_time,
      priority: action.severity === 'high' ? 2 : 1,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

/**
 * Generates proof/receipt rows
 */
function generateProofRows(proofActions: ActionDraft[], context: PulseGenerationContext): PulseRow[] {
  if (!context.last_opened_at) return [];

  const lastOpenedAt = new Date(context.last_opened_at);

  return proofActions
    .filter(action => {
      const eventTime = new Date(action.event_time);
      return eventTime > lastOpenedAt;
    })
    .map(action => ({
      kind: 'proof_receipt' as PulseCategory,
      title: action.title,
      cta: {
        label: 'View',
        href: action.cta.href,
      },
      provenance: action.provenance,
      event_time: action.event_time,
      priority: new Date(action.event_time).getTime(),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
}

// ============================================================================
// Constraint Application
// ============================================================================

/**
 * Applies pulse constraints: max 8 rows total, max 3 per category
 * Must include at least one of: expiring soon, new since last, or portfolio delta
 */
function applyPulseConstraints(rows: PulseRow[]): PulseRow[] {
  // Group by category
  const byCategory = new Map<PulseCategory, PulseRow[]>();
  for (const row of rows) {
    if (!byCategory.has(row.kind)) {
      byCategory.set(row.kind, []);
    }
    byCategory.get(row.kind)!.push(row);
  }

  // Apply per-category limits
  const limitedRows: PulseRow[] = [];
  const categories = Array.from(byCategory.keys());
  for (const category of categories) {
    const categoryRows = byCategory.get(category)!;
    const limited = categoryRows
      .sort((a, b) => b.priority - a.priority)
      .slice(0, PULSE_CONSTRAINTS.MAX_ROWS_PER_CATEGORY);
    limitedRows.push(...limited);
  }

  // Sort by category priority, then by row priority within category
  limitedRows.sort((a, b) => {
    const categoryPriorityDiff = CATEGORY_PRIORITIES[a.kind] - CATEGORY_PRIORITIES[b.kind];
    if (categoryPriorityDiff !== 0) return categoryPriorityDiff;
    return b.priority - a.priority;
  });

  // Apply total limit
  const finalRows = limitedRows.slice(0, PULSE_CONSTRAINTS.MAX_ROWS_TOTAL);

  // Check minimum content requirement
  const hasRequiredContent = finalRows.some(row => 
    row.kind === 'expiring_opportunity' || 
    row.kind === 'new_opportunity' || 
    row.kind === 'portfolio_delta'
  );

  if (!hasRequiredContent && finalRows.length === 0) {
    // Return empty array - caller will handle "Quiet day" state
    return [];
  }

  return finalRows;
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetches Guardian findings for pulse generation
 */
async function fetchGuardianFindings(context: PulseGenerationContext): Promise<GuardianFindingInput[]> {
  // TODO: Implement actual Guardian API call
  // For now, return empty array
  return [];
}

/**
 * Fetches Hunter opportunities for pulse generation
 */
async function fetchHunterOpportunities(context: PulseGenerationContext): Promise<HunterOpportunityInput[]> {
  // TODO: Implement actual Hunter API call
  // For now, return empty array
  return [];
}

/**
 * Fetches Portfolio deltas for pulse generation
 */
async function fetchPortfolioDeltas(context: PulseGenerationContext): Promise<PortfolioDeltaInput[]> {
  // TODO: Implement actual Portfolio API call
  // For now, return empty array
  return [];
}

/**
 * Fetches Proof receipts for pulse generation
 */
async function fetchProofReceipts(context: PulseGenerationContext): Promise<ProofReceiptInput[]> {
  // TODO: Implement actual Proof API call
  // For now, return empty array
  return [];
}

// ============================================================================
// Timezone Utilities
// ============================================================================

/**
 * Gets the current date in user's timezone
 * 
 * @param timezone - IANA timezone string
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
    timeZone: timezone,
  });
  return formatter.format(now);
}

/**
 * Checks if it's time to generate pulse (9am local time)
 * 
 * @param timezone - IANA timezone string
 * @returns true if it's 9am or later in the user's timezone
 */
export function isPulseGenerationTime(timezone: string): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const currentHour = parseInt(formatter.format(now));
  return currentHour >= 9;
}