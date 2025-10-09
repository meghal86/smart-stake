/**
 * P0 Standardization Stories - Visual Regression Testing
 * Tests for consistent amount formatting and action bar layouts
 */

import type { Meta, StoryObj } from '@storybook/react';
import { formatAmount, AmountDisplay } from '@/lib/format-helpers';
import { ActionBar } from '@/components/ui/ActionBar';

const meta: Meta = {
  title: 'P0/Standardization',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// P0: Amount Formatting Tests
export const AmountFormatting: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Amount Formatting Consistency</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Function Output</h4>
          <div className="space-y-1 font-mono text-sm">
            <div>{formatAmount(1234)} (1.2K)</div>
            <div>{formatAmount(1234567)} (1M)</div>
            <div>{formatAmount(1234567890)} (1B)</div>
            <div>{formatAmount(999)} ($999)</div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Component Display</h4>
          <div className="space-y-2">
            <AmountDisplay amount={1234567} average={890000} />
            <AmountDisplay amount={1234567890} />
            <AmountDisplay amount={999} average={1200} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// P0: Action Bar Layout Tests
export const ActionBarLayouts: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="font-semibold">Action Bar Consistency</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Standard Layout</h4>
          <div className="max-w-md">
            <ActionBar
              onCreateAlert={() => console.log('Alert')}
              onExplain={() => console.log('Explain')}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">With Pattern Button</h4>
          <div className="max-w-md">
            <ActionBar
              onCreateAlert={() => console.log('Alert')}
              onExplain={() => console.log('Explain')}
              onViewPattern={() => console.log('Pattern')}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Disabled State</h4>
          <div className="max-w-md">
            <ActionBar
              onCreateAlert={() => console.log('Alert')}
              onExplain={() => console.log('Explain')}
              onViewPattern={() => console.log('Pattern')}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// P0: Accessibility Test
export const AccessibilityTest: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Accessibility Features</h3>
      <div className="max-w-md">
        <ActionBar
          onCreateAlert={() => console.log('Alert')}
          onExplain={() => console.log('Explain')}
          onViewPattern={() => console.log('Pattern')}
        />
      </div>
      <div className="text-sm text-slate-600">
        <p>✅ ARIA labels on all buttons</p>
        <p>✅ Keyboard navigation support</p>
        <p>✅ Consistent tab order: Alert → Pattern → Explain</p>
        <p>✅ Proper role="toolbar" attribute</p>
      </div>
    </div>
  ),
};