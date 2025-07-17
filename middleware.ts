// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from './schemas'; // Assuming Role enum is imported from Prisma or shared types
import { verifyJWT } from './utils'; // Your utility to verify JWT
import { JwtPayload } from './types';

// Define public paths that are accessible to everyone, regardless of authentication status.
const publicPaths = [
  '/', '/about', '/help', '/explore',
  '/leagues', '/leagues/', '/leagues/*', // Public league profiles
  '/teams', '/teams/', '/teams/*',     // Public team profiles
  '/players', '/players/', '/players/*', // Public player profiles
  '/seasons', '/seasons/', '/seasons/*', // Public season profiles
  '/login', '/register', '/access-denied', '/blog', '/contact', '/pricing', '/features', '/terms', '/privacy'
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow all public paths to proceed directly.
  // This also includes Next.js internal paths and API routes.
  if (
    publicPaths.some(path => pathname === path || (path.endsWith('/*') && pathname.startsWith(path.slice(0, -1)))) ||
    pathname.startsWith('/_next') || // Next.js internal files
    pathname.startsWith('/api/')     // Backend API routes (authentication/authorization handled by backend)
  ) {
    return NextResponse.next();
  }

  // 2. Check for access token for all non-public paths.
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    // If no token, redirect to login, preserving the intended destination.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }

  // 3. Decode JWT to get user roles and details.
  // Cast the result of verifyJWT to our new CustomJWTPayload type.
  const user: JwtPayload | null = await verifyJWT(accessToken, process.env.JWT_SECRET || 'your-secret');//Type Error here

  // If JWT verification fails, redirect to login.
  // Now `user.roles` will be correctly typed as `Role[]`.
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) { // Added Array.isArray check for robustness
    console.warn('Middleware: Invalid or empty user roles found for authenticated request.');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }

  // Helper to check if user has a specific role
  const hasRole = (role: Role) => user.roles.includes(role);

  // Helper to construct access denied URL
  const redirectToAccessDenied = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = '/access-denied';
    url.searchParams.set('reason', reason);
    return NextResponse.redirect(url);
  };

  // 4. Role-based access control for protected routes.
  // We check from most specific *UI panel* to least specific, allowing higher roles access.

  // System Admin routes
  if (pathname.startsWith('/admin')) {
    // Only SYSTEM_ADMIN can access the platform admin panel. This is the top of the hierarchy.
    if (!hasRole(Role.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('system_admin_only');
    }
    return NextResponse.next();
  }

  // Tenant Admin routes
  if (pathname.startsWith('/tenant')) {
    // To access the tenant panel, you must be a TENANT_ADMIN or a SYSTEM_ADMIN.
    if (!hasRole(Role.TENANT_ADMIN) && !hasRole(Role.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('tenant_access_required');
    }
    return NextResponse.next();
  }

  // League Admin routes
  if (pathname.startsWith('/league')) {
    // To access a league panel/layout, you must be a LEAGUE_ADMIN,
    // or a higher role like TENANT_ADMIN or SYSTEM_ADMIN.
    if (!hasRole(Role.LEAGUE_ADMIN) && !hasRole(Role.TENANT_ADMIN) && !hasRole(Role.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('league_access_required');
    }
    return NextResponse.next();
  }

  // Team Admin routes
  if (pathname.startsWith('/team')) {
    // Anyone in the management hierarchy can typically view a team's panel.
    if (!hasRole(Role.TEAM_ADMIN) && !hasRole(Role.LEAGUE_ADMIN) && !hasRole(Role.TENANT_ADMIN) && !hasRole(Role.SYSTEM_ADMIN)) {
      return redirectToAccessDenied('team_access_required');
    }
    return NextResponse.next();
  }

  // General authenticated user routes (e.g., /account, /player-dashboard)
  // This would include PLAYER, REFEREE, and GENERAL_USER roles.
  // Higher admin roles can also access these if they wish, as they passed authentication.
  const generalUserAuthenticatedPaths = [
    '/account', // Root of authenticated user accounts
    '/account/profile',
    '/account/security',
    '/account/preferences',
    '/season',
    '/player',
    '/coach',
    '/referee'
    // Add other paths specific to logged-in general users, players, referees etc.
    // E.g., '/player-dashboard', '/referee-assignments'
  ];
  if (generalUserAuthenticatedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // Any authenticated user is allowed here, as long as they have *any* role (covered by initial `user.roles.length === 0` check).
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
