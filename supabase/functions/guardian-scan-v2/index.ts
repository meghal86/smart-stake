/**
 * Guardian Scan v2
 * Real probe-driven SSE scan with evidence persistence.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  calculateGuardianScore,
  type GuardianApproval,
  type GuardianContractEvidence,
  type GuardianFinding,
} from '../_lib/guardian-score.ts';
import {
  probeApprovals,
  probeContractEvidence,
  probeMixer,
  probeReputation,
  probeWalletAgeDays,
} from '../_lib/probes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  wallet_address: string;
  network?: string;
}

function generateRequestId() {
  return crypto.randomUUID();
}

function chainToId(chain: string) {
  switch (chain.toLowerCase()) {
    case 'base':
      return 8453;
    case 'arbitrum':
      return 42161;
    case 'polygon':
      return 137;
    case 'optimism':
      return 10;
    default:
      return 1;
  }
}

function serializeForJson(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeForJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        serializeForJson(nested),
      ]),
    );
  }
  return value;
}

function calculateApprovalRisk(
  allowance: string,
  contractEvidence?: GuardianContractEvidence,
): GuardianApproval['riskLevel'] {
  const isUnlimited =
    allowance.length > 20 ||
    allowance === 'unlimited' ||
    allowance.startsWith('115792089');

  if (isUnlimited && contractEvidence && !contractEvidence.isVerified) {
    return 'critical';
  }

  if (isUnlimited) {
    return 'high';
  }

  if (contractEvidence && !contractEvidence.isVerified) {
    return 'medium';
  }

  if (contractEvidence && typeof contractEvidence.ageDays === 'number' && contractEvidence.ageDays < 14) {
    return 'medium';
  }

  return 'low';
}

async function resolveAuthenticatedUserId(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) {
    return null;
  }

  return data.user.id;
}

async function insertAlerts(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  walletAddress: string,
  scanId: string,
  findings: GuardianFinding[],
  approvals: GuardianApproval[],
  currentTrustScore: number,
  previousScan: {
    trust_score?: number | null;
    scanned_at?: string | null;
  } | null,
) {
  const alerts: Array<Record<string, unknown>> = [];
  const walletAddressLc = walletAddress.toLowerCase();

  if (
    previousScan?.trust_score != null &&
    previousScan.trust_score - currentTrustScore >= 10
  ) {
    alerts.push({
      user_id: userId,
      wallet_address: walletAddress,
      wallet_address_lc: walletAddressLc,
      scan_id: scanId,
      alert_type: 'posture_changed',
      severity: 'medium',
      title: 'Wallet posture changed',
      body: 'Guardian detected a noticeable trust-score drop since the previous scan.',
      dedupe_key: `posture:${walletAddressLc}:${scanId}`,
      metadata: {
        previousTrustScore: previousScan.trust_score,
      },
    });
  }

  for (const finding of findings.filter((item) => ['high', 'critical'].includes(item.severity))) {
    alerts.push({
      user_id: userId,
      wallet_address: walletAddress,
      wallet_address_lc: walletAddressLc,
      scan_id: scanId,
      alert_type: `finding:${finding.type.toLowerCase()}`,
      severity: finding.severity,
      title: finding.type.replaceAll('_', ' '),
      body: finding.description,
      dedupe_key: `finding:${walletAddressLc}:${finding.type}:${finding.description}`,
      metadata: {
        recommendation: finding.recommendation,
        contractAddress: finding.contractAddress,
        txHash: finding.txHash,
      },
    });
  }

  for (const approval of approvals.filter((item) => ['high', 'critical'].includes(item.riskLevel))) {
    alerts.push({
      user_id: userId,
      wallet_address: walletAddress,
      wallet_address_lc: walletAddressLc,
      scan_id: scanId,
      alert_type: 'approval_risk',
      severity: approval.riskLevel,
      title: `Approval risk: ${approval.token}`,
      body: `${approval.spenderName || approval.spender} can still move ${approval.token}${approval.isUnlimited ? ' with unlimited access' : ''}.`,
      dedupe_key: `approval:${walletAddressLc}:${approval.tokenAddress}:${approval.spender}`,
      metadata: {
        spender: approval.spender,
        tokenAddress: approval.tokenAddress,
      },
    });
  }

  if (alerts.length > 0) {
    await supabase.from('guardian_alert_events').upsert(alerts, { onConflict: 'dedupe_key' });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    const body = (await req.json()) as ScanRequest;
    const walletAddress = body.wallet_address;
    const network = (body.network || 'ethereum').toLowerCase();

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid wallet address' },
          requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const userId = await resolveAuthenticatedUserId(req, supabaseUrl, supabaseAnonKey);
    const walletAddressLc = walletAddress.toLowerCase();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(serializeForJson(payload))}\n\n`));
        };

        try {
          send({
            step: 'start',
            progress: 5,
            message: 'Starting Guardian wallet safety check...',
            requestId,
          });

          const previousScan = userId
            ? await serviceSupabase
                .from('guardian_wallet_scans')
                .select('id, trust_score, scanned_at')
                .eq('user_id', userId)
                .eq('wallet_address_lc', walletAddressLc)
                .eq('network', network)
                .order('scanned_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            : { data: null };

          send({
            step: 'approvals',
            progress: 25,
            message: 'Checking app permissions and token approvals...',
          });
          const approvalsResult = await probeApprovals(walletAddress, network);

          send({
            step: 'reputation',
            progress: 45,
            message: 'Checking wallet history and reputation...',
          });
          const [reputationResult, mixerResult, walletAgeResult] = await Promise.all([
            probeReputation(walletAddress, network),
            probeMixer(walletAddress, network),
            probeWalletAgeDays(walletAddress, network),
          ]);

          send({
            step: 'contracts',
            progress: 70,
            message: 'Reviewing spender contracts and evidence...',
          });

          const spenders = Array.from(
            new Set(approvalsResult.data.map((approval) => approval.spender.toLowerCase())),
          ).slice(0, 25);
          const contractProbeResults = await Promise.all(
            spenders.map((spender) => probeContractEvidence(spender, network)),
          );
          const contractEvidenceBySpender = new Map<string, GuardianContractEvidence>();
          for (const result of contractProbeResults) {
            contractEvidenceBySpender.set(result.data.address.toLowerCase(), result.data);
          }

          const approvals: GuardianApproval[] = approvalsResult.data.map((approval) => {
            const contractEvidence = contractEvidenceBySpender.get(approval.spender.toLowerCase());
            return {
              id: approval.id,
              spender: approval.spender,
              spenderName: contractEvidence?.label || approval.spenderName,
              token: approval.token,
              tokenAddress: approval.tokenAddress,
              amount: approval.allowance,
              isUnlimited: approval.isUnlimited,
              approvedAt: approval.approvedAt,
              chainId: approval.chainId,
              riskLevel: calculateApprovalRisk(approval.allowance, contractEvidence),
              evidence: approval.evidence,
              metadata: {
                txHash: approval.txHash,
                contractVerified: contractEvidence?.isVerified,
                contractAgeDays: contractEvidence?.ageDays,
              },
            };
          });

          send({
            step: 'score',
            progress: 88,
            message: 'Building evidence-backed Guardian score...',
          });

          const score = calculateGuardianScore({
            approvals,
            reputation: {
              ...reputationResult.data,
              evidence: reputationResult.evidence,
            },
            mixer: {
              ...mixerResult.data,
              evidence: mixerResult.evidence,
            },
            walletAgeDays: walletAgeResult.data,
            contractEvidence: Array.from(contractEvidenceBySpender.values()),
          });

          const scannedAt = new Date().toISOString();
          const rawPayload = {
            trust_score_percent: score.trustScorePercent,
            trust_score: score.trustScorePercent / 100,
            risk_score: score.riskScore,
            risk_level: score.riskLevel,
            confidence: score.confidence,
            flags: score.findings,
            approvals: score.approvals,
            scanned_at: scannedAt,
            guardian_scan_id: requestId,
            evidence_summary: score.evidenceSummary,
            score_factors: score.factors,
            recommended_actions: score.recommendedActions,
            data_source: 'live',
          };

          if (userId) {
            const scanInsert = await serviceSupabase
              .from('guardian_wallet_scans')
              .insert({
                user_id: userId,
                wallet_address: walletAddress,
                wallet_address_lc: walletAddressLc,
                network,
                chain_id: chainToId(network),
                trust_score: score.trustScorePercent,
                risk_score: score.riskScore,
                risk_level: score.riskLevel,
                status_label: score.statusLabel,
                status_tone: score.statusTone,
                confidence: score.confidence,
                findings_count: score.findings.length,
                approvals_count: score.approvals.length,
                recommended_actions: score.recommendedActions,
                evidence_summary: score.evidenceSummary,
                score_factors: score.factors,
                raw_payload: rawPayload,
                request_id: requestId,
                scanned_at: scannedAt,
              })
              .select('id')
              .single();

            if (!scanInsert.error && scanInsert.data?.id) {
              const scanId = scanInsert.data.id;

              if (score.findings.length > 0) {
                await serviceSupabase.from('guardian_wallet_findings').insert(
                  score.findings.map((finding) => ({
                    scan_id: scanId,
                    user_id: userId,
                    wallet_address: walletAddress,
                    wallet_address_lc: walletAddressLc,
                    network,
                    finding_type: finding.type,
                    severity: finding.severity,
                    description: finding.description,
                    recommendation: finding.recommendation,
                    source: finding.evidence?.source,
                    source_ref: finding.contractAddress || finding.txHash,
                    contract_address: finding.contractAddress,
                    tx_hash: finding.txHash,
                    evidence: finding.evidence || {},
                    metadata: finding.metadata || {},
                  })),
                );
              }

              if (score.approvals.length > 0) {
                await serviceSupabase.from('guardian_wallet_approvals').insert(
                  score.approvals.map((approval) => ({
                    scan_id: scanId,
                    user_id: userId,
                    wallet_address: walletAddress,
                    wallet_address_lc: walletAddressLc,
                    network,
                    token_symbol: approval.token,
                    token_address: approval.tokenAddress,
                    spender: approval.spender,
                    spender_name: approval.spenderName,
                    allowance: approval.amount,
                    is_unlimited: approval.isUnlimited,
                    approved_at: approval.approvedAt,
                    last_used_at: approval.lastUsedAt,
                    risk_level: approval.riskLevel,
                    usd_value: approval.valueUsd,
                    evidence: approval.evidence || {},
                    metadata: approval.metadata || {},
                  })),
                );
              }

              await insertAlerts(
                serviceSupabase,
                userId,
                walletAddress,
                scanId,
                score.findings,
                score.approvals,
                score.trustScorePercent,
                previousScan.data,
              );

              await serviceSupabase.from('guardian_reports').insert({
                user_id: userId,
                scope_type: 'wallet',
                scope_key: `${network}:${walletAddressLc}`,
                export_format: 'json',
                summary: {
                  walletAddress,
                  network,
                  findingsCount: score.findings.length,
                  approvalsCount: score.approvals.length,
                },
                posture: {
                  trustScore: score.trustScorePercent,
                  riskScore: score.riskScore,
                  riskLevel: score.riskLevel,
                  confidence: score.confidence,
                },
                trend: {
                  previousTrustScore: previousScan.data?.trust_score ?? null,
                  previousScannedAt: previousScan.data?.scanned_at ?? null,
                },
              });
            }
          }

          send({
            step: 'complete',
            progress: 100,
            data: rawPayload,
          });
          controller.close();
        } catch (error) {
          send({
            step: 'error',
            progress: 100,
            error: {
              code: 'SCAN_FAILED',
              message: error instanceof Error ? error.message : 'Guardian scan failed',
            },
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'x-request-id': requestId,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Guardian scan failed',
        },
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
