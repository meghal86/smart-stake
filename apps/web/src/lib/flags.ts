import fs from 'node:fs';
const path = process.env.FEATURE_FLAGS_PATH || './feature_flags.json';
let cache: any = null;
export function getFlag(name: string, fallback?: any) {
  try { cache ??= JSON.parse(fs.readFileSync(path, 'utf8')); } catch {}
  return cache?.[name] ?? fallback;
}