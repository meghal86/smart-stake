# CEX Manual Execution Flow

## Overview

The CEX Manual Execution Flow enables users to harvest tax losses from centralized exchange (CEX) holdings through guided, step-by-step instructions. Since most CEX platforms don't support automated API trading for security reasons, this flow provides detailed manual instructions tailored to each platform.

## Requirements Coverage

This implementation satisfies Requirements 9.1-9.5:

- **9.1**: Display CEX instruction panel in execution flow
- **9.2**: Provide numbered steps specific to exchange platform
- **9.3**: Include exact token pair, quantity, and order type
- **9.4**: Update step status when user marks complete
- **9.5**: Proceed to success screen when all steps complete

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CEXExecutionPanel                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Trade Details Summary (Req 9.3)                 │  │
│  │  - Token Pair (e.g., ETH/USDT)                   │  │
│  │  - Order Type (Market Sell)                      │  │
│  │  - Quantity (0.12345678 ETH)                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Step 1: Log in to Binance                       │  │
│  │  Platform-specific instructions (Req 9.2)        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Step 2: Navigate to ETH/USDT                    │  │
│  │  Platform-specific instructions (Req 9.2)        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Step 3: Place market sell order                │  │
│  │  Platform-specific instructions (Req 9.2)        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Step 4: Confirm order execution                 │  │
│  │  Platform-specific instructions (Req 9.2)        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Open Binance] (Direct link to trading pair)          │
└─────────────────────────────────────────────────────────┘
```

## Components

### CEXExecutionPanel

Main component for displaying CEX manual execution instructions.

**Props:**
```typescript
interface CEXExecutionPanelProps {
  steps: ExecutionStep[];
  onStepComplete: (stepId: string) => void;
  onAllComplete: () => void;
}
```

**Features:**
- Progress tracking with visual progress bar
- Trade details summary (token pair, quantity, order type)
- Platform-specific instructions for each step
- Step completion checkboxes
- Direct link to exchange trading page

**Usage:**
```tsx
import { CEXExecutionPanel } from '@/components/harvestpro';

<CEXExecutionPanel
  steps={cexSteps}
  onStepComplete={(stepId) => {
    console.log('Step completed:', stepId);
    // Update session in backend
  }}
  onAllComplete={() => {
    console.log('All CEX steps complete');
    // Navigate to success screen
  }}
/>
```

### useCEXExecution Hook

React hook for managing CEX execution state.

**Usage:**
```tsx
import { useCEXExecution } from '@/hooks/useCEXExecution';

const {
  cexSteps,
  completedSteps,
  progress,
  isAllComplete,
  completeStep,
  uncompleteStep,
  resetProgress,
} = useCEXExecution({
  session,
  onStepComplete: (stepId) => {
    // Handle step completion
  },
  onAllComplete: () => {
    // Navigate to success screen
  },
  onError: (error) => {
    // Handle errors
  },
});
```

## Service Functions

### generateCEXExecutionSteps

Generate CEX execution steps with detailed metadata.

```typescript
import { generateCEXExecutionSteps } from '@/lib/harvestpro/cex-execution';

const steps = generateCEXExecutionSteps(
  sessionId,
  'Binance',
  'ETH',
  0.12345678,
  'ETH/USDT'
);
```

### markStepComplete

Mark a CEX step as complete.

```typescript
import { markStepComplete } from '@/lib/harvestpro/cex-execution';

const updatedSteps = markStepComplete(steps, stepId);
```

### areAllCEXStepsComplete

Check if all CEX steps are complete.

```typescript
import { areAllCEXStepsComplete } from '@/lib/harvestpro/cex-execution';

if (areAllCEXStepsComplete(session.executionSteps)) {
  // Navigate to success screen
}
```

### hasCEXSteps

Check if session has CEX steps.

```typescript
import { hasCEXSteps } from '@/lib/harvestpro/cex-execution';

if (hasCEXSteps(session)) {
  // Show CEX execution panel
}
```

## Platform-Specific Instructions

The system provides tailored instructions for each supported exchange:

### Binance
- Login: "Go to binance.com and log in with your email and password. Complete 2FA if enabled."
- Navigate: "Click 'Trade' → 'Spot' in the top menu, then search for ETH/USDT in the trading pair selector."
- Order: "In the order panel, select 'Sell' → 'Market'. Enter the exact quantity shown above and click 'Sell'."
- Confirm: "Check 'Order History' to verify the order was filled. Note the average execution price."

### Coinbase
- Login: "Visit coinbase.com and sign in with your credentials. Verify with 2FA if required."
- Navigate: "Click 'Trade' in the main navigation, then select ETH/USDT from the trading pairs list."
- Order: "Select 'Sell' in the order form. Choose 'Market' order type, enter the quantity, and click 'Preview Sell'."
- Confirm: "View 'Recent Activity' to confirm the order executed. Record the fill price for your records."

### Kraken
- Login: "Navigate to kraken.com and log in. Complete any security verification steps."
- Navigate: "Go to 'Trade' → 'Spot' and search for ETH/USDT in the pair selector."
- Order: "Click 'Sell' tab, select 'Market' order, input the quantity, and click 'Submit Order'."
- Confirm: "Go to 'Orders' → 'Order History' to verify completion. Save the execution details."

### Binance.US
- Login: "Go to binance.us and log in with your account credentials."
- Navigate: "Navigate to 'Trade' → 'Spot Trading' and find ETH/USDT in the markets list."
- Order: "Choose 'Sell' → 'Market Order', enter the quantity, and click 'Sell'."
- Confirm: "Check 'Order History' under 'Orders' to confirm the trade executed successfully."

## Integration with Harvest Flow

### 1. Detect CEX Holdings

```typescript
import { hasCEXSteps } from '@/lib/harvestpro/cex-execution';

if (hasCEXSteps(session)) {
  // Show CEX execution panel
  setShowCEXPanel(true);
}
```

### 2. Display CEX Panel

```tsx
{showCEXPanel && (
  <CEXExecutionPanel
    steps={getCEXSteps(session)}
    onStepComplete={handleStepComplete}
    onAllComplete={handleAllComplete}
  />
)}
```

### 3. Handle Step Completion

```typescript
const handleStepComplete = async (stepId: string) => {
  // Update session in backend
  await fetch(`/api/harvest/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      stepId,
      status: 'completed',
    }),
  });
};
```

### 4. Navigate to Success Screen

```typescript
const handleAllComplete = () => {
  // All CEX steps complete, navigate to success
  router.push(`/harvestpro/success/${sessionId}`);
};
```

## Step Metadata Structure

Each CEX step includes rich metadata for display:

```typescript
{
  id: 'session-123-cex-3',
  sessionId: 'session-123',
  stepNumber: 3,
  description: 'Place market sell order for 0.12345678 ETH',
  type: 'cex-manual',
  status: 'pending',
  cexPlatform: 'Binance',
  metadata: {
    instruction: 'Execute a market sell order at current market price',
    orderType: 'Market Sell',
    token: 'ETH',
    quantity: 0.12345678,
    tokenPair: 'ETH/USDT',
    platform: 'Binance',
  },
}
```

## Error Handling

### Step Validation

```typescript
import { validateStepCompletion } from '@/lib/harvestpro/cex-execution';

const validation = validateStepCompletion(step, allSteps);
if (!validation.valid) {
  showError(validation.error);
  return;
}
```

### Common Errors

- **Previous step not complete**: "Please complete previous steps first"
- **Step not found**: "Step not found"
- **Invalid step status**: "Cannot complete this step"

## Testing

### Unit Tests

```typescript
import { generateCEXExecutionSteps, markStepComplete } from '@/lib/harvestpro/cex-execution';

describe('CEX Execution', () => {
  it('should generate 4 steps for CEX execution', () => {
    const steps = generateCEXExecutionSteps('session-1', 'Binance', 'ETH', 0.5);
    expect(steps).toHaveLength(4);
  });

  it('should mark step as complete', () => {
    const steps = generateCEXExecutionSteps('session-1', 'Binance', 'ETH', 0.5);
    const updated = markStepComplete(steps, steps[0].id);
    expect(updated[0].status).toBe('completed');
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CEXExecutionPanel } from '@/components/harvestpro';

describe('CEXExecutionPanel', () => {
  it('should display trade details', () => {
    render(<CEXExecutionPanel steps={mockSteps} onStepComplete={jest.fn()} onAllComplete={jest.fn()} />);
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByText('Market Sell')).toBeInTheDocument();
  });

  it('should call onStepComplete when step is clicked', () => {
    const onStepComplete = jest.fn();
    render(<CEXExecutionPanel steps={mockSteps} onStepComplete={onStepComplete} onAllComplete={jest.fn()} />);
    
    fireEvent.click(screen.getByText(/Log in to Binance/));
    expect(onStepComplete).toHaveBeenCalledWith(mockSteps[0].id);
  });
});
```

## Future Enhancements

1. **Automated CEX Execution**: Direct API execution for supported exchanges
2. **Screenshot Upload**: Allow users to upload proof of execution
3. **Order Verification**: Verify order execution via CEX API
4. **Multi-Step Undo**: Allow users to undo multiple steps
5. **Time Tracking**: Track time spent on each step
6. **Video Tutorials**: Embedded video guides for each platform
7. **Live Chat Support**: In-panel support for execution issues

## Related Files

- `src/components/harvestpro/CEXExecutionPanel.tsx` - Main component
- `src/lib/harvestpro/cex-execution.ts` - Service functions
- `src/hooks/useCEXExecution.ts` - React hook
- `src/types/harvestpro.ts` - Type definitions
- `src/lib/harvestpro/action-engine-simulator.ts` - Step generation

## Support

For issues or questions about CEX execution:
1. Check the platform-specific instructions
2. Verify trade details are correct
3. Ensure previous steps are completed
4. Contact support if order fails to execute
