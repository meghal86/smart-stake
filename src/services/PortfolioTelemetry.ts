/**
 * Portfolio Telemetry Service
 * 
 * Tracks portfolio-related analytics events.
 * Requirements: Task 4 - Telemetry event tracking
 */

import { analytics } from '@/lib/analytics/client';
import { hashWalletAddress } from '@/lib/analytics/hash';
import { v4 as uuidv4 } from 'uuid';

export interface PortfolioSnapshotLoadedEvent {
  wallet_scope: 'active_wallet' | 'all_wallets';
  wallet_address?: string;
  net_worth: number;
  confidence: number;
  degraded: boolean;
  freshness_sec: number;
  position_count: number;
  risk_score: number;
}

export interface WalletSwitchEvent {
  from_wallet?: string;
  to_wallet: string;
  switch_duration_ms: number;
}

class PortfolioTelemetryService {
  private sessionId: string;
  private lastWalletSwitchTime: number | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for this browser session
   */
  private getOrCreateSessionId(): string {
    const storageKey = 'portfolio_session_id';
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = `session_${uuidv4()}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Track portfolio snapshot loaded event
   * 
   * Requirement: Fire portfolio_snapshot_loaded event with correct wallet_scope
   */
  async trackPortfolioSnapshotLoaded(event: PortfolioSnapshotLoadedEvent): Promise<void> {
    try {
      const user_id_hash = event.wallet_address 
        ? await hashWalletAddress(event.wallet_address)
        : undefined;

      await analytics.track({
        event: 'portfolio_snapshot_loaded',
        user_id_hash,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        properties: {
          wallet_scope: event.wallet_scope,
          net_worth: event.net_worth,
          confidence: event.confidence,
          degraded: event.degraded,
          freshness_sec: event.freshness_sec,
          position_count: event.position_count,
          risk_score: event.risk_score,
        },
      });

      console.log('[Portfolio Telemetry] Tracked portfolio_snapshot_loaded:', {
        wallet_scope: event.wallet_scope,
        confidence: event.confidence,
        degraded: event.degraded,
      });
    } catch (error) {
      console.error('[Portfolio Telemetry] Failed to track portfolio_snapshot_loaded:', error);
    }
  }

  /**
   * Track wallet switch event
   */
  async trackWalletSwitch(event: WalletSwitchEvent): Promise<void> {
    try {
      const user_id_hash = event.to_wallet 
        ? await hashWalletAddress(event.to_wallet)
        : undefined;

      const from_wallet_hash = event.from_wallet
        ? await hashWalletAddress(event.from_wallet)
        : undefined;

      await analytics.track({
        event: 'wallet_switched',
        user_id_hash,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        properties: {
          from_wallet_hash,
          to_wallet_hash: user_id_hash,
          switch_duration_ms: event.switch_duration_ms,
        },
      });

      console.log('[Portfolio Telemetry] Tracked wallet_switched:', {
        switch_duration_ms: event.switch_duration_ms,
      });
    } catch (error) {
      console.error('[Portfolio Telemetry] Failed to track wallet_switched:', error);
    }
  }

  /**
   * Track degraded mode activation
   */
  async trackDegradedModeActivated(walletAddress: string, confidence: number, reasons: string[]): Promise<void> {
    try {
      const user_id_hash = await hashWalletAddress(walletAddress);

      await analytics.track({
        event: 'portfolio_degraded_mode_activated',
        user_id_hash,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        properties: {
          confidence,
          reasons: reasons.join(', '),
        },
      });

      console.log('[Portfolio Telemetry] Tracked degraded_mode_activated:', {
        confidence,
        reasons,
      });
    } catch (error) {
      console.error('[Portfolio Telemetry] Failed to track degraded_mode_activated:', error);
    }
  }

  /**
   * Mark the start of a wallet switch for duration tracking
   */
  markWalletSwitchStart(): void {
    this.lastWalletSwitchTime = Date.now();
  }

  /**
   * Get the duration since the last wallet switch started
   */
  getWalletSwitchDuration(): number {
    if (!this.lastWalletSwitchTime) {
      return 0;
    }
    return Date.now() - this.lastWalletSwitchTime;
  }
}

export const portfolioTelemetry = new PortfolioTelemetryService();
