/**
 * Action Gating Examples
 * 
 * Example components demonstrating the Action Gating & Prerequisites System.
 * Shows various gating scenarios and how to implement them.
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  GatedButton, 
  WalletGatedButton, 
  ApprovalGatedButton, 
  BalanceGatedButton 
} from '@/components/ux/GatedButton';
import { ProgressIndicator, SimpleProgress, useProgressIndicator } from '@/components/ux/ProgressIndicator';
import { 
  useActionGating, 
  useWalletGating, 
  useApprovalGating, 
  useGatedAction 
} from '@/hooks/useActionGating';
import { Wallet, Coins, Shield, Clock, MapPin } from 'lucide-react';

// Example 1: Basic Wallet Connection Gating
export const WalletConnectionExample: React.FC = () => {
  const gating = useWalletGating();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connection Gating
        </CardTitle>
        <CardDescription>
          Button is disabled until wallet is connected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={gating.walletConnected ? 'default' : 'secondary'}>
            {gating.walletConnected ? 'Connected' : 'Not Connected'}
          </Badge>
          {gating.walletAddress && (
            <span className="text-sm text-muted-foreground">
              {gating.walletAddress.slice(0, 6)}...{gating.walletAddress.slice(-4)}
            </span>
          )}
        </div>

        <WalletGatedButton
          onClick={() => console.log('Action executed!')}
          className="w-full"
        >
          Execute Protected Action
        </WalletGatedButton>

        <div className="text-sm text-muted-foreground">
          Status: {gating.prerequisiteSummary}
        </div>
      </CardContent>
    </Card>
  );
};

// Example 2: Token Approval Gating
export const TokenApprovalExample: React.FC = () => {
  const tokenAddresses = ['0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e']; // Example USDC
  const gating = useApprovalGating(tokenAddresses);

  const handleApprove = async () => {
    console.log('Approving token...');
    // Simulate approval process
    await new Promise(resolve => setTimeout(resolve, 2000));
    gating.updateTokenApprovals({ [tokenAddresses[0]]: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Token Approval Gating
        </CardTitle>
        <CardDescription>
          Button requires token approval before execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {gating.prerequisites.map((prereq) => (
            <div key={prereq.id} className="flex items-center justify-between">
              <span className="text-sm">{prereq.message}</span>
              <Badge variant={prereq.met ? 'default' : 'secondary'}>
                {prereq.met ? 'Met' : 'Required'}
              </Badge>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex gap-2">
          <WalletGatedButton
            onClick={handleApprove}
            variant="outline"
            disabled={!gating.walletConnected}
          >
            Approve Token
          </WalletGatedButton>

          <ApprovalGatedButton
            tokenAddresses={tokenAddresses}
            onClick={() => console.log('Swap executed!')}
            className="flex-1"
          >
            Execute Swap
          </ApprovalGatedButton>
        </div>
      </CardContent>
    </Card>
  );
};

// Example 3: Balance Gating
export const BalanceGatingExample: React.FC = () => {
  const gating = useActionGating({
    requireWallet: true,
    minimumBalance: { token: 'ETH', amount: '0.1' }
  });

  const handleUpdateBalance = () => {
    // Simulate balance update
    gating.updateTokenBalances({ 'ETH': '0.15' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Balance Gating
        </CardTitle>
        <CardDescription>
          Button requires minimum ETH balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Minimum Balance: 0.1 ETH</span>
          <Badge variant={gating.enabled ? 'default' : 'destructive'}>
            {gating.enabled ? 'Sufficient' : 'Insufficient'}
          </Badge>
        </div>

        <div className="flex gap-2">
          <WalletGatedButton
            onClick={handleUpdateBalance}
            variant="outline"
          >
            Add Funds (Demo)
          </WalletGatedButton>

          <BalanceGatedButton
            token="ETH"
            minimumAmount="0.1"
            onClick={() => console.log('Transaction executed!')}
            className="flex-1"
          >
            Send Transaction
          </BalanceGatedButton>
        </div>
      </CardContent>
    </Card>
  );
};

// Example 4: Multi-Step Action with Progress
export const MultiStepActionExample: React.FC = () => {
  const steps = ['Validate', 'Approve', 'Execute', 'Confirm'];
  const gatedAction = useGatedAction(
    { requireWallet: true },
    steps
  );

  const progressSteps = useProgressIndicator([
    { id: 'validate', name: 'Validate Transaction' },
    { id: 'approve', name: 'Approve Tokens' },
    { id: 'execute', name: 'Execute Transaction' },
    { id: 'confirm', name: 'Confirm on Chain' },
  ]);

  const handleExecuteMultiStep = async () => {
    const actions = [
      async () => {
        progressSteps.startStep(0);
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressSteps.completeStep(0);
      },
      async () => {
        progressSteps.startStep(1);
        await new Promise(resolve => setTimeout(resolve, 1500));
        progressSteps.completeStep(1);
      },
      async () => {
        progressSteps.startStep(2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        progressSteps.completeStep(2);
      },
      async () => {
        progressSteps.startStep(3);
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressSteps.completeStep(3);
      },
    ];

    try {
      await gatedAction.executeAllSteps(actions);
      console.log('Multi-step action completed!');
    } catch (error) {
      console.error('Multi-step action failed:', error);
      progressSteps.errorStep(progressSteps.currentStep, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Multi-Step Action
        </CardTitle>
        <CardDescription>
          Complex action with progress tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressIndicator
          steps={progressSteps.steps}
          currentStep={progressSteps.currentStep}
          orientation="horizontal"
          showStepDescriptions={false}
        />

        <Separator />

        <div className="flex gap-2">
          <WalletGatedButton
            onClick={progressSteps.reset}
            variant="outline"
            disabled={gatedAction.loading}
          >
            Reset
          </WalletGatedButton>

          <GatedButton
            gatingConfig={{ requireWallet: true }}
            onClick={handleExecuteMultiStep}
            loading={gatedAction.loading}
            loadingText="Executing..."
            showProgress={true}
            className="flex-1"
          >
            Execute Multi-Step Action
          </GatedButton>
        </div>

        {gatedAction.progress && (
          <SimpleProgress
            current={gatedAction.progress.current}
            total={gatedAction.progress.total}
            stepName={gatedAction.progress.stepName}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Example 5: Geo and Time Restrictions
export const RestrictionsExample: React.FC = () => {
  const [userRegion, setUserRegion] = useState<string>('US');
  const gating = useActionGating({
    requireWallet: true,
    geoRestricted: true,
    timeConstraint: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date(Date.now() + 24 * 60 * 60 * 1000),   // 24 hours from now
    }
  });

  React.useEffect(() => {
    gating.setUserRegion(userRegion);
  }, [userRegion, gating]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geo & Time Restrictions
        </CardTitle>
        <CardDescription>
          Button respects geographical and time constraints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Region:</span>
            <select 
              value={userRegion} 
              onChange={(e) => setUserRegion(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="US">United States (Restricted)</option>
              <option value="EU">European Union (Allowed)</option>
              <option value="CN">China (Restricted)</option>
            </select>
          </div>

          {gating.prerequisites.map((prereq) => (
            <div key={prereq.id} className="flex items-center justify-between">
              <span className="text-sm">{prereq.message}</span>
              <Badge variant={prereq.met ? 'default' : 'destructive'}>
                {prereq.met ? 'Met' : 'Blocked'}
              </Badge>
            </div>
          ))}
        </div>

        <GatedButton
          gatingConfig={{
            requireWallet: true,
            geoRestricted: true,
            timeConstraint: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
          }}
          onClick={() => console.log('Restricted action executed!')}
          className="w-full"
        >
          Execute Restricted Action
        </GatedButton>
      </CardContent>
    </Card>
  );
};

// Main demo component
export const ActionGatingDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Action Gating & Prerequisites System</h1>
        <p className="text-muted-foreground">
          Demonstration of various gating scenarios and prerequisites
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletConnectionExample />
        <TokenApprovalExample />
        <BalanceGatingExample />
        <RestrictionsExample />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MultiStepActionExample />
      </div>
    </div>
  );
};