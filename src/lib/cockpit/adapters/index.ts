/**
 * Cockpit Source Adapters
 * 
 * Barrel export for all source adapters that convert various data sources
 * into the unified Action model.
 * 
 * Requirements: F2.1, F2.2, F2.3, F2.4, F2.5
 */

// Guardian Adapter
export {
  adaptGuardianFinding,
  adaptGuardianFindings,
} from './guardian-adapter';

// Hunter Adapter
export {
  adaptHunterOpportunity,
  adaptHunterOpportunities,
} from './hunter-adapter';

// Portfolio Adapter
export {
  adaptPortfolioDelta,
  adaptPortfolioDeltas,
} from './portfolio-adapter';

// Action Center Adapter
export {
  adaptActionCenterItem,
  adaptActionCenterItems,
  isActionCenterItemPending,
  countPendingActions,
} from './action-center-adapter';

// Proof/Receipt Adapter
export {
  adaptProofReceipt,
  adaptProofReceipts,
} from './proof-adapter';
