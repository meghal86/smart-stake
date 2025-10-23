// Simple Upstash REST cache wrapper for Edge Functions
const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

async function redis(command: unknown[]): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  const res = await fetch(UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({ result: null }));
  return data.result ?? null;
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const raw = await redis(['GET', `cache:${key}`]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSec: number) {
  const payload = JSON.stringify(value);
  await redis(['SET', `cache:${key}`, payload, 'EX', String(ttlSec)]);
}
