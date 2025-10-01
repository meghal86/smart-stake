import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: freshness } = await supabase
      .from('data_freshness')
      .select('*')
      .single()
    
    const { data: volume } = await supabase
      .from('volume_24h')
      .select('*')
      .single()
    
    const latestEventAgeSec = freshness?.age_seconds || 999999
    const provenance = latestEventAgeSec <= 180 ? 'Real' : 'Simulated'
    
    let status = 200
    if (latestEventAgeSec > 600) status = 500
    else if (latestEventAgeSec > 180) status = 206
    
    return Response.json({
      status: status === 200 ? 'healthy' : status === 206 ? 'degraded' : 'unhealthy',
      latestEventAgeSec,
      provenance,
      vol24h: volume?.total_volume || 0,
      timestamp: new Date().toISOString()
    }, { status })
    
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}