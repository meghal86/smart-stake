/**
 * Three Block Layout Component
 * 
 * Enforces exactly three blocks on /cockpit main surface:
 * 1. App Shell chrome (existing header/layout, out of scope)
 * 2. Today Card
 * 3. Action Preview
 * 
 * All other content is behind single tap access (Peek Drawer, Insights Sheet).
 * 
 * Requirements: 2.1, 2.2
 */

import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

// ============================================================================
// Types
// ============================================================================

interface ThreeBlockLayoutProps {
  /** Today Card component */
  todayCard: ReactNode;
  /** Action Preview component */
  actionPreview: ReactNode;
  /** Additional content (drawers, sheets) that don't count as blocks */
  additionalContent?: ReactNode;
}

// ============================================================================
// Layout Validation
// ============================================================================

/**
 * Validates that we have exactly the required blocks.
 * In development, this helps catch layout violations.
 */
function validateLayout(todayCard: ReactNode, actionPreview: ReactNode) {
  if (process.env.NODE_ENV === 'development') {
    if (!todayCard) {
      console.warn('ThreeBlockLayout: Missing Today Card block');
    }
    if (!actionPreview) {
      console.warn('ThreeBlockLayout: Missing Action Preview block');
    }
  }
}

// ============================================================================
// Error Fallback
// ============================================================================

const LayoutErrorFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <Card className="bg-red-500/10 backdrop-blur-md border border-red-500/20 p-6 max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <span className="text-sm text-red-100">Layout Error</span>
      </div>
      
      <div className="text-white font-medium mb-2">
        Invalid Layout Configuration
      </div>
      
      <div className="text-sm text-slate-300">
        {message}
      </div>
    </Card>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ThreeBlockLayout: React.FC<ThreeBlockLayoutProps> = ({
  todayCard,
  actionPreview,
  additionalContent,
}) => {
  // Validate layout in development
  validateLayout(todayCard, actionPreview);
  
  // Ensure we have the required blocks
  if (!todayCard || !actionPreview) {
    return (
      <LayoutErrorFallback 
        message="The cockpit requires exactly three blocks: App Shell chrome, Today Card, and Action Preview. Some blocks are missing."
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 
        Three-block layout enforcement:
        1. App Shell chrome (handled by parent layout, out of scope)
        2. Today Card (required)
        3. Action Preview (required)
      */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Block 2: Today Card */}
        <div data-testid="today-card-block">
          {todayCard}
        </div>

        {/* Block 3: Action Preview */}
        <div data-testid="action-preview-block">
          {actionPreview}
        </div>
      </div>

      {/* Additional content (drawers, sheets) - NOT counted as blocks */}
      {additionalContent}
    </div>
  );
};

export default ThreeBlockLayout;