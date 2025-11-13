import { z } from 'zod'

// Environment variables for Vite
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: import.meta.env.VITE_NEXT_PUBLIC_SITE_URL || 'http://localhost:8080',
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://rebeznxivaxgserswhbn.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo',
})

// Server-only environment variables
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  ETHERSCAN_API_KEY: import.meta.env.ETHERSCAN_API_KEY,
  COINGECKO_API_KEY: import.meta.env.COINGECKO_API_KEY,
  TOKEN_UNLOCKS_API_KEY: import.meta.env.TOKEN_UNLOCKS_API_KEY,
  ALCHEMY_API_KEY: import.meta.env.ALCHEMY_API_KEY,
  UPSTASH_REDIS_REST_URL: import.meta.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
  CRON_SECRET: import.meta.env.CRON_SECRET,
}

export type Env = z.infer<typeof envSchema>
