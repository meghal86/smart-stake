/**
 * Feature Cards Example
 * 
 * Example component showing how to use the three feature-specific cards together.
 * This demonstrates the typical layout for the Home page.
 * 
 * This file is for documentation/reference purposes only.
 */

import React from 'react';
import { GuardianFeatureCard } from './GuardianFeatureCard';
import { HunterFeatureCard } from './HunterFeatureCard';
import { HarvestProFeatureCard } from './HarvestProFeatureCard';

/**
 * Feature Cards Grid Example
 * 
 * Shows the three feature cards in a responsive grid layout:
 * - Mobile: Stacked vertically (1 column)
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * 
 * @example
 * ```tsx
 * import { FeatureCardsExample } from '@/components/home/FeatureCardsExample';
 * 
 * function HomePage() {
 *   return (
 *     <div>
 *       <HeroSection />
 *       <FeatureCardsExample />
 *       <TrustBuilders />
 *     </div>
 *   );
 * }
 * ```
 */
export const FeatureCardsExample = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Explore Our Features
        </h2>
        <p className="text-gray-400">
          Secure, hunt, and harvest with AlphaWhale's powerful tools
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GuardianFeatureCard />
        <HunterFeatureCard />
        <HarvestProFeatureCard />
      </div>

      {/* Optional: Feature Comparison Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          All features work seamlessly together to maximize your DeFi strategy
        </p>
      </div>
    </section>
  );
};

/**
 * Compact Feature Cards Example
 * 
 * Shows the cards in a more compact layout for smaller sections.
 */
export const CompactFeatureCardsExample = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <GuardianFeatureCard />
      <HunterFeatureCard />
      <HarvestProFeatureCard />
    </div>
  );
};

/**
 * Stacked Feature Cards Example
 * 
 * Shows the cards stacked vertically for mobile-first layouts.
 */
export const StackedFeatureCardsExample = () => {
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto">
      <GuardianFeatureCard />
      <HunterFeatureCard />
      <HarvestProFeatureCard />
    </div>
  );
};
