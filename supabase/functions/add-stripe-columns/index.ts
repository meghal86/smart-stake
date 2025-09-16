import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  `
  
  return new Response(sql, {
    headers: { 'Content-Type': 'text/plain' }
  })
})