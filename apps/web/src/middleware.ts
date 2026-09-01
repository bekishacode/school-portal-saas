import { NextRequest, NextResponse } from 'next/server';

// Domains/hosts that should NOT be treated as a tenant subdomain -
// these serve the platform's own pages (homepage, admin login, etc.)
// Add your real production root domain here once you have one, e.g. 'ekballo.com'.
const ROOT_HOSTS = ['localhost:3000', '127.0.0.1:3000'];

// Any path that looks like a static/metadata file (has a file extension)
// should never be rewritten into /tenant/<subdomain>/... - this covers
// icon.svg, favicon.ico, robots.txt, sitemap.xml, manifest.json, etc.
// Without this, a request for /icon.svg on a subdomain host would get
// rewritten to /tenant/<subdomain>/icon.svg, which doesn't exist -> 404,
// which is exactly why the favicon worked on the root domain but not on
// any tenant subdomain.
const STATIC_FILE_PATTERN = /\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Never rewrite Next.js internals, API routes, or static/metadata files
  // (icon.svg, favicon.ico, robots.txt, manifest.json, etc.) - these must
  // stay identical across every tenant subdomain and the root domain.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    STATIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/tenant/')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/tenant/${subdomain}/login` : `/tenant/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

function extractSubdomain(host: string): string | null {
  if (!host) return null;

  const hostWithoutPort = host.split(':')[0];

  if (hostWithoutPort.endsWith('.localhost')) {
    const sub = hostWithoutPort.replace('.localhost', '');
    return sub && sub !== 'www' ? sub : null;
  }

  if (ROOT_HOSTS.includes(host)) {
    return null;
  }

  const parts = hostWithoutPort.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
}

export const config = {
  // Excludes _next internals AND any path with a file extension
  // (icon.svg, favicon.ico, robots.txt, manifest.json, images, etc.)
  // from even invoking this middleware at all - more efficient than
  // relying purely on the in-function check above, though both are
  // kept as a safety net against each other.
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
};