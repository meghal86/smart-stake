/**
 * Wallet Registry Service
 * 
 * Batch operations and utilities for multi-wallet management.
 * Extends guardianService with registry-specific features.
 */

import { supabase } from '@/lib/supabase'
import { requestGuardianScan, type GuardianScanResult } from './guardianService'

export interface BatchScanOptions {
  walletIds?: string[]
  userId?: string
  maxConcurrent?: number
  onProgress?: (completed: number, total: number) => void
}

export interface BatchScanResult {
  walletId: string
  address: string
  result?: GuardianScanResult
  error?: string
  success: boolean
}

/**
 * Scan multiple wallets in parallel
 */
export async function scanMultipleWallets(
  walletAddresses: Array<{ id: string; address: string; chain?: string }>,
  options: {
    maxConcurrent?: number
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<BatchScanResult[]> {
  const { maxConcurrent = 5, onProgress } = options
  const results: BatchScanResult[] = []
  let completed = 0

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < walletAddresses.length; i += maxConcurrent) {
    const batch = walletAddresses.slice(i, i + maxConcurrent)

    const batchPromises = batch.map(async (wallet) => {
      try {
        const result = await requestGuardianScan({
          walletAddress: wallet.address,
          network: wallet.chain || 'ethereum',
        })

        // Update wallet in database
        await supabase
          .from('user_wallets')
          .update({
            trust_score: result.trustScorePercent,
            risk_flags: result.flags,
            last_scan: new Date().toISOString(),
          })
          .eq('id', wallet.id)

        completed++
        onProgress?.(completed, walletAddresses.length)

        return {
          walletId: wallet.id,
          address: wallet.address,
          result,
          success: true,
        }
      } catch (error: any) {
        completed++
        onProgress?.(completed, walletAddresses.length)

        return {
          walletId: wallet.id,
          address: wallet.address,
          error: error.message,
          success: false,
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches
    if (i + maxConcurrent < walletAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * Trigger a batch scan via edge function
 */
export async function triggerBatchScan(options: BatchScanOptions = {}): Promise<{
  success: boolean
  message: string
  jobId?: string
}> {
  try {
    const { data, error } = await supabase.functions.invoke('wallet-registry-scan', {
      body: {
        wallet_ids: options.walletIds,
        user_id: options.userId,
        batch_size: 50,
      },
    })

    if (error) throw error

    return {
      success: true,
      message: data.message || 'Batch scan triggered',
      jobId: data.job_id,
    }
  } catch (error: any) {
    console.error('Failed to trigger batch scan:', error)
    return {
      success: false,
      message: error.message,
    }
  }
}

/**
 * Get aggregated statistics for all user wallets
 */
export async function getWalletRegistryStats(userId: string): Promise<{
  totalWallets: number
  averageTrustScore: number
  totalRiskFlags: number
  lastScanned?: string
  walletsNeedingScan: number
}> {
  const { data: wallets, error } = await supabase
    .from('user_wallets')
    .select('trust_score, risk_flags, last_scan')
    .eq('user_id', userId)

  if (error || !wallets) {
    throw new Error('Failed to fetch wallet stats')
  }

  const totalWallets = wallets.length
  const validScores = wallets.filter((w) => w.trust_score !== null)
  const averageTrustScore =
    validScores.length > 0
      ? validScores.reduce((sum, w) => sum + (w.trust_score || 0), 0) / validScores.length
      : 0

  const totalRiskFlags = wallets.reduce((sum, w) => {
    return sum + (Array.isArray(w.risk_flags) ? w.risk_flags.length : 0)
  }, 0)

  const lastScans = wallets
    .map((w) => w.last_scan)
    .filter(Boolean)
    .sort()
  const lastScanned = lastScans.length > 0 ? lastScans[lastScans.length - 1] : undefined

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const walletsNeedingScan = wallets.filter(
    (w) => !w.last_scan || w.last_scan < oneHourAgo
  ).length

  return {
    totalWallets,
    averageTrustScore: Math.round(averageTrustScore),
    totalRiskFlags,
    lastScanned,
    walletsNeedingScan,
  }
}

/**
 * Export wallet registry to JSON
 */
export async function exportWalletRegistry(userId: string): Promise<string> {
  const { data: wallets, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !wallets) {
    throw new Error('Failed to export wallets')
  }

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      user_id: userId,
      wallet_count: wallets.length,
      wallets: wallets.map((w) => ({
        address: w.address,
        label: w.label,
        chain: w.chain,
        source: w.source,
        trust_score: w.trust_score,
        risk_flags: w.risk_flags,
        last_scan: w.last_scan,
        created_at: w.created_at,
      })),
    },
    null,
    2
  )
}

/**
 * Import wallets from JSON or CSV
 */
export async function importWallets(
  userId: string,
  data: Array<{ address: string; label?: string; chain?: string }>
): Promise<{
  success: number
  failed: number
  errors: Array<{ address: string; error: string }>
}> {
  let success = 0
  let failed = 0
  const errors: Array<{ address: string; error: string }> = []

  for (const wallet of data) {
    try {
      // Validate address format
      if (!wallet.address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid address format')
      }

      const { error } = await supabase.from('user_wallets').upsert(
        {
          user_id: userId,
          address: wallet.address.toLowerCase(),
          label: wallet.label,
          chain: wallet.chain || 'ethereum',
          source: 'import',
        },
        {
          onConflict: 'user_id,address,chain',
        }
      )

      if (error) throw error
      success++
    } catch (error: any) {
      failed++
      errors.push({
        address: wallet.address,
        error: error.message,
      })
    }
  }

  return { success, failed, errors }
}



