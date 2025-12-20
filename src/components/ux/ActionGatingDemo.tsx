/**
 * Action Gating Demo Component
 * 
 * Demonstrates the Action Gating & Prerequisites System implementation.
 * Shows various gating scenarios and how they work in practice.
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GatedButton, 
  WalletGatedButton, 
  ApprovalGatedButton, 
  BalanceGatedButton 
} from '@/components/ux/GatedButton';
import { SimpleProgress } from '@/components/ux/ProgressIndicator';
import { Wallet, Shield, Coins, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const ActionGatingDemo: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenApproved, setTokenApproved] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleConnectWallet = () => {
    setWalletConnected(true);
  };

  const handleApproveToken = () => {
    setTokenApproved(true);
  };

  const handleAddFunds = () => {
    setHasBalance(true);
  };

  const handleMultiStepAction = async () => {
    setIsExecuting(true);
    setExecutionStep(0);

    const steps = ['Validating', 'Approving', 'Executing', 'Confirming'];
    
    for (let i = 0; i < steps.length; i++) {
      setExecutionStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsExecuting(false);
    setExecutionStep(0);
  };

  const resetDemo = () => {
    setWalletConnected(false);
    setTokenApproved(false);
    setHasBalance(false);
    setExecutionStep(0);
    setIsExecuting(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Action Gating & Prerequisites Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the action gating system with tooltips and progress indicators
        </p>
      </div>

      {/* Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Prerequisites for executing protected actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span>Wallet:</span>
              <Badge variant={walletConnected ? 'default' : 'secondary'}>
                {walletConnected ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Token Approval:</span>
              <Badge variant={tokenApproved ? 'default' : 'secondary'}>
                {tokenApproved ? 'Approved' : 'Not Approved'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              <span>Balance:</span>
              <Badge variant={hasBalance ? 'default' : 'secondary'}>
                {hasBalance ? 'Sufficient' : 'Insufficient'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <Button onClick={resetDemo} variant="outline" size="sm">
              Reset Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Connection Gating */}
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
            <div className="flex gap-2">
              <Button 
                onClick={handleConnectWallet}
                variant="outline"
                disabled={walletConnected}
              >
                {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </Button>
            </div>

            <WalletGatedButton
              onClick={() => alert('Wallet action executed!')}
              className="w-full"
              gatingConfig={{ requireWallet: walletConnected }}
            >
              Execute Wallet Action
            </WalletGatedButton>

            <div className="text-sm text-muted-foreground">
              {walletConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Ready to execute
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Connect wallet to continue
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Token Approval Gating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Token Approval Gating
            </CardTitle>
            <CardDescription>
              Requires both wallet connection and token approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleApproveToken}
                variant="outline"
                disabled={!walletConnected || tokenApproved}
              >
                {tokenApproved ? 'Token Approved' : 'Approve Token'}
              </Button>
            </div>

            <ApprovalGatedButton
              tokenAddresses={['0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e']}
              onClick={() => alert('Token swap executed!')}
              className="w-full"
              gatingConfig={{ 
                requireWallet: walletConnected,
                requireApprovals: tokenApproved ? ['0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e'] : []
              }}
            >
              Execute Token Swap
            </ApprovalGatedButton>

            <div className="text-sm text-muted-foreground">
              Prerequisites:
              <ul className="list-disc list-inside mt-1">
                <li className={walletConnected ? 'text-green-600' : 'text-orange-600'}>
                  Wallet connected
                </li>
                <li className={tokenApproved ? 'text-green-600' : 'text-orange-600'}>
                  Token approved
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Balance Gating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Balance Gating
            </CardTitle>
            <CardDescription>
              Requires sufficient balance for transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleAddFunds}
                variant="outline"
                disabled={!walletConnected || hasBalance}
              >
                {hasBalance ? 'Funds Added' : 'Add Funds (Demo)'}
              </Button>
            </div>

            <BalanceGatedButton
              token="ETH"
              minimumAmount="0.1"
              onClick={() => alert('Transaction executed!')}
              className="w-full"
              gatingConfig={{ 
                requireWallet: walletConnected,
                minimumBalance: hasBalance ? { token: 'ETH', amount: '0.1' } : { token: 'ETH', amount: '1000' }
              }}
            >
              Send Transaction (0.1 ETH required)
            </BalanceGatedButton>

            <div className="text-sm text-muted-foreground">
              Current balance: {hasBalance ? '0.15 ETH' : '0.05 ETH'}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Step Action */}
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
            {isExecuting && (
              <SimpleProgress
                current={executionStep}
                total={4}
                stepName={['Validating', 'Approving', 'Executing', 'Confirming'][executionStep - 1]}
              />
            )}

            <GatedButton
              gatingConfig={{ 
                requireWallet: walletConnected,
                requireApprovals: tokenApproved ? ['0xToken'] : [],
                minimumBalance: hasBalance ? { token: 'ETH', amount: '0.1' } : { token: 'ETH', amount: '1000' }
              }}
              onClick={handleMultiStepAction}
              loading={isExecuting}
              loadingText="Processing..."
              showProgress={true}
              className="w-full"
            >
              Execute Complex Action
            </GatedButton>

            <div className="text-sm text-muted-foreground">
              All prerequisites must be met:
              <ul className="list-disc list-inside mt-1">
                <li className={walletConnected ? 'text-green-600' : 'text-orange-600'}>
                  Wallet connected
                </li>
                <li className={tokenApproved ? 'text-green-600' : 'text-orange-600'}>
                  Token approved
                </li>
                <li className={hasBalance ? 'text-green-600' : 'text-orange-600'}>
                  Sufficient balance
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Features</CardTitle>
          <CardDescription>
            Key features demonstrated in this action gating system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Implemented Features</h4>
              <ul className="text-sm space-y-1">
                <li>• Disabled button states with explanatory tooltips</li>
                <li>• Wallet connection requirements with clear messaging</li>
                <li>• Loading states with "Executing..." text</li>
                <li>• Progress indicators for multi-step operations</li>
                <li>• ARIA attributes for accessibility</li>
                <li>• Keyboard navigation support</li>
                <li>• Visual prerequisite icons</li>
                <li>• Prerequisite summary messages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Requirements Satisfied</h4>
              <ul className="text-sm space-y-1">
                <li>• R8.GATING.DISABLED_TOOLTIPS</li>
                <li>• R8.GATING.WALLET_REQUIRED</li>
                <li>• R8.GATING.LOADING_STATES</li>
                <li>• Comprehensive property-based testing</li>
                <li>• Integration and unit test coverage</li>
                <li>• Accessibility compliance (WCAG AA)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionGatingDemo;