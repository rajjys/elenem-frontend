// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Roles } from './schemas'; // Assuming Role enum is imported from Prisma or shared types
import { resolveTenantSlugFromHostname, verifyJWT } from './utils'; // Your utility to verify JWT
import { JwtPayload } from './types';

// Define your root domain from environment variables.
// Use a fallback for development if NEXT_PUBLIC_ROOT_DOMAIN is not set.
// For Vercel deployments, this will typically be your production domain.
// For local development, you might use 'localhost:3000' or similar.
const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? 'lvh.me:3000' : process.env.NEXT_PUBLIC_ROOT_DOMAIN  || 'elenem.site';

// Define public paths that are accessible to everyone, regardless of authentication status.
// These are typically paths on the root domain (e.g., website.com/login, website.com/leagues)
const publicPaths = [
  '/', '/about', '/help', '/explore',
  '/leagues', '/leagues/', '/leagues/*', // Public league profiles on the root domain
  '/teams', '/teams/', '/teams/*',     // Public team profiles on the root domain
  '/players', '/players/', '/players/*', // Public player profiles on the root domain
  '/games', '/games/', '/games/*',     // Public game listings on the root domain
  '/tenants', '/tenants/', '/tenants/*', // Public tenant profiles on the root domain
  '/seasons', '/seasons/', '/seasons/*', // Public season profiles on the root domain
  '/upload', '/upload/', '/upload/*',
  '/upload2', '/upload2/', '/upload2/*',
  '/login', '/register', '/access-denied', 
  '/blogs',
  '/landing', '/landing/', '/landing/*',
  '/landing2', '/landin2/', '/landing2*',
  '/health', '/health/', '/health/*',
  '/news', '/news/', '/news/*', // Public news articles on the root domain
   '/contact', '/pricing', '/features', '/terms', '/privacy',
   ///entity creation routes. These are protected by access Gates. Review is needed later
   '/tenant/create', '/tenant/create/', '/tenant/create/*',
   '/league/create', '/league/create/', '/league/create/*',
   '/team/create', '/team/create/', '/team/create/*',
   '/api', '/api/', '/api/*',
   '/terms', '/terms/', '/terms/*',
   '/legal', '/legal/', '/legal/*',
   '/about', '/about/', '/about/*',
   '/docs', '/docs/', '/docs/*',
   '/contact', '/contact/', '/contact/*',
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');
  // --- 1. Safety check for hostname ---
  if (!hostname) {
    console.warn('Middleware: Hostname not found in request headers.');
    return NextResponse.next();
  }

  // --- 2. Determine the tenant slug from the hostname for public-facing subdomains ---
  //console.log("Hostname: ", hostname);
  //console.log("Root Domain: ", ROOT_DOMAIN);
  const tenantSlug = resolveTenantSlugFromHostname(hostname, ROOT_DOMAIN);
  //console.log("Slug: ",tenantSlug)
  if (tenantSlug && !['www', 'localhost'].includes(tenantSlug)) {
    const newPath = url.pathname === '/'
    ? `/public/public_tenant/${tenantSlug}/`
    : `/public/public_tenant/${tenantSlug}${url.pathname}/`;

    url.pathname = newPath;
    //console.log("Rewriting to:", url.pathname);

    return NextResponse.rewrite(url);
  }

  // --- 4. Allow all general public paths on the root domain to proceed directly ---
  // This also includes Next.js internal paths and API routes.
  if (
    publicPaths.some(path => pathname === path || (path.endsWith('/*') && pathname.startsWith(path.slice(0, -1)))) ||
    pathname.startsWith('/_next') || // Next.js internal files (e.g., _next/static, _next/image)
    pathname.startsWith('/api/')     // Backend API routes (authentication/authorization handled by backend)
  ) {
    //console.log(`Middleware: Allowing public path ${pathname} to proceed.`);
    return NextResponse.next();
  }

  // --- 5. Check for access token for all non-public (authenticated) paths. ---
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    // If no token, redirect to login, preserving the intended destination.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname + search);
    //console.log(`Middleware: No access token, redirecting to login from ${pathname}.`);
    return NextResponse.redirect(redirectUrl);
  }

  // --- 6. Decode JWT to get user roles and details. ---
  // Cast the result of verifyJWT to our JwtPayload type.
  let user: JwtPayload | null = null;
  try {
    user = await verifyJWT(accessToken, process.env.JWT_SECRET || 'your-secret'); // Ensure JWT_SECRET is set
  } catch (error) {
    console.error('Middleware: JWT verification failed:', error);
    // If JWT verification fails, clear cookie and redirect to login.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname + search);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('accessToken'); // Clear invalid token
    return response;
  }

  // If JWT verification fails or user roles are invalid/empty, redirect to login.
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

  // --- 7. Role-based access control for protected routes. ---
  // We check from most specific *UI panel* to least specific, allowing higher roles access.

  // System Admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasRole(Roles.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('system_admin_only');
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

  // General authenticated user routes (e.g., /account, /player-dashboard)
  const generalUserAuthenticatedPaths = [
    '/account', // Root of authenticated user accounts
    '/account/profile',
    '/account/security',
    '/account/preferences',
    '/season',
    '/player',
    '/coach',
    '/referee',
    '/game',
    // Add other paths specific to logged-in general users, players, referees etc.
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
