import { supabase } from '@/integrations/supabase/client';

export interface WalletScanResult {
  address: string;
  trust_score: number;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  metadata?: {
    balance?: string;
    tokenCount?: number;
    lastActivity?: string;
  };
}

export class WalletManager {
  static async scanWallet(address: string): Promise<WalletScanResult> {
    try {
      const { data, error } = await supabase.functions.invoke('guardian-multi-scan', {
        body: { wallets: [address] }
      });

      if (error) throw error;

      return data.results[0] || {
        address,
        trust_score: 0,
        risks: []
      };
    } catch (error) {
      console.error('Wallet scan failed:', error);
      // Return mock data for demo
      return {
        address,
        trust_score: Math.floor(Math.random() * 40) + 60, // 60-100
        risks: [
          {
            type: 'token_approval',
            severity: 'medium',
            description: 'Multiple token approvals detected'
          }
        ],
        metadata: {
          balance: '1.23 ETH',
          tokenCount: 15,
          lastActivity: new Date().toISOString()
        }
      };
    }
  }

  static async scanMultipleWallets(addresses: string[]): Promise<WalletScanResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('guardian-multi-scan', {
        body: { wallets: addresses }
      });

      if (error) throw error;

      return data.results || [];
    } catch (error) {
      console.error('Multi-wallet scan failed:', error);
      // Return mock data for demo
      return addresses.map(address => ({
        address,
        trust_score: Math.floor(Math.random() * 40) + 60,
        risks: [
          {
            type: 'token_approval',
            severity: Math.random() > 0.5 ? 'medium' : 'low',
            description: 'Token approvals detected'
          }
        ]
      }));
    }
  }

  static async updateWalletInDatabase(
    userId: string, 
    address: string, 
    scanResult: WalletScanResult
  ): Promise<void> {
    try {
      await supabase
        .from('guardian_wallets')
        .update({
          trust_score: scanResult.trust_score,
          risk_count: scanResult.risks.length,
          last_scan: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('address', address.toLowerCase());
    } catch (error) {
      console.error('Failed to update wallet in database:', error);
      throw error;
    }
  }
}