/**
 * Action Gating & Prerequisites System
 * 
 * Manages action prerequisites and provides gating logic for buttons and interactions.
 * Implements requirements R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

export interface ActionPrerequisite {
  id: string;
  type: 'wallet' | 'approval' | 'balance' | 'geo' | 'time' | 'custom';
  required: boolean;
  met: boolean;
  message: string;
  data?: any;
}

export interface ActionGatingState {
  enabled: boolean;
  loading: boolean;
  loadingText?: string;
  disabledReason?: string;
  prerequisites: ActionPrerequisite[];
  progress?: {
    current: number;
    total: number;
    stepName?: string;
  };
}

export interface ActionGatingConfig {
  requireWallet?: boolean;
  requireApprovals?: string[]; // Token addresses that need approval
  minimumBalance?: {
    token: string;
    amount: string;
  };
  geoRestricted?: boolean;
  timeConstraint?: {
    start?: Date;
    end?: Date;
  };
  customPrerequisites?: ActionPrerequisite[];
}

export class ActionGatingManager {
  private walletConnected: boolean = false;
  private walletAddress: string | null = null;
  private userRegion: string | null = null;
  private tokenBalances: Record<string, string> = {};
  private tokenApprovals: Record<string, boolean> = {};

  constructor() {
    // Initialize with current state
    this.initializeState();
  }

  /**
   * Initialize state from wallet context and other sources
   */
  private initializeState(): void {
    // Check if wallet is connected (this would be injected in real implementation)
    if (typeof window !== 'undefined') {
      // Listen for wallet connection events
      window.addEventListener('walletConnected', this.handleWalletConnected.bind(this));
      window.addEventListener('walletDisconnected', this.handleWalletDisconnected.bind(this));
    }
  }

  /**
   * Handle wallet connection event
   */
  private handleWalletConnected(event: CustomEvent): void {
    this.walletConnected = true;
    this.walletAddress = event.detail.address;
  }

  /**
   * Handle wallet disconnection event
   */
  private handleWalletDisconnected(): void {
    this.walletConnected = false;
    this.walletAddress = null;
    this.tokenBalances = {};
    this.tokenApprovals = {};
  }

  /**
   * Update wallet connection state
   */
  public updateWalletState(connected: boolean, address?: string): void {
    this.walletConnected = connected;
    this.walletAddress = address || null;
    
    if (!connected) {
      this.tokenBalances = {};
      this.tokenApprovals = {};
    }
  }

  /**
   * Update token balances
   */
  public updateTokenBalances(balances: Record<string, string>): void {
    this.tokenBalances = { ...this.tokenBalances, ...balances };
  }

  /**
   * Update token approvals
   */
  public updateTokenApprovals(approvals: Record<string, boolean>): void {
    this.tokenApprovals = { ...this.tokenApprovals, ...approvals };
  }

  /**
   * Set user region for geo-restriction checks
   */
  public setUserRegion(region: string): void {
    this.userRegion = region;
  }

  /**
   * Evaluate action gating state based on configuration
   */
  public evaluateAction(config: ActionGatingConfig): ActionGatingState {
    const prerequisites: ActionPrerequisite[] = [];

    // Check wallet connection requirement
    if (config.requireWallet) {
      prerequisites.push({
        id: 'wallet-connection',
        type: 'wallet',
        required: true,
        met: this.walletConnected,
        message: this.walletConnected 
          ? 'Wallet connected' 
          : 'Connect your wallet to continue',
      });
    }

    // Check token approvals
    if (config.requireApprovals && config.requireApprovals.length > 0) {
      config.requireApprovals.forEach((tokenAddress, index) => {
        const approved = this.tokenApprovals[tokenAddress] || false;
        prerequisites.push({
          id: `approval-${index}`,
          type: 'approval',
          required: true,
          met: approved,
          message: approved 
            ? `Token ${tokenAddress} approved` 
            : 'Approve token spend to continue',
          data: { tokenAddress },
        });
      });
    }

    // Check minimum balance requirement
    if (config.minimumBalance) {
      const { token, amount } = config.minimumBalance;
      const currentBalance = this.tokenBalances[token] || '0';
      const hasEnoughBalance = parseFloat(currentBalance) >= parseFloat(amount);
      
      prerequisites.push({
        id: 'minimum-balance',
        type: 'balance',
        required: true,
        met: hasEnoughBalance,
        message: hasEnoughBalance 
          ? `Sufficient ${token} balance` 
          : 'Insufficient balance',
        data: { token, required: amount, current: currentBalance },
      });
    }

    // Check geo restrictions
    if (config.geoRestricted && this.userRegion) {
      const restrictedRegions = ['US', 'CN', 'KP']; // Example restricted regions
      const isRestricted = restrictedRegions.includes(this.userRegion);
      
      prerequisites.push({
        id: 'geo-restriction',
        type: 'geo',
        required: true,
        met: !isRestricted,
        message: isRestricted 
          ? 'Not available in your region' 
          : 'Available in your region',
        data: { region: this.userRegion },
      });
    }

    // Check time constraints
    if (config.timeConstraint) {
      const now = new Date();
      const { start, end } = config.timeConstraint;
      let timeValid = true;
      let timeMessage = 'Available';

      if (start && now < start) {
        timeValid = false;
        timeMessage = `Available from ${start.toLocaleDateString()}`;
      } else if (end && now > end) {
        timeValid = false;
        timeMessage = 'Expired';
      }

      prerequisites.push({
        id: 'time-constraint',
        type: 'time',
        required: true,
        met: timeValid,
        message: timeMessage,
        data: { start, end, current: now },
      });
    }

    // Add custom prerequisites
    if (config.customPrerequisites) {
      prerequisites.push(...config.customPrerequisites);
    }

    // Determine overall state
    const requiredPrerequisites = prerequisites.filter(p => p.required);
    const unmetRequired = requiredPrerequisites.filter(p => !p.met);
    const enabled = unmetRequired.length === 0;

    // Get the first unmet required prerequisite for the disabled reason
    const disabledReason = unmetRequired.length > 0 ? unmetRequired[0].message : undefined;

    return {
      enabled,
      loading: false, // This will be managed by the component using this manager
      prerequisites,
      disabledReason,
    };
  }

  /**
   * Create a gating state for wallet connection requirement only
   */
  public createWalletGatingState(): ActionGatingState {
    return this.evaluateAction({ requireWallet: true });
  }

  /**
   * Create a gating state for token approval requirement
   */
  public createApprovalGatingState(tokenAddresses: string[]): ActionGatingState {
    return this.evaluateAction({ 
      requireWallet: true, 
      requireApprovals: tokenAddresses 
    });
  }

  /**
   * Create a gating state for balance requirement
   */
  public createBalanceGatingState(token: string, amount: string): ActionGatingState {
    return this.evaluateAction({ 
      requireWallet: true, 
      minimumBalance: { token, amount } 
    });
  }

  /**
   * Get human-readable prerequisite summary
   */
  public getPrerequisiteSummary(state: ActionGatingState): string {
    const unmet = state.prerequisites.filter(p => p.required && !p.met);
    
    if (unmet.length === 0) {
      return 'All prerequisites met';
    }
    
    if (unmet.length === 1) {
      return unmet[0].message;
    }
    
    return `${unmet.length} requirements needed`;
  }

  /**
   * Check if action can be executed
   */
  public canExecuteAction(config: ActionGatingConfig): boolean {
    const state = this.evaluateAction(config);
    return state.enabled && !state.loading;
  }
}

// Global instance for use across the application
export const actionGatingManager = new ActionGatingManager();

// Hook for React components
export function useActionGating(config: ActionGatingConfig) {
  const [state, setState] = React.useState<ActionGatingState>(() => 
    actionGatingManager.evaluateAction(config)
  );

  React.useEffect(() => {
    // Re-evaluate when config changes
    setState(actionGatingManager.evaluateAction(config));
  }, [config]);

  React.useEffect(() => {
    // Listen for wallet events and re-evaluate
    const handleWalletEvent = () => {
      setState(actionGatingManager.evaluateAction(config));
    };

    window.addEventListener('walletConnected', handleWalletEvent);
    window.addEventListener('walletDisconnected', handleWalletEvent);

    return () => {
      window.removeEventListener('walletConnected', handleWalletEvent);
      window.removeEventListener('walletDisconnected', handleWalletEvent);
    };
  }, [config]);

  const updateLoading = React.useCallback((loading: boolean, loadingText?: string) => {
    setState(prev => ({ ...prev, loading, loadingText }));
  }, []);

  const updateProgress = React.useCallback((current: number, total: number, stepName?: string) => {
    setState(prev => ({ 
      ...prev, 
      progress: { current, total, stepName } 
    }));
  }, []);

  return {
    ...state,
    updateLoading,
    updateProgress,
  };
}

// Import React for the hook
import React from 'react';