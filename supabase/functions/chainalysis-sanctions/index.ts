import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address } = await req.json()
    
    if (!address) {
      throw new Error('Address is required')
    }

    // Chainalysis Sanctions API call
    const chainalysisResponse = await fetch('https://api.chainalysis.com/api/kyt/v2/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CHAINALYSIS_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address,
        asset: 'ETH'
      })
    })

    if (!chainalysisResponse.ok) {
      const errorText = await chainalysisResponse.text()
      console.error('Chainalysis API error:', errorText)
      throw new Error(`Chainalysis API error: ${chainalysisResponse.status}`)
    }

    const data = await chainalysisResponse.json()
    
    // Parse Chainalysis response
    const isSanctioned = data.identifications?.some((id: any) => 
      id.category === 'sanctions' || 
      id.category === 'law enforcement'
    ) || false

    const sanctionsList = data.identifications
      ?.filter((id: any) => id.category === 'sanctions' || id.category === 'law enforcement')
      ?.map((id: any) => id.name || 'Unknown Sanctions List') || []

    const result = {
      isSanctioned,
      sanctionsList,
      confidence: data.risk || 'unknown',
      lastChecked: new Date().toISOString(),
      rawData: data // For debugging
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Sanctions check error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isSanctioned: false,
        sanctionsList: [],
        lastChecked: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})