import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { enforceTier } from '../_lib/tierGuard.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Enforce Premium+ tier for exports
    const { user, tier, error } = await enforceTier(req, 'premium');
    if (error) {
      return new Response(JSON.stringify({
        error: "Upgrade required: export requires premium+ subscription",
        code: "TIER_REQUIRED",
        required_tier: "premium"
      }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { scenarioId, format = 'csv' } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch scenario data
    const { data: scenario } = await supabase
      .from('scenario_runs')
      .select('*')
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .single();

    if (!scenario) {
      return new Response(JSON.stringify({ error: 'Scenario not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate export with metadata stamps
    const exportData = generateExportData(scenario, user, tier);
    
    if (format === 'csv') {
      const csv = generateCSV(exportData);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="scenario-${scenarioId}.csv"`
        }
      });
    } else {
      // PDF generation would go here
      return new Response(JSON.stringify({ error: 'PDF export not implemented' }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Export failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateExportData(scenario: any, user: any, tier: string) {
  const timestamp = new Date().toISOString();
  
  return {
    // Metadata stamps for auditability
    export_metadata: {
      prediction_id: scenario.id,
      model_version: scenario.model_version || 'scn-v1.0',
      user_tier: tier,
      exported_at: timestamp,
      exported_by: user.id
    },
    
    // Scenario data
    scenario_data: {
      asset: scenario.inputs?.asset,
      timeframe: scenario.inputs?.timeframe,
      prediction_delta: scenario.outputs?.deltaPct,
      confidence: scenario.confidence,
      created_at: scenario.created_at,
      features: scenario.outputs?.features || {}
    }
  };
}

function generateCSV(data: any): string {
  const { export_metadata, scenario_data } = data;
  
  let csv = '# WhalePlus Scenario Export\n';
  csv += `# Exported: ${export_metadata.exported_at}\n`;
  csv += `# Prediction ID: ${export_metadata.prediction_id}\n`;
  csv += `# Model Version: ${export_metadata.model_version}\n`;
  csv += `# User Tier: ${export_metadata.user_tier}\n`;
  csv += '#\n';
  
  // Headers
  csv += 'Field,Value\n';
  
  // Data rows
  csv += `Asset,${scenario_data.asset}\n`;
  csv += `Timeframe,${scenario_data.timeframe}\n`;
  csv += `Prediction Delta %,${scenario_data.prediction_delta}\n`;
  csv += `Confidence,${scenario_data.confidence}\n`;
  csv += `Created At,${scenario_data.created_at}\n`;
  
  // Features
  if (scenario_data.features) {
    Object.entries(scenario_data.features).forEach(([key, value]) => {
      csv += `Feature: ${key},${value}\n`;
    });
  }
  
  return csv;
}