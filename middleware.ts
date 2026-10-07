// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Roles } from './schemas';
import {
  homeForRoles,
  resolveTenantSlugFromHostname,
  safeRedirectPath,
  verifyJWTForGate,
} from './utils';

/**
 * Paths anyone may open on the app host, signed in or not.
 *
 * The list used to carry a page's worth of routes that no longer exist or never did — `/explore`,
 * `/blogs`, `/landing2` and a typo `/landin2/`, `/seasons/*` — each a rule that could only wave
 * somebody through to a 404. It is now exactly the public pages that exist.
 */
const publicPaths = [
  '/', '/home', '/contact', '/terms', '/privacy', '/legal',
  '/login', '/register', '/access-denied', '/forgot-password', '/verify-email', '/accept-invite',
];

/**
 * Files the framework serves from metadata routes, which must reach them on every host: on the app
 * host they were redirected to `/login` (production `robots.txt` answered with a 307 to the login
 * page), and on a league host they were rewritten into the league tree, where they do not exist.
 */
const METADATA_FILE =
  /^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest|favicon\.ico|(icon|apple-icon|opengraph-image|twitter-image)(\d*)(\.\w+)?)$/;

/**
 * Old marketing addresses, and where they went (`PHASE5A_PRODUCT_SITE` §2).
 *
 * Only on the app host. The same paths — `/games`, `/teams`, `/standings`, `/news` — are real pages
 * on every league site, which is why this lives here rather than in `next.config.ts`, whose
 * redirects apply to every host alike.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/features': '/#fonctionnalites',
  '/pricing': '/#gratuit',
  '/plans': '/#gratuit',
  '/tenant/create': '/register',
  // A club's settings live where the organisation's and the competition's do (2026-10-07).
  '/team/edit': '/team/settings',
};
const LEGACY_TO_HOME = /^\/(games|tenants|news|about|api|docs|leagues|standings|teams|players|upload2?|welcome|health)(\/.*)?$/;

/** Old league-site addresses: the playoff page is plural now, and players are listed by club. */
const LEAGUE_REDIRECTS: Record<string, string> = {
  '/playoff': '/playoffs',
  '/players': '/teams',
};

/** Where a signed-in reader who asks for the landing, the login or the sign-up page is sent. */
const SIGNED_IN_SKIPS = new Set(['/', '/login', '/register']);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');
  // --- 1. Safety check for hostname ---
  if (!hostname) {
    console.warn('Middleware: Hostname not found in request headers.');
    return NextResponse.next();
  }

  // --- 2. Metadata files, on every host ---
  if (METADATA_FILE.test(pathname)) return NextResponse.next();

  // --- 3. The bare tenant domain is not a site: send it to the app ---
  // `dxscores.app` and `www.dxscores.app` served a complete second copy of the product — landing,
  // login, dashboards — on a second origin with its own cookies.
  const bareHost = hostname.split(':')[0].toLowerCase();
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN?.toLowerCase();
  if (tenantDomain && (bareHost === tenantDomain || bareHost === `www.${tenantDomain}`)) {
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com';
    return NextResponse.redirect(`https://${appDomain}${pathname}${search}`, 308);
  }

  // --- 4. League sites: rewrite into the league tree ---
  const tenantSlug = resolveTenantSlugFromHostname(hostname);
  if (tenantSlug && !['www', 'localhost'].includes(tenantSlug)) {
    // Two addresses the old site used, kept alive for links already shared (PHASE5B §5).
    if (LEAGUE_REDIRECTS[pathname]) {
      return NextResponse.redirect(new URL(`${LEAGUE_REDIRECTS[pathname]}${search}`, request.url), 308);
    }
    const newPath = url.pathname === '/'
    ? `/public/public_tenant/${tenantSlug}/`
    : `/public/public_tenant/${tenantSlug}${url.pathname}/`;

    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  // --- 5. From here on, the app host ---

  // The league tree is a rewrite target, not an address: reachable directly, every league page had
  // a duplicate at dxscores.com/public/public_tenant/<slug>/….
  if (pathname.startsWith('/public/')) {
    url.pathname = '/__not-found';
    return NextResponse.rewrite(url);
  }

  if (LEGACY_REDIRECTS[pathname]) {
    const target = LEGACY_REDIRECTS[pathname];
    // An in-app page keeps its query: it carries the scope (`ctxTeamId`…) an organisation or league
    // administrator arrived with. An anchor target is a marketing section and takes none.
    return NextResponse.redirect(new URL(target.includes('#') ? target : `${target}${search}`, request.url), 308);
  }
  if (LEGACY_TO_HOME.test(pathname)) {
    return NextResponse.redirect(new URL('/', request.url), 308);
  }

  // A signed-in reader has no use for the landing, the login form or the sign-up form: send them
  // where they work (the Vercel `/home` model; the landing stays at /home). A 307, never a 308 —
  // browsers cache permanent redirects, and a reader who signs out must get the landing back. An
  // expired-but-authentic token counts, as it does below: the cookie and the refresh token share a
  // seven-day life, and the dashboard's own refresh takes over. If the session is in fact dead, that
  // refresh fails, the session is cleared, and the reader lands on /login — no loop.
  if (SIGNED_IN_SKIPS.has(pathname)) {
    const token = request.cookies.get('accessToken')?.value;
    const secret = process.env.JWT_SECRET;
    if (token && secret) {
      const { payload } = await verifyJWTForGate(token, secret);
      if (payload && Array.isArray(payload.roles) && payload.roles.length > 0) {
        const wanted =
          pathname === '/login' ? safeRedirectPath(request.nextUrl.searchParams.get('redirect')) : null;
        return NextResponse.redirect(new URL(wanted ?? homeForRoles(payload.roles), request.url), 307);
      }
    }
  }

  // --- 6. Public pages, framework internals and API routes proceed ---
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // --- 7. Everything else needs a session ---
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    // If no token, redirect to login, preserving the intended destination.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname + search);
    //console.log(`Middleware: No access token, redirecting to login from ${pathname}.`);
    return NextResponse.redirect(redirectUrl);
  }

  // --- 8. Decode JWT to get user roles and details. ---
  // We tolerate an expired-but-authentic access token here: the signature is
  // still valid, so we trust its claims for UI role-gating and let the request
  // through. The client-side axios interceptor then refreshes the session on
  // its next API call (a full navigation never reaches that interceptor, which
  // is why an expired token used to bounce the user to /login on every reload).
  // Only a genuinely invalid token (bad signature / malformed) forces re-login.
  // Fail closed if the signing secret is not configured: never fall back to a
  // well-known default, which would make forged tokens verifiable.
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Middleware: JWT_SECRET is not configured; refusing to authorize.');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  const { payload: user } = await verifyJWTForGate(accessToken, jwtSecret);

  // If the token is genuinely invalid or has no roles, redirect to login.
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) {
    console.warn('Middleware: Invalid or empty user roles found for authenticated request.');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname + search);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('accessToken'); // Clear invalid token
    return response;
  }

  // Helper to check if user has a specific role
  const hasRole = (role: Roles) => user!.roles.includes(role); // 'user!' because we've checked for null above

  // Helper to construct access denied URL
  const redirectToAccessDenied = (reason: string) => {
    const accessDeniedUrl = request.nextUrl.clone();
    accessDeniedUrl.pathname = '/access-denied';
    accessDeniedUrl.searchParams.set('reason', reason);
    console.warn(`Middleware: Access denied to ${pathname} for reason: ${reason}`);
    return NextResponse.redirect(accessDeniedUrl);
  };

  // --- 9. Role-based access control for protected routes. ---
  // We check from most specific *UI panel* to least specific, allowing higher roles access.

  // System Admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('system_admin_only');
    }
    return NextResponse.next();
  }

  // Onboarding: the guided setup an organiser lands in straight after creating their
  // organisation, and can return to later. Open to anyone who can create a competition, which is
  // the same set that may reach /tenant and /league.
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    if (!hasRole(Roles.TENANT_ADMIN) && !hasRole(Roles.LEAGUE_ADMIN) && !hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('tenant_access_required');
    }
    return NextResponse.next();
  }

  // Tenant Admin routes
  if (pathname.startsWith('/tenant')) {
    if (!hasRole(Roles.TENANT_ADMIN) && !hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('tenant_access_required');
    }
    return NextResponse.next();
  }

  // League Admin routes
  if (pathname.startsWith('/league')) {
    if (!hasRole(Roles.LEAGUE_ADMIN) && !hasRole(Roles.TENANT_ADMIN) && !hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('league_access_required');
    }
    return NextResponse.next();
  }

  // Team Admin routes
  if (pathname.startsWith('/team')) {
    if (!hasRole(Roles.TEAM_ADMIN) && !hasRole(Roles.LEAGUE_ADMIN) && !hasRole(Roles.TENANT_ADMIN) && !hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('team_access_required');
    }
    return NextResponse.next();
  }

  /**
   * Leaf resources and the reader's own account: open to any authenticated user, because the
   * server resolves the record and attaches the permissions. A match and a player are the same
   * resource whichever of the four roles opens them, which is why they are here and not in a
   * role's own block (`GAME_AND_STANDINGS` §2.3).
   *
   * `/season` and `/coach` were both in this list with no page behind them — `/season` was retired
   * in item 14a, `/coach` in item 16 — and `/referee` never had one at all. A middleware entry for
   * a route that does not exist is a rule that can only ever wave somebody through to a 404.
   */
  const generalUserAuthenticatedPaths = [
    '/account', // Root of authenticated user accounts
    '/account/profile',
    '/account/security',
    '/account/preferences',
    '/player',
    '/game',
    '/post'
  ];
  if (generalUserAuthenticatedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // Any authenticated user is allowed here, as long as they have *any* role.
    //console.log(`Middleware: Allowing general authenticated user access to ${pathname}.`);
    return NextResponse.next();
  }

  // If we reach here, it means the path is an authenticated route
  // that is not explicitly covered by the above role-based checks.
  // By default, deny access to unknown authenticated routes to maintain security.
  console.warn(`Middleware: Unhandled authenticated path access attempt: ${pathname} by user roles: ${user.roles.join(', ')}`);
  return redirectToAccessDenied('unauthorized_path');
}

// Config to specify which paths the middleware should run on.
// This is crucial for performance and preventing infinite loops.
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public assets (fonts, images, etc.)
    // This matcher is broad enough to catch subdomains.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
