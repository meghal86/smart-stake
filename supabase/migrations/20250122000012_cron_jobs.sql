-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily drift monitoring at 6 AM UTC
SELECT cron.schedule(
  'drift-monitoring-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/drift-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Schedule cleanup jobs
SELECT cron.schedule(
  'cleanup-expired-shares',
  '0 2 * * *',  -- Daily at 2 AM UTC
  'SELECT cleanup_expired_shares();'
);

SELECT cron.schedule(
  'cleanup-scenario-cache', 
  '*/30 * * * *',  -- Every 30 minutes
  'SELECT cleanup_scenario_cache();'
);

-- Schedule nightly upgrade forecasting
SELECT cron.schedule(
  'forecast-upgrades-nightly',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/forecast-upgrades',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Schedule prediction outcome labeling
SELECT cron.schedule(
  'label-prediction-outcomes',
  '*/15 * * * *',  -- Every 15 minutes
  'SELECT label_prediction_outcomes();'
);