# HarvestPro Detail Modal - Testing Guide

## Quick Start Testing

### Option 1: Visual Testing in Storybook (Recommended)

Create a Storybook story to visually test the modal:

```bash
# Install Storybook if not already installed
npx storybook@latest init
```

Create `src/components/harvestpro/HarvestDetailModal.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { HarvestDetailModal } from './HarvestDetailModal';
import type { HarvestOpportunity } from '@/types/harvestpro';

const mockOpportunity: HarvestOpportunity = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  lotId: 'lot-123',
  userId: 'user-456',
  token: 'ETH',
  tokenLogoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  riskLevel: 'LOW',
  unrealizedLoss: 500.00,
  remainingQty: 2.5,
  gasEstimate: 15.00,
  slippageEstimate: 5.00,
  tradingFees: 2.50,
  netTaxBenefit: 97.50,
  guardianScore: 8.5,
  executionTimeEstimate: '5-10 min',
  confidence: 95,
  recommendationBadge: 'recommended',
  metadata: {
    walletName: 'Main Wallet',
    venue: 'Uniswap',
    reasons: ['High net benefit', 'Low risk', 'Good liquidity']
  },
  createdAt: '2025-02-01T10:00:00.000Z',
  updatedAt: '2025-02-01T10:00:00.000Z',
};

const meta: Meta<typeof HarvestDetailModal> = {
  title: 'HarvestPro/HarvestDetailModal',
  component: HarvestDetailModal,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof HarvestDetailModal>;

export const Default: Story = {
  args: {
    opportunity: mockOpportunity,
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onExecute: (id) => console.log('Execute clicked:', id),
    isExecuting: false,
  },
};

export const HighRisk: Story = {
  args: {
    opportunity: {
      ...mockOpportunity,
      riskLevel: 'HIGH',
      guardianScore: 2.5,
      slippageEstimate: 50.00,
    },
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onExecute: (id) => console.log('Execute clicked:', id),
  },
};

export const NegativeBenefit: Story = {
  args: {
    opportunity: {
      ...mockOpportunity,
      netTaxBenefit: -25.00,
      gasEstimate: 150.00,
    },
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onExecute: (id) => console.log('Execute clicked:', id),
  },
};

export const CEXOpportunity: Story = {
  args: {
    opportunity: {
      ...mockOpportunity,
      metadata: {
        walletName: 'Binance Account',
        venue: 'Binance',
        reasons: ['CEX execution', 'Manual process']
      }
    },
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onExecute: (id) => console.log('Execute clicked:', id),
  },
};

export const Executing: Story = {
  args: {
    opportunity: mockOpportunity,
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onExecute: (id) => console.log('Execute clicked:', id),
    isExecuting: true,
  },
};
```

Run Storybook:
```bash
npm run storybook
```

### Option 2: Quick Browser Test

Create a test page at `src/pages/TestHarvestModal.tsx`:

```typescript
import { useState } from 'react';
import { HarvestDetailModal } from '@/components/harvestpro';
import { Button } from '@/components/ui/button';
import type { HarvestOpportunity } from '@/types/harvestpro';

const mockOpportunities: HarvestOpportunity[] = [
  {
    id: '1',
    lotId: 'lot-1',
    userId: 'user-1',
    token: 'ETH',
    tokenLogoUrl: null,
    riskLevel: 'LOW',
    unrealizedLoss: 500.00,
    remainingQty: 2.5,
    gasEstimate: 15.00,
    slippageEstimate: 5.00,
    tradingFees: 2.50,
    netTaxBenefit: 97.50,
    guardianScore: 8.5,
    executionTimeEstimate: '5-10 min',
    confidence: 95,
    recommendationBadge: 'recommended',
    metadata: {
      walletName: 'Main Wallet',
      venue: 'Uniswap',
      reasons: ['High net benefit', 'Low risk']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    lotId: 'lot-2',
    userId: 'user-1',
    token: 'BTC',
    tokenLogoUrl: null,
    riskLevel: 'HIGH',
    unrealizedLoss: 1000.00,
    remainingQty: 0.5,
    gasEstimate: 25.00,
    slippageEstimate: 50.00,
    tradingFees: 5.00,
    netTaxBenefit: 160.00,
    guardianScore: 2.5,
    executionTimeEstimate: '10-15 min',
    confidence: 75,
    recommendationBadge: 'guardian-flagged',
    metadata: {
      walletName: 'Hardware Wallet',
      venue: 'Uniswap',
      reasons: ['High risk', 'Low Guardian score']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    lotId: 'lot-3',
    userId: 'user-1',
    token: 'USDC',
    tokenLogoUrl: null,
    riskLevel: 'MEDIUM',
    unrealizedLoss: 200.00,
    remainingQty: 200,
    gasEstimate: 100.00,
    slippageEstimate: 10.00,
    tradingFees: 5.00,
    netTaxBenefit: -67.00,
    guardianScore: 5.0,
    executionTimeEstimate: '5 min',
    confidence: 85,
    recommendationBadge: 'not-recommended',
    metadata: {
      walletName: 'Binance',
      venue: 'Binance',
      reasons: ['CEX execution', 'Negative benefit']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function TestHarvestModal() {
  const [selectedOpp, setSelectedOpp] = useState<HarvestOpportunity | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async (id: string) => {
    console.log('Executing harvest for:', id);
    setIsExecuting(true);
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExecuting(false);
    setSelectedOpp(null);
    alert('Harvest executed successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          HarvestDetailModal Test Page
        </h1>
        
        <div className="space-y-4">
          {mockOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-6 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {opp.token} - {opp.riskLevel} Risk
                  </h3>
                  <p className="text-gray-400">
                    Loss: ${opp.unrealizedLoss} | Benefit: ${opp.netTaxBenefit}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Venue: {opp.metadata.venue} | Guardian: {opp.guardianScore}/10
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedOpp(opp)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        <HarvestDetailModal
          opportunity={selectedOpp}
          isOpen={!!selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onExecute={handleExecute}
          isExecuting={isExecuting}
        />
      </div>
    </div>
  );
}
```

Add route to `src/App.tsx` or your router:
```typescript
<Route path="/test-modal" element={<TestHarvestModal />} />
```

Visit: `http://localhost:3000/test-modal`

### Option 3: Integration with Existing HarvestPro Page

Update `src/pages/HarvestPro.tsx` to include the modal:

```typescript
import { useState } from 'react';
import { HarvestDetailModal } from '@/components/harvestpro';

export default function HarvestPro() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async (opportunityId: string) => {
    setIsExecuting(true);
    try {
      // TODO: Call API to create harvest session
      console.log('Executing harvest:', opportunityId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSelectedOpportunity(null);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div>
      {/* Your existing HarvestPro content */}
      
      {/* Add modal */}
      <HarvestDetailModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onExecute={handleExecute}
        isExecuting={isExecuting}
      />
    </div>
  );
}
```

## Automated Testing

### Unit Tests with Vitest + React Testing Library

Create `src/components/harvestpro/__tests__/HarvestDetailModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HarvestDetailModal } from '../HarvestDetailModal';
import type { HarvestOpportunity } from '@/types/harvestpro';

const mockOpportunity: HarvestOpportunity = {
  id: 'test-id',
  lotId: 'lot-123',
  userId: 'user-456',
  token: 'ETH',
  tokenLogoUrl: null,
  riskLevel: 'LOW',
  unrealizedLoss: 500.00,
  remainingQty: 2.5,
  gasEstimate: 15.00,
  slippageEstimate: 5.00,
  tradingFees: 2.50,
  netTaxBenefit: 97.50,
  guardianScore: 8.5,
  executionTimeEstimate: '5-10 min',
  confidence: 95,
  recommendationBadge: 'recommended',
  metadata: {
    walletName: 'Main Wallet',
    venue: 'Uniswap',
    reasons: []
  },
  createdAt: '2025-02-01T10:00:00.000Z',
  updatedAt: '2025-02-01T10:00:00.000Z',
};

describe('HarvestDetailModal', () => {
  it('should render when open', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Harvest ETH/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={false}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.queryByText(/Harvest ETH/i)).not.toBeInTheDocument();
  });

  it('should show warning banner for high risk', () => {
    const highRiskOpp = { ...mockOpportunity, riskLevel: 'HIGH' as const };
    
    render(
      <HarvestDetailModal
        opportunity={highRiskOpp}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.getByText(/High Risk Detected/i)).toBeInTheDocument();
  });

  it('should not show warning banner for low risk', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.queryByText(/High Risk Detected/i)).not.toBeInTheDocument();
  });

  it('should call onExecute when execute button clicked', () => {
    const onExecute = vi.fn();
    
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={onExecute}
      />
    );
    
    const executeButton = screen.getByText(/Execute Harvest/i);
    fireEvent.click(executeButton);
    
    expect(onExecute).toHaveBeenCalledWith(mockOpportunity.id);
  });

  it('should call onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={onClose}
        onExecute={vi.fn()}
      />
    );
    
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should disable execute button for negative net benefit', () => {
    const negativeOpp = { ...mockOpportunity, netTaxBenefit: -50 };
    
    render(
      <HarvestDetailModal
        opportunity={negativeOpp}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    const executeButton = screen.getByText(/Execute Harvest/i);
    expect(executeButton).toBeDisabled();
  });

  it('should show executing state', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
        isExecuting={true}
      />
    );
    
    expect(screen.getByText(/Executing.../i)).toBeInTheDocument();
  });

  it('should display correct summary metrics', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.getByText('$500.00')).toBeInTheDocument(); // Unrealized Loss
    expect(screen.getByText('$97.50')).toBeInTheDocument(); // Net Benefit
    expect(screen.getByText('LOW')).toBeInTheDocument(); // Risk Level
  });

  it('should generate DEX execution steps', () => {
    render(
      <HarvestDetailModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/Approve Token/i)).toBeInTheDocument();
    expect(screen.getByText(/Execute Swap/i)).toBeInTheDocument();
  });

  it('should generate CEX execution steps', () => {
    const cexOpp = {
      ...mockOpportunity,
      metadata: { ...mockOpportunity.metadata, venue: 'Binance' }
    };
    
    render(
      <HarvestDetailModal
        opportunity={cexOpp}
        isOpen={true}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Review CEX Instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/Execute Sell Order/i)).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm run test -- HarvestDetailModal.test.tsx
```

## Manual Testing Checklist

### Visual Testing

- [ ] **Modal Opens Correctly**
  - Click opportunity card
  - Modal appears with smooth animation
  - Backdrop is visible and blurred

- [ ] **Responsive Design**
  - Desktop: Centered modal, max-width 2xl
  - Tablet: Centered modal, slightly smaller
  - Mobile: Full-screen modal, no rounded corners

- [ ] **Header Section**
  - Token symbol displays correctly
  - Close button (X) is visible
  - Title shows "Harvest {TOKEN}"

- [ ] **Warning Banner (High Risk)**
  - Only shows for HIGH risk opportunities
  - Amber/yellow color scheme
  - Shows Guardian score
  - Animated entrance

- [ ] **Summary Section**
  - Unrealized Loss shows in red
  - Net Benefit shows in green
  - Risk badge has correct color (LOW=green, MEDIUM=amber, HIGH=red)
  - Execution time displays
  - Confidence percentage shows

- [ ] **Execution Steps**
  - Steps are numbered 1-4
  - DEX steps show for Uniswap/DEX venues
  - CEX steps show for Binance/Coinbase/Kraken
  - Guardian scores show for on-chain steps
  - Steps have hover effect

- [ ] **Cost Breakdown**
  - Tax Savings shows in green with +
  - Gas Cost shows in red with -
  - Slippage shows in red with -
  - Trading Fees shows in red with -
  - Net Benefit total is correct
  - Efficiency percentage calculates correctly

- [ ] **Action Buttons**
  - Cancel button works
  - Execute button works
  - Execute button disabled for negative benefit
  - Loading state shows spinner
  - Warning message shows for negative benefit

### Interaction Testing

- [ ] **Click Execute**
  - onExecute callback fires
  - Correct opportunity ID passed
  - Loading state activates

- [ ] **Click Cancel**
  - onClose callback fires
  - Modal closes with animation

- [ ] **Click Backdrop**
  - Modal closes (if enabled)

- [ ] **Press ESC Key**
  - Modal closes

- [ ] **Tab Navigation**
  - Can tab through interactive elements
  - Focus trap works correctly

### Edge Cases

- [ ] **Null Opportunity**
  - Modal doesn't render
  - No errors in console

- [ ] **Negative Net Benefit**
  - Execute button is disabled
  - Warning message displays

- [ ] **Very Large Numbers**
  - Currency formats correctly
  - No overflow issues

- [ ] **Very Long Token Names**
  - Text doesn't overflow
  - Layout remains intact

- [ ] **Missing Metadata**
  - Gracefully handles missing venue
  - Gracefully handles missing wallet name

## Browser Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Testing

```bash
# Check bundle size
npm run build
# Look for HarvestDetailModal in bundle analysis

# Check render performance
# Open React DevTools Profiler
# Record interaction with modal
# Check for unnecessary re-renders
```

## Accessibility Testing

- [ ] **Keyboard Navigation**
  ```
  Tab - Move to next element
  Shift+Tab - Move to previous element
  ESC - Close modal
  Enter - Activate button
  ```

- [ ] **Screen Reader**
  - Install NVDA (Windows) or VoiceOver (Mac)
  - Navigate through modal
  - Verify all content is announced
  - Check ARIA labels

- [ ] **Color Contrast**
  - Use browser DevTools
  - Check contrast ratios
  - Verify AA compliance

## Quick Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- HarvestDetailModal.test.tsx

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Debugging Tips

### Modal Not Appearing

1. Check `isOpen` prop is `true`
2. Check `opportunity` prop is not `null`
3. Check z-index conflicts
4. Check console for errors

### Styling Issues

1. Verify Tailwind CSS is configured
2. Check if `cn()` utility is working
3. Verify Framer Motion is installed
4. Check for CSS conflicts

### Animation Issues

1. Check Framer Motion version
2. Verify `initial`, `animate`, `exit` props
3. Check if `AnimatePresence` is used (if needed)

### TypeScript Errors

1. Verify all imports are correct
2. Check `HarvestOpportunity` type matches
3. Verify prop types match interface
4. Run `npm run type-check`

## Next Steps

After testing the modal:

1. **Integrate with API** - Connect to `/api/harvest/sessions` endpoint
2. **Add Real Execution** - Implement actual harvest execution logic
3. **Add Success/Error States** - Show feedback after execution
4. **Add Analytics** - Track modal opens, executions, cancellations
5. **Add E2E Tests** - Create Playwright/Cypress tests

## Support

If you encounter issues:

1. Check console for errors
2. Verify all dependencies are installed
3. Check that Button and Dialog components exist
4. Verify types are correctly imported
5. Check that Framer Motion is installed

Need help? Check the completion document at `.kiro/specs/harvestpro/TASK_14_COMPLETION.md`
