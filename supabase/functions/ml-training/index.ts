import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get whale transaction data for training
    const { data: whaleData } = await supabase
      .from('whale_transactions')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Get whale classifications for pattern analysis
    const { data: classifications } = await supabase
      .from('whale_classifications')
      .select('*')

    // Simple ML training simulation
    const trainModels = (data: any[]) => {
      const clusteringAccuracy = Math.min(95, 75 + (data.length / 100) * 5)
      const liquidationAccuracy = Math.min(98, 85 + (data.filter(d => d.risk_score > 7).length / 50) * 3)
      const accumulationAccuracy = Math.min(90, 70 + (data.filter(d => d.whale_type === 'hodler').length / 30) * 4)

      return { clusteringAccuracy, liquidationAccuracy, accumulationAccuracy }
    }

    const accuracies = trainModels(whaleData || [])

    // Update model accuracies
    await supabase.from('ml_models').update({ accuracy: accuracies.clusteringAccuracy, last_trained: new Date().toISOString() }).eq('type', 'clustering')
    await supabase.from('ml_models').update({ accuracy: accuracies.liquidationAccuracy, last_trained: new Date().toISOString() }).eq('type', 'liquidation')
    await supabase.from('ml_models').update({ accuracy: accuracies.accumulationAccuracy, last_trained: new Date().toISOString() }).eq('type', 'accumulation')

    // Generate new predictions based on whale data
    const generatePredictions = async () => {
      // Clear old predictions
      await supabase.from('ml_predictions').update({ status: 'expired' }).lt('expires_at', new Date().toISOString())

      const highRiskWhales = whaleData?.filter(w => w.risk_score > 8) || []
      const hodlers = classifications?.filter(c => c.whale_type === 'hodler') || []
      const traders = classifications?.filter(c => c.whale_type === 'trader') || []

      const predictions = []

      // Liquidation predictions for high-risk whales
      if (highRiskWhales.length > 0) {
        predictions.push({
          model_id: (await supabase.from('ml_models').select('id').eq('type', 'liquidation').single()).data?.id,
          prediction_type: 'liquidation',
          confidence: Math.min(95, 80 + highRiskWhales.length * 2),
          prediction_text: `${highRiskWhales.length} high-risk whales detected with liquidation probability`,
          impact_text: `Potential sell pressure: $${(highRiskWhales.reduce((sum, w) => sum + (w.amount_usd || 0), 0) / 1000000).toFixed(1)}M`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Accumulation predictions for hodlers
      if (hodlers.length > 5) {
        predictions.push({
          model_id: (await supabase.from('ml_models').select('id').eq('type', 'accumulation').single()).data?.id,
          prediction_type: 'accumulation',
          confidence: Math.min(90, 70 + hodlers.length),
          prediction_text: `${hodlers.length} institutional hodlers showing accumulation patterns`,
          impact_text: 'Bullish signal for next 48-72 hours',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        })
      }

      // Clustering predictions for coordinated activity
      if (traders.length > 3) {
        predictions.push({
          model_id: (await supabase.from('ml_models').select('id').eq('type', 'clustering').single()).data?.id,
          prediction_type: 'clustering',
          confidence: Math.min(88, 75 + traders.length),
          prediction_text: `Coordinated whale activity detected among ${traders.length} active traders`,
          impact_text: 'Medium to high market volatility expected',
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        })
      }

      // Insert new predictions
      if (predictions.length > 0) {
        await supabase.from('ml_predictions').insert(predictions)
      }
    }

    await generatePredictions()

    return new Response(JSON.stringify({ 
      success: true, 
      modelsUpdated: 3,
      accuracies,
      dataPoints: whaleData?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})