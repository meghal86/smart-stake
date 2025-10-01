import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_DATA_MODE: z.enum(['live', 'mock']).default('mock'),
  
  // Server-only environment variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Live data providers
  ALCHEMY_API_KEY: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  COINGECKO_BASE: z.string().url().default('https://api.coingecko.com/api/v3'),
  
  // Optional monitoring
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  
  // Legacy API keys
  COINGECKO_API_KEY: z.string().optional(),
  TOKEN_UNLOCKS_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>

// Data mode utilities
export const isLiveDataMode = () => {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'live'
}

export const getDataModeLabel = () => {
  return isLiveDataMode() ? 'Live Data' : 'Demo Mode'
}
