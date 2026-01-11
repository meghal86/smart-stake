/**
 * Cockpit Library
 * 
 * Main barrel export for the Authenticated Decision Cockpit library.
 * 
 * This library provides:
 * - Unified Action model types
 * - Source adapters for Guardian, Hunter, Portfolio, Action Center, and Proof
 * - Action scoring and ranking service
 * - Today Card state machine
 * 
 * Requirements: F1, F2, 3.3, 3.4, 6.1, 6.2, 6.9
 */

// Types
export * from './types';

// Adapters
export * from './adapters';

// Scoring and Ranking
export * from './scoring';

// Today Card State Machine
export * from './today-card';
