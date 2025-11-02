import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WalletScanResult {
  address: string;
  trust_score: number;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { wallets } = await req.json()
    
    if (!wallets || !Array.isArray(wallets)) {
      throw new Error('Invalid wallets array')
    }

    const results: WalletScanResult[] = []

    for (const address of wallets) {
      // Mock scan logic - replace with real blockchain analysis
      const mockResult: WalletScanResult = {
        address,
        trust_score: Math.floor(Math.random() * 40) + 60, // 60-100
        risks: [
          {
            type: 'token_approval',
            severity: Math.random() > 0.5 ? 'medium' : 'low',
            description: 'Multiple token approvals detected'
          }
        ]
      }
      
      results.push(mockResult)
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})