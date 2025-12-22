/**
 * Progress Indicator Demo Component
 * 
 * Demonstrates progress indicators for multi-step operations
 * Implements requirement R8.GATING.LOADING_STATES for progress indicators
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8.6
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ProgressIndicator, 
  SimpleProgress, 
  useProgressIndicator,
  type ProgressStep 
} from './ProgressIndicator';
import { GatedButton } from './GatedButton';

export const ProgressIndicatorDemo: React.FC = () => {
  const [demoStep, setDemoStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Demo steps for wallet transaction
  const walletSteps: ProgressStep[] = [
    {
      id: 'connect',
      name: 'Connect Wallet',
      description: 'Connect your wallet to continue',
      status: demoStep > 0 ? 'completed' : demoStep === 0 ? 'active' : 'pending',
    },
    {
      id: 'approve',
      name: 'Approve Token',
      description: 'Approve token spending',
      status: demoStep > 1 ? 'completed' : demoStep === 1 ? 'active' : 'pending',
    },
    {
      id: 'execute',
      name: 'Execute Transaction',
      description: 'Execute the transaction',
      status: demoStep > 2 ? 'completed' : demoStep === 2 ? 'active' : 'pending',
    },
  ];

  // Hook demo
  const progressHook = useProgressIndicator([
    { id: 'step1', name: 'Initialize' },
    { id: 'step2', name: 'Process' },
    { id: 'step3', name: 'Complete' },
  ]);

  const simulateMultiStepOperation = async () => {
    setIsExecuting(true);
    
    for (let i = 0; i < walletSteps.length; i++) {
      setDemoStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setDemoStep(3); // Complete
    setIsExecuting(false);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setIsExecuting(false);
    progressHook.reset();
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Progress Indicators Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating multi-step operation progress indicators
        </p>
        <Badge variant="outline" className="text-xs">
          Requirement R8.GATING.LOADING_STATES
        </Badge>
      </div>

      {/* Horizontal Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Horizontal Progress Indicator</CardTitle>
          <CardDescription>
            Shows progress through a multi-step wallet transaction flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProgressIndicator 
            steps={walletSteps}
            currentStep={demoStep}
            orientation="horizontal"
            showStepDescriptions={true}
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={simulateMultiStepOperation}
              disabled={isExecuting}
              variant="default"
            >
              {isExecuting ? 'Executing...' : 'Start Transaction'}
            </Button>
            <Button 
              onClick={resetDemo}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vertical Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Vertical Progress Indicator</CardTitle>
          <CardDescription>
            Vertical layout for detailed step information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <ProgressIndicator 
              steps={walletSteps}
              currentStep={demoStep}
              orientation="vertical"
              showStepDescriptions={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compact Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Progress Indicator</CardTitle>
          <CardDescription>
            Space-efficient progress display for buttons and small spaces
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressIndicator 
            steps={walletSteps}
            currentStep={demoStep}
            compact={true}
          />
          
          <div className="text-sm text-muted-foreground">
            Perfect for integration with buttons and toolbars
          </div>
        </CardContent>
      </Card>

      {/* Simple Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Progress Bar</CardTitle>
          <CardDescription>
            Basic progress bar with percentage and step information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleProgress 
            current={demoStep + 1}
            total={walletSteps.length}
            stepName={walletSteps[demoStep]?.name}
          />
          
          <div className="text-sm text-muted-foreground">
            Ideal for simple progress tracking without detailed step information
          </div>
        </CardContent>
      </Card>

      {/* Progress Hook Demo */}
      <Card>
        <CardHeader>
          <CardTitle>useProgressIndicator Hook</CardTitle>
          <CardDescription>
            Programmatic progress management with React hook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressIndicator 
            steps={progressHook.steps}
            currentStep={progressHook.currentStep}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => progressHook.startStep(0)}
              size="sm"
              variant="outline"
            >
              Start Step 1
            </Button>
            <Button 
              onClick={() => progressHook.startStep(1)}
              size="sm"
              variant="outline"
            >
              Start Step 2
            </Button>
            <Button 
              onClick={() => progressHook.startStep(2)}
              size="sm"
              variant="outline"
            >
              Start Step 3
            </Button>
            <Button 
              onClick={() => progressHook.completeStep(progressHook.currentStep)}
              size="sm"
              variant="default"
            >
              Complete Current
            </Button>
            <Button 
              onClick={() => progressHook.errorStep(progressHook.currentStep, 'Demo error')}
              size="sm"
              variant="destructive"
            >
              Error Current
            </Button>
            <Button 
              onClick={progressHook.nextStep}
              size="sm"
              variant="secondary"
            >
              Next Step
            </Button>
            <Button 
              onClick={progressHook.reset}
              size="sm"
              variant="outline"
            >
              Reset
            </Button>
          </div>
          
          <div className="text-sm space-y-1">
            <div>Current Step: {progressHook.currentStep + 1}</div>
            <div>Is Complete: {progressHook.isComplete ? 'Yes' : 'No'}</div>
            <div>Has Error: {progressHook.hasError ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Integration with GatedButton */}
      <Card>
        <CardHeader>
          <CardTitle>Integration with GatedButton</CardTitle>
          <CardDescription>
            Progress indicators integrated with action gating system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GatedButton
            gatingConfig={{ requireWallet: true }}
            showProgress={true}
            showExecutionFeedback={true}
            executionSteps={['Connect Wallet', 'Approve Token', 'Execute Transaction']}
            onClick={async () => {
              // Simulate async operation
              await new Promise(resolve => setTimeout(resolve, 2000));
            }}
          >
            Execute Multi-Step Action
          </GatedButton>
          
          <div className="text-sm text-muted-foreground">
            This button shows progress indicators during execution when showProgress is enabled
          </div>
        </CardContent>
      </Card>

      {/* Error State Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Error State Handling</CardTitle>
          <CardDescription>
            How progress indicators handle errors and recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressIndicator 
            steps={[
              {
                id: 'step1',
                name: 'Connect Wallet',
                status: 'completed',
              },
              {
                id: 'step2',
                name: 'Approve Token',
                status: 'error',
                errorMessage: 'User rejected transaction',
              },
              {
                id: 'step3',
                name: 'Execute Transaction',
                status: 'pending',
              },
            ]}
            currentStep={1}
            showStepDescriptions={false}
          />
          
          <div className="mt-4 text-sm text-muted-foreground">
            Error states are clearly indicated with error messages and visual cues
          </div>
        </CardContent>
      </Card>

      {/* Implementation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Implementation Summary</CardTitle>
          <CardDescription>
            Progress indicators for multi-step operations are now complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Features Implemented</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Horizontal and vertical progress layouts</li>
                <li>Compact progress indicators for buttons</li>
                <li>Simple progress bars with percentages</li>
                <li>Step status indicators (pending, active, completed, error)</li>
                <li>Error state handling with custom messages</li>
                <li>React hook for programmatic progress management</li>
                <li>Integration with GatedButton component</li>
                <li>Accessibility support and keyboard navigation</li>
                <li>Responsive design and mobile-friendly layouts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎯 Requirements Satisfied</h4>
              <ul className="text-sm space-y-1">
                <li>• R8.GATING.LOADING_STATES - Progress indicators for multi-step operations</li>
                <li>• Shows current step (e.g., "Step 2 of 3")</li>
                <li>• Visual progress indicators with status</li>
                <li>• Error handling and recovery states</li>
                <li>• Integration with existing action gating system</li>
                <li>• Comprehensive test coverage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressIndicatorDemo;