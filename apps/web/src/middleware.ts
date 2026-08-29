import { NextRequest, NextResponse } from 'next/server';

// Domains/hosts that should NOT be treated as a tenant subdomain -
// these serve the platform's own pages (homepage, admin login, etc.)
// Add your real production root domain here once you have one, e.g. 'ekballo.com'.
const ROOT_HOSTS = ['localhost:3000', '127.0.0.1:3000'];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Never rewrite Next.js internals or static assets.
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(host);

  // No subdomain (root domain / localhost without a prefix) - serve
  // platform pages as-is, untouched.
  if (!subdomain) {
    return NextResponse.next();
  }

  // Already a /tenant/* URL (e.g. someone linked directly, or our own
  // temporary homepage form during step 2) - don't double-rewrite.
  if (pathname.startsWith('/tenant/')) {
    return NextResponse.next();
  }

  // Rewrite e.g. amen-harvard-academy-7jcq.localhost:3000/login
  // to        /tenant/amen-harvard-academy-7jcq/login
  // internally - the browser's URL bar keeps showing the clean subdomain.
  // A bare root visit (just the subdomain, no path) defaults to that
  // school's login page, since that's the only tenant page that exists
  // so far - revisit this once a tenant homepage/dashboard exists.
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/tenant/${subdomain}/login` : `/tenant/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

function extractSubdomain(host: string): string | null {
  if (!host) return null;

  const hostWithoutPort = host.split(':')[0];

  // Handles both real domains (foo.ekballo.com) and local dev
  // (foo.localhost) - *.localhost resolves to loopback automatically
  // in modern browsers, no /etc/hosts editing required.
  if (hostWithoutPort.endsWith('.localhost')) {
    const sub = hostWithoutPort.replace('.localhost', '');
    return sub && sub !== 'www' ? sub : null;
  }

  if (ROOT_HOSTS.includes(host)) {
    return null;
  }

  const parts = hostWithoutPort.split('.');
  // e.g. "amen-harvard-academy-7jcq.ekballo.com" -> 3 parts -> subdomain present
  // e.g. "ekballo.com" or "www.ekballo.com" -> root domain, no tenant subdomain
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
