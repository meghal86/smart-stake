import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Server-only environment variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Optional API keys
  ETHERSCAN_API_KEY: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  TOKEN_UNLOCKS_API_KEY: z.string().optional(),

  // Hunter feature: external providers
  ALCHEMY_API_KEY: z.string().optional(),

  // Upstash Redis (server-side only)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Cron security (server-side only)
  CRON_SECRET: z.string().optional(),

  // Feature flags
  ENABLE_DEFI_LLAMA: z.string().optional(),
  DEFI_LLAMA_BASE: z.string().optional(),
  ENABLE_GALXE: z.string().optional(),
  ENABLE_LAYER3: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
