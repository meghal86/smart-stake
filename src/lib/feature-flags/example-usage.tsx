/**
 * Example usage of feature flags in different scenarios
 */

import { isFeatureEnabled, getFeatureFlags } from './client';
import { useFeatureFlag, useFeatureFlags } from './hooks';

// ============================================================================
// SERVER-SIDE EXAMPLES (API Routes, Server Components)
// ============================================================================

/**
 * Example 1: Check a single flag in an API route
 */
export async function exampleApiRoute(req: Request) {
  const userId = req.headers.get('x-user-id');
  
  const useNewRanking = await isFeatureEnabled('rankingModelV2', {
    userId: userId || undefined,
  });
  
  if (useNewRanking) {
    // Use new ranking algorithm
    return { ranking: 'v2' };
  } else {
    // Use old ranking algorithm
    return { ranking: 'v1' };
  }
}

/**
 * Example 2: Get all flags for a user
 */
export async function exampleGetAllFlags(userId: string) {
  const flags = await getFeatureFlags({ userId });
  
  return {
    useNewRanking: flags.rankingModelV2,
    useNewEligibility: flags.eligibilityPreviewV2,
    useNewSponsored: flags.sponsoredPlacementV2,
    useNewChipStyle: flags.guardianChipStyleV2,
  };
}

/**
 * Example 3: Conditional logic based on multiple flags
 */
export async function exampleConditionalLogic(userId: string) {
  const flags = await getFeatureFlags({ userId });
  
  if (flags.rankingModelV2 && flags.eligibilityPreviewV2) {
    // Both new features enabled
    return 'full-v2-experience';
  } else if (flags.rankingModelV2) {
    // Only new ranking
    return 'ranking-v2-only';
  } else if (flags.eligibilityPreviewV2) {
    // Only new eligibility
    return 'eligibility-v2-only';
  } else {
    // Old experience
    return 'v1-experience';
  }
}

// ============================================================================
// CLIENT-SIDE EXAMPLES (React Components)
// ============================================================================

/**
 * Example 4: Use a single flag in a component
 */
export function ExampleComponent1({ userId }: { userId?: string }) {
  const { enabled, loading } = useFeatureFlag('rankingModelV2', { userId });
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {enabled ? (
        <NewRankingComponent />
      ) : (
        <OldRankingComponent />
      )}
    </div>
  );
}

/**
 * Example 5: Use all flags in a component
 */
export function ExampleComponent2({ userId }: { userId?: string }) {
  const { flags, loading } = useFeatureFlags({ userId });
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {flags.rankingModelV2 && <NewRankingBadge />}
      {flags.eligibilityPreviewV2 && <EnhancedEligibilityPreview />}
      {flags.guardianChipStyleV2 ? (
        <NewGuardianChip />
      ) : (
        <OldGuardianChip />
      )}
    </div>
  );
}

/**
 * Example 6: Conditional rendering with multiple flags
 */
export function ExampleComponent3({ userId }: { userId?: string }) {
  const { flags, loading } = useFeatureFlags({ userId });
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Show beta badge if any v2 features are enabled
  const hasBetaFeatures = flags.rankingModelV2 || 
                          flags.eligibilityPreviewV2 || 
                          flags.guardianChipStyleV2;
  
  return (
    <div>
      {hasBetaFeatures && <BetaBadge />}
      <MainContent flags={flags} />
    </div>
  );
}

// ============================================================================
// PLACEHOLDER COMPONENTS (for examples)
// ============================================================================

function NewRankingComponent() {
  return <div>New Ranking (V2)</div>;
}

function OldRankingComponent() {
  return <div>Old Ranking (V1)</div>;
}

function NewRankingBadge() {
  return <span className="badge">New Ranking</span>;
}

function EnhancedEligibilityPreview() {
  return <div>Enhanced Eligibility Preview</div>;
}

function NewGuardianChip() {
  return <div className="chip-v2">Guardian Trust</div>;
}

function OldGuardianChip() {
  return <div className="chip-v1">Guardian Trust</div>;
}

function BetaBadge() {
  return <span className="badge beta">Beta</span>;
}

function MainContent({ flags }: { flags: any }) {
  return <div>Main Content (flags: {JSON.stringify(flags)})</div>;
}
