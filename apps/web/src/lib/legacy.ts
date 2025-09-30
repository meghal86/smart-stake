export function legacyUrl(path = '') {
  const isProd = process.env.NODE_ENV === 'production';
  const base = isProd ? '' : 'http://localhost:8080'; // dev opens new origin
  const cleaned = path.startsWith('/') ? path.slice(1) : path;
  const legacyPath = cleaned ? `/legacy/${cleaned}` : '/legacy';
  return `${base}${legacyPath}`;
}