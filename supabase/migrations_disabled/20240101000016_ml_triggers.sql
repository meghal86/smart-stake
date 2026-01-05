-- Function to trigger ML retraining when new whale data arrives
CREATE OR REPLACE FUNCTION trigger_ml_training()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if significant whale activity (>$1M)
  IF NEW.amount_usd > 1000000 THEN
    -- Call ML training function asynchronously
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/ml-training',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('trigger', 'whale_transaction')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on whale transactions
CREATE TRIGGER whale_transaction_ml_trigger
  AFTER INSERT ON whale_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ml_training();

-- Trigger on whale classifications
CREATE TRIGGER whale_classification_ml_trigger
  AFTER INSERT OR UPDATE ON whale_classifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ml_training();