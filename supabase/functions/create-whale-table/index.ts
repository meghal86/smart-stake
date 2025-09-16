import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS whale_balances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      address TEXT NOT NULL UNIQUE,
      chain TEXT NOT NULL DEFAULT 'ethereum',
      balance DECIMAL(36,18) NOT NULL DEFAULT 0,
      ts TIMESTAMP NOT NULL DEFAULT NOW(),
      provider TEXT NOT NULL DEFAULT 'alchemy',
      method TEXT NOT NULL DEFAULT 'eth_getBalance',
      ingested_at TIMESTAMP DEFAULT NOW()
    );
  `
  
  return new Response(sql, {
    headers: { 'Content-Type': 'text/plain' }
  })
})