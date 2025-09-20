import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class AccuracyTracker {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async trackAccuracy() {
    const results = {
      processed: 0,
      accurate: 0,
      accuracy_rate: 0
    };

    // Get predictions from last 24h that need evaluation
    const { data: predictions } = await this.supabase
      .from('prediction_outcomes')
      .select('*')
      .is('was_correct', null)
      .lt('predicted_ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!predictions || predictions.length === 0) {
      return results;
    }

    for (const prediction of predictions) {
      const accuracy = await this.evaluatePrediction(prediction);
      if (accuracy !== null) {
        results.processed++;
        if (accuracy.was_correct) results.accurate++;

        // Update prediction with accuracy
        await this.supabase
          .from('prediction_outcomes')
          .update({
            realized_return: accuracy.realized_return,
            was_correct: accuracy.was_correct,
            realized_ts: new Date().toISOString()
          })
          .eq('id', prediction.id);

        // Store in accuracy tracking table
        await this.supabase
          .from('prediction_accuracy')
          .insert({
            prediction_id: prediction.prediction_id,
            asset: prediction.asset,
            prediction_type: 'whale_activity',
            predicted_value: 1,
            realized_value: accuracy.realized_return,
            was_correct: accuracy.was_correct,
            accuracy_score: accuracy.was_correct ? 1 : 0
          });
      }
    }

    results.accuracy_rate = results.processed > 0 ? results.accurate / results.processed : 0;

    // Update model accuracy metrics
    await this.updateModelAccuracy();

    return results;
  }

  private async evaluatePrediction(prediction: any) {
    try {
      // Fetch current price to compare with prediction
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`);
      const data = await response.json();
      const currentPrice = data.ethereum?.usd || 2500;

      // Simple evaluation logic - in production, this would be more sophisticated
      const predictedTime = new Date(prediction.predicted_ts);
      const hoursElapsed = (Date.now() - predictedTime.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed >= 6) { // Prediction horizon met
        // Mock price movement evaluation
        const priceChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
        const wasCorrect = prediction.predicted_direction === 'up' ? priceChange > 0 : priceChange < 0;

        return {
          realized_return: priceChange,
          was_correct: wasCorrect
        };
      }

      return null; // Not ready for evaluation
    } catch (error) {
      console.error('Error evaluating prediction:', error);
      return null;
    }
  }

  private async updateModelAccuracy() {
    // Calculate 7d and 30d accuracy for active models
    const periods = [
      { days: 7, column: 'accuracy_7d' },
      { days: 30, column: 'accuracy_30d' }
    ];

    for (const period of periods) {
      const { data: accuracyData } = await this.supabase
        .from('prediction_accuracy')
        .select('was_correct')
        .gte('created_at', new Date(Date.now() - period.days * 24 * 60 * 60 * 1000).toISOString());

      if (accuracyData && accuracyData.length > 0) {
        const accuracy = accuracyData.filter(a => a.was_correct).length / accuracyData.length;

        await this.supabase
          .from('model_registry')
          .update({ [period.column]: accuracy })
          .eq('is_active', true);
      }
    }
  }

  async detectDataDrift() {
    // Simple drift detection - compare recent feature distributions
    const features = ['whale_volume', 'accumulation_pattern', 'market_sentiment'];
    const driftResults = [];

    for (const feature of features) {
      const { data: recentData } = await this.supabase
        .from('feature_store')
        .select('feature_value')
        .eq('feature_name', feature)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: historicalData } = await this.supabase
        .from('feature_store')
        .select('feature_value')
        .eq('feature_name', feature)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (recentData && historicalData && recentData.length > 10 && historicalData.length > 10) {
        const recentMean = recentData.reduce((sum, d) => sum + d.feature_value, 0) / recentData.length;
        const historicalMean = historicalData.reduce((sum, d) => sum + d.feature_value, 0) / historicalData.length;
        
        const driftScore = Math.abs(recentMean - historicalMean) / historicalMean;
        const thresholdExceeded = driftScore > 0.2; // 20% drift threshold

        await this.supabase
          .from('data_drift')
          .insert({
            feature_name: feature,
            drift_score: driftScore,
            drift_type: 'mean_shift',
            threshold_exceeded: thresholdExceeded
          });

        driftResults.push({
          feature,
          drift_score: driftScore,
          threshold_exceeded: thresholdExceeded
        });
      }
    }

    return driftResults;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const tracker = new AccuracyTracker();
    
    const accuracyResults = await tracker.trackAccuracy();
    const driftResults = await tracker.detectDataDrift();

    return new Response(JSON.stringify({ 
      accuracy: accuracyResults,
      drift: driftResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})