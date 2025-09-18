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

    // Log the API key (first 10 chars for debugging)
    const apiKey = Deno.env.get('CHAINALYSIS_API_KEY')
    console.log('API Key exists:', !!apiKey)
    console.log('API Key prefix:', apiKey?.substring(0, 10))
    
    // Chainalysis Public API - correct format
    const chainalysisResponse = await fetch(`https://public.chainalysis.com/api/v1/address/${address}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    })

    console.log('Chainalysis response status:', chainalysisResponse.status)
    
    if (!chainalysisResponse.ok) {
      const errorText = await chainalysisResponse.text()
      console.error('Chainalysis API error response:', errorText)
      console.error('Request headers:', {
        'X-API-Key': `${apiKey?.substring(0, 10)}...`
      })
      throw new Error(`Chainalysis API error: ${chainalysisResponse.status} - ${errorText}`)
    }

    const data = await chainalysisResponse.json()
    
    // Parse Chainalysis Public API response
    const isSanctioned = data.identifications && data.identifications.length > 0

    const sanctionsList = data.identifications
      ?.filter((id: any) => id.category === 'sanctions')
      ?.map((id: any) => id.name || 'OFAC SDN List') || []

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