/**
 * RightRail Component Example
 * 
 * Demonstrates the RightRail component in a typical Hunter page layout.
 * This example shows how the component integrates with the main feed.
 */

import React from 'react';
import { RightRail } from './RightRail';

export function RightRailExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#111827]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-white mb-6">
                Hunter Screen
              </h1>
              
              {/* Placeholder for opportunity cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <div className="h-32 flex items-center justify-center text-gray-400">
                      Opportunity Card {i}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Rail - Hidden on mobile/tablet, visible on desktop */}
          <RightRail />
        </div>
      </div>
    </div>
  );
}

/**
 * Example with custom styling
 */
export function RightRailCustomExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#111827]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <main className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-6">
              Custom Layout Example
            </h1>
            <p className="text-gray-400 mb-8">
              The RightRail component automatically hides on screens smaller than 1280px.
              Try resizing your browser window to see the responsive behavior.
            </p>
          </main>

          {/* Custom styled RightRail */}
          <RightRail className="sticky top-4 self-start" />
        </div>
      </div>
    </div>
  );
}

/**
 * Example showing responsive breakpoints
 */
export function RightRailResponsiveExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#111827] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Responsive Behavior Demo
        </h1>
        
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Current breakpoint behavior:</strong>
          </p>
          <ul className="text-blue-200 text-sm mt-2 space-y-1">
            <li>• Mobile (&lt;768px): RightRail hidden</li>
            <li>• Tablet (768px-1279px): RightRail hidden</li>
            <li>• Desktop (≥1280px): RightRail visible</li>
          </ul>
        </div>

        <div className="flex gap-6">
          <main className="flex-1 bg-white/5 rounded-2xl p-6">
            <p className="text-gray-300">Main content area</p>
          </main>
          
          <RightRail />
        </div>
      </div>
    </div>
  );
}

export default RightRailExample;
