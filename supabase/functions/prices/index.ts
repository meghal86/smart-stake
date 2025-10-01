Deno.serve(async (req) => {
  const url = new URL(req.url)
  const coins = url.searchParams.get('ids') || 'ethereum,bitcoin'
  
  try {
    const response = await fetch(
      `${Deno.env.get('COINGECKO_BASE')}/simple/price?ids=${coins}&vs_currencies=usd`,
      { headers: { 'Cache-Control': 'max-age=60' } }
    )
    
    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60'
      }
    })
  } catch (error) {
    console.error('Price fetch error:', error)
    return new Response(JSON.stringify({}), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})