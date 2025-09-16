-- Fix whale_signals table schema
ALTER TABLE whale_signals ADD COLUMN IF NOT EXISTS chain TEXT NOT NULL DEFAULT 'ethereum';