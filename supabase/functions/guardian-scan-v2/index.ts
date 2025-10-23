/**
 * Guardian Scan v2 - SSE Streaming
 * Progressively stream scan results for world-class UX
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple helper functions
function generateRequestId() {
  return crypto.randomUUID();
}

function createLogger(requestId: string) {
  return {
    info: (msg: string, data?: any) => console.log(`[${requestId}] ${msg}`, data),
    warn: (msg: string, data?: any) => console.warn(`[${requestId}] ${msg}`, data),
    error: (msg: string, error?: any) => console.error(`[${requestId}] ${msg}`, error)
  };
}

async function checkRateLimits(ip: string) {
  return { success: true }; // Simplified for now
}

async function probeApprovals(address: string, network: string) {
  return { error: false, evidence: { approvals: [] } };
}

async function probeReputation(address: string) {
  return { error: false, data: { level: 'good' }, evidence: { reputation: 'clean' } };
}

async function probeMixer(address: string, network: string) {
  return { error: false, data: { directInteractions: 0 }, evidence: { mixers: [] } };
}

function calculateConfidence(evidence: any[]) {
  return 85; // Mock confidence
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  wallet_address: string;
  network: string;
}

interface RiskFactor {
  category: string;
  impact: number;
  severity: string;
  description: string;
  evidence?: any;
}

function calculateTrustScore(factors: RiskFactor[], confidence: number): {
  score: number;
  grade: string;
  confidence: number;
} {
  let score = 100;

  for (const factor of factors) {
    score += factor.impact;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return { score, grade, confidence };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const logger = createLogger(requestId);

  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting
    const rateLimit = await checkRateLimits(ip);
    if (!rateLimit.success) {
      logger.warn('rate_limit_exceeded', { ip, retryAfterSec: rateLimit.retryAfterSec });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfterSec: rateLimit.retryAfterSec,
          },
          requestId,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
        }
      );
    }

    // Parse request
    const body: ScanRequest = await req.json();
    const { wallet_address, network } = body;

    if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid wallet address' },
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('scan_started', { address: wallet_address, network });

    // Skip database operations for now
    const scanId = generateRequestId();

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function send(data: any) {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        }

        try {
          const allEvidence: any[] = [];
          const factors: RiskFactor[] = [];

          // Step 1: Approvals (25%)
          send({ step: 'approvals', progress: 25, message: 'Checking token approvals...' });
          logger.info('scan_step', { step: 'approvals' });

          const approvalsResult = await Promise.race([
            probeApprovals(wallet_address, network),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
          ]) as any;

          if (approvalsResult.error) {
            factors.push({
              category: 'Approvals',
              impact: 0,
              severity: 'unknown',
              description: 'Unable to check approvals',
              evidence: approvalsResult.evidence,
            });
          } else {
            allEvidence.push(approvalsResult.evidence);
            // Simplified: no risky approvals in this demo
          }

          // Step 2: Reputation (50%)
          send({ step: 'reputation', progress: 50, message: 'Checking address reputation...' });
          logger.info('scan_step', { step: 'reputation' });

          const reputationResult = await Promise.race([
            probeReputation(wallet_address),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
          ]) as any;

          if (reputationResult.error) {
            factors.push({
              category: 'Reputation',
              impact: 0,
              severity: 'unknown',
              description: 'Unable to check reputation',
              evidence: reputationResult.evidence,
            });
          } else {
            allEvidence.push(reputationResult.evidence);
            if (reputationResult.data.level === 'good') {
              factors.push({
                category: 'Reputation',
                impact: 10,
                severity: 'low',
                description: 'Positive reputation indicators',
                evidence: reputationResult.evidence,
              });
            }
          }

          // Step 3: Mixer (75%)
          send({ step: 'mixer', progress: 75, message: 'Checking mixer proximity...' });
          logger.info('scan_step', { step: 'mixer' });

          const mixerResult = await Promise.race([
            probeMixer(wallet_address, network),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
          ]) as any;

          if (mixerResult.error) {
            factors.push({
              category: 'Mixer',
              impact: 0,
              severity: 'unknown',
              description: 'Unable to check mixer activity',
              evidence: mixerResult.evidence,
            });
          } else {
            allEvidence.push(mixerResult.evidence);
            if (mixerResult.data.directInteractions > 0) {
              factors.push({
                category: 'Mixer',
                impact: -40,
                severity: 'high',
                description: 'Direct mixer interactions detected',
                evidence: mixerResult.evidence,
              });
            }
          }

          // Calculate final score
          const confidence = calculateConfidence(allEvidence);
          const { score, grade } = calculateTrustScore(factors, confidence);

          // Skip database insert for now

          // Send final result
          send({
            step: 'complete',
            progress: 100,
            data: {
              trust_score: score / 100,
              risk_score: (100 - score) / 10,
              risk_level: score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High',
              confidence,
              flags: factors.map((f, idx) => ({
                id: idx + 1,
                type: f.category,
                severity: f.severity,
                details: f.description,
                timestamp: new Date().toISOString(),
              })),
              wallet_address,
              network: network || 'Ethereum Mainnet',
              last_scan: new Date().toISOString(),
              guardian_scan_id: scanId,
            },
          });

          logger.info('scan_completed', { score, confidence, flagsCount: factors.length });

          controller.close();
        } catch (error) {
          logger.error('scan_error', error);
          send({
            step: 'error',
            error: {
              code: 'SCAN_ERROR',
              message: error instanceof Error ? error.message : 'Scan failed',
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
        'Connection': 'keep-alive',
        'x-request-id': requestId,
      },
    });
  } catch (error) {
    logger.error('request_error', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      }
    );
  }
});

