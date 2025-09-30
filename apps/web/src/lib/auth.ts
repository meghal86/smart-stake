import type { NextRequest } from 'next/server';

export async function getUserTier(req: NextRequest): Promise<'lite'|'pro'|'enterprise'> {
  // TODO: Replace with real Supabase/NextAuth implementation
  const url = new URL(req.url);
  const tier = url.searchParams.get('tier') as 'lite'|'pro'|'enterprise';
  
  // For now, return 'lite' as default
  return tier ?? 'lite';
}
