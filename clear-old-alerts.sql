-- Clear old alerts older than 1 day
DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '1 day';