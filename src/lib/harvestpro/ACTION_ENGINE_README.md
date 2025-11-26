# Action Engine Implementation

## Overview

The Action Engine is responsible for executing harvest transactions, both on-chain and through manual CEX instructions. This implementation includes a simulator for development/testing and the integration layer for the real Action Engine.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                            │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ ActionEngineModal│  │ CEXExecutionPanel│                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                       │
│              ┌───────▼────────┐                             │
│              │ useActionEngine │                             │
│              │     Hook        │                             │
│              └───────┬────────┘                             │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                Service Layer                                 │
│  ┌────────────────────▼─────────────────────┐               │
│  │  action-engine-simulator.ts              │               │
│  │  - simulateStepExecution()               │               │
│  │  - simulateSessionExecution()            │               │
│  │  - simulateRetry()                       │               │
│  │  - createMockExecutionSteps()            │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  Real Action Engine Integration          │               │
│  │  (TODO: Implement when available)        │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. ActionEngineModal

**Location:** `src/components/harvestpro/ActionEngineModal.tsx`

**Purpose:** Main modal for transaction confirmation and execution tracking.

**Features:**
- Transaction confirmation UI
- Per-step execution tracking with real-time updates
- Spinner animations and loading states
- Per-step Guardian scores display
- Transaction success/failure handling
- Execution logs panel for advanced users
- Retry functionality for failed steps

**Props:**
```typescript
interface ActionEngineModalProps {
  session: HarvestSession;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (session: HarvestSession) => void;
  onError: (error: string) => void;
  useSimulator?: boolean;
  simulatorConfig?: SimulationConfig;
}
```

**Usage:**
```tsx
import { ActionEngineModal } from '@/components/harvestpro';

<ActionEngineModal
  session={harvestSession}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onComplete={(updatedSession) => {
    console.log('Harvest completed!', updatedSession);
    // Navigate to success screen
  }}
  onError={(error) => {
    console.error('Execution failed:', error);
  }}
  useSimulator={true}
  simulatorConfig={{
    stepDelay: 2000,
    failureProbability: 0.1,
    verbose: true,
  }}
/>
```

### 2. CEXExecutionPanel

**Location:** `src/components/harvestpro/CEXExecutionPanel.tsx`

**Purpose:** Manual execution instructions for CEX holdings.

**Features:**
- Platform-specific step-by-step instructions
- Step completion tracking
- Progress visualization
- Platform links for quick access
- Contextual help for each step

**Props:**
```typescript
interface CEXExecutionPanelProps {
  steps: ExecutionStep[];
  onStepComplete: (stepId: string) => void;
  onAllComplete: () => void;
}
```

**Usage:**
```tsx
import { CEXExecutionPanel } from '@/components/harvestpro';

<CEXExecutionPanel
  steps={cexSteps}
  onStepComplete={(stepId) => {
    console.log('Step completed:', stepId);
  }}
  onAllComplete={() => {
    console.log('All CEX steps completed!');
    // Proceed to success screen
  }}
/>
```

### 3. useActionEngine Hook

**Location:** `src/hooks/useActionEngine.ts`

**Purpose:** React hook for managing Action Engine execution state.

**Features:**
- Execution state management
- Step-by-step progress tracking
- Error handling and retry logic
- Execution logs collection
- Mock step generation for testing

**Usage:**
```tsx
import { useActionEngine } from '@/hooks/useActionEngine';

function HarvestExecutionFlow() {
  const {
    isExecuting,
    currentStepIndex,
    logs,
    error,
    executeSession,
    retryExecution,
    clearError,
    generateMockSteps,
  } = useActionEngine({
    useSimulator: true,
    simulatorConfig: {
      stepDelay: 2000,
      failureProbability: 0.1,
    },
    onSuccess: (session) => {
      console.log('Success!', session);
    },
    onError: (error, session) => {
      console.error('Failed:', error);
    },
  });

  const handleExecute = async () => {
    await executeSession(harvestSession);
  };

  return (
    <div>
      {isExecuting && <p>Executing step {currentStepIndex + 1}...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleExecute}>Execute</button>
    </div>
  );
}
```

## Simulator

### action-engine-simulator.ts

**Location:** `src/lib/harvestpro/action-engine-simulator.ts`

**Purpose:** Mock Action Engine for development and testing.

**Features:**
- Simulates on-chain transaction flows
- Simulates failure states (configurable probability)
- Simulates slippage scenarios
- Simulates retry flows with improved success rates
- Generates mock transaction hashes
- Provides detailed execution logs

**Configuration:**
```typescript
interface SimulationConfig {
  stepDelay?: number;           // Delay in ms (default: 2000)
  failureProbability?: number;  // 0-1 (default: 0.1)
  slippageProbability?: number; // 0-1 (default: 0.15)
  verbose?: boolean;            // Enable logs (default: false)
}
```

**Key Functions:**

#### simulateStepExecution
Simulates execution of a single step.
```typescript
const result = await simulateStepExecution(step, {
  stepDelay: 2000,
  failureProbability: 0.1,
  verbose: true,
});
```

#### simulateSessionExecution
Simulates execution of multiple steps in sequence.
```typescript
const result = await simulateSessionExecution(
  steps,
  config,
  (updatedStep, index) => {
    // Callback for each step update
    console.log(`Step ${index} updated:`, updatedStep);
  }
);
```

#### simulateRetry
Simulates retry of a failed step with reduced failure probability.
```typescript
const result = await simulateRetry(failedStep, config);
```

#### createMockExecutionSteps
Creates mock execution steps for testing.
```typescript
const steps = createMockExecutionSteps(sessionId, 3); // 3 opportunities
```

#### createCEXExecutionSteps
Creates CEX manual execution steps.
```typescript
const steps = createCEXExecutionSteps(sessionId, 'Binance', 'ETH');
```

## Execution Flow

### On-Chain Execution

```
1. User clicks "Execute Harvest" in HarvestDetailModal
   ↓
2. ActionEngineModal opens with session details
   ↓
3. User reviews steps and clicks "Execute Harvest"
   ↓
4. For each step:
   - Step status → "executing"
   - Simulate/execute transaction
   - Update step with result (completed/failed)
   - Display transaction hash (if successful)
   - Show error message (if failed)
   ↓
5. If all steps succeed:
   - Session status → "completed"
   - Call onComplete callback
   - Show success state
   ↓
6. If any step fails:
   - Session status → "failed"
   - Show error message
   - Offer "Retry" button
```

### CEX Manual Execution

```
1. User clicks "Execute Harvest" for CEX opportunity
   ↓
2. CEXExecutionPanel displays with platform-specific steps
   ↓
3. User performs each step manually on the exchange
   ↓
4. User checks off each completed step
   ↓
5. Progress bar updates in real-time
   ↓
6. When all steps checked:
   - Call onAllComplete callback
   - Proceed to success screen
```

## State Machine

### ExecutionStep Status Flow

```
pending → executing → completed
            ↓
          failed → (retry) → executing
```

### HarvestSession Status Flow

```
draft → executing → completed
  ↓         ↓
cancelled  failed → (retry) → executing
```

## Error Handling

### Common Error Scenarios

1. **Insufficient Balance**
   - Error: "Transaction reverted: insufficient balance"
   - Action: Display error, suggest adding funds

2. **Gas Estimation Failed**
   - Error: "Gas estimation failed: network congestion"
   - Action: Display error, offer retry with higher gas

3. **RPC Timeout**
   - Error: "RPC timeout: please retry"
   - Action: Automatic retry with exponential backoff

4. **Slippage Exceeded**
   - Error: "Slippage tolerance exceeded"
   - Action: Display warning, offer to increase slippage tolerance

5. **User Rejection**
   - Error: "User rejected transaction"
   - Action: Cancel execution, return to modal

### Retry Logic

- Failed steps can be retried individually
- Retry reduces failure probability by 70%
- All subsequent steps are reset to "pending"
- Execution continues from the failed step

## Testing

### Unit Tests

Test the simulator functions:
```typescript
import {
  simulateStepExecution,
  simulateSessionExecution,
  createMockExecutionSteps,
} from '@/lib/harvestpro/action-engine-simulator';

describe('Action Engine Simulator', () => {
  it('should simulate step execution', async () => {
    const step = createMockExecutionSteps('session-1', 1)[0];
    const result = await simulateStepExecution(step, {
      stepDelay: 100,
      failureProbability: 0,
    });
    expect(result.success).toBe(true);
    expect(result.step.status).toBe('completed');
  });
});
```

### Integration Tests

Test the full execution flow:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionEngineModal } from '@/components/harvestpro';

describe('ActionEngineModal', () => {
  it('should execute harvest successfully', async () => {
    const onComplete = jest.fn();
    render(
      <ActionEngineModal
        session={mockSession}
        isOpen={true}
        onClose={() => {}}
        onComplete={onComplete}
        onError={() => {}}
        useSimulator={true}
        simulatorConfig={{ stepDelay: 100, failureProbability: 0 }}
      />
    );

    fireEvent.click(screen.getByText('Execute Harvest'));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
```

## Real Action Engine Integration

### TODO: Implementation Steps

When the real Action Engine becomes available:

1. **Create Action Engine Client**
   ```typescript
   // src/lib/harvestpro/action-engine-client.ts
   export class ActionEngineClient {
     async executeStep(step: ExecutionStep): Promise<ExecutionResult> {
       // Integrate with real Action Engine API
     }
   }
   ```

2. **Update ActionEngineModal**
   - Add `useSimulator` prop check
   - Route to real client when `useSimulator === false`
   - Handle real transaction confirmations
   - Display real transaction hashes

3. **Add Wallet Integration**
   - Connect to user's wallet
   - Request transaction signatures
   - Handle wallet rejections
   - Display gas estimates

4. **Add Network Support**
   - Support multiple chains (Ethereum, Base, Arbitrum, etc.)
   - Handle chain switching
   - Display network-specific transaction explorers

5. **Add Error Recovery**
   - Implement exponential backoff for retries
   - Handle RPC failures gracefully
   - Provide clear error messages

## Requirements Validation

This implementation satisfies the following requirements:

- **8.2**: ✅ Displays Action Engine's transaction confirmation modal
- **8.3**: ✅ Shows spinner animation and per-step Guardian scores
- **8.4**: ✅ Updates step status and displays success indicators
- **8.5**: ✅ Handles transaction failures with error messages and retry

## Next Steps

1. ✅ Task 16: Action Engine stub/simulator (COMPLETED)
2. ✅ Task 16.1: Action Engine integration components (COMPLETED)
3. ⏭️ Task 17: CEX manual execution flow
4. ⏭️ Task 18: Success screen
5. ⏭️ Real Action Engine integration (when available)
