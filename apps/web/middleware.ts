import { NextResponse, type NextRequest } from 'next/server';
import { getUserTier } from './src/lib/auth';
import { getFlag } from './src/lib/flags';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Kill switch: redirect to legacy if Next.js web is disabled
  if (!getFlag('next_web_enabled', true) && !url.pathname.startsWith('/legacy')) {
    return NextResponse.redirect(new URL('/legacy', req.url));
  }
  
  const tier = await getUserTier(req); // 'lite'|'pro'|'enterprise'

  // Gate Pro/Enterprise routes
  if (url.pathname.startsWith('/pro') && tier === 'lite') {
    url.pathname = '/upgrade';
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith('/enterprise') && tier !== 'enterprise') {
    url.pathname = '/upgrade';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set('x-user-tier', tier);
  return res;
}

export const config = { 
  matcher: ['/((?!_next|static|favicon.ico).*)'] 
};
