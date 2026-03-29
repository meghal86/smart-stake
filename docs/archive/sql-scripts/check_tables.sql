SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%whale%';
SELECT COUNT(*) as whale_data_cache_count FROM whale_data_cache;
SELECT * FROM whale_data_cache LIMIT 5;