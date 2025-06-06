import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from './prisma';
import { verifyJWT } from './utils';

const publicPaths = [
  '/', '/about', '/help', '/explore', '/leagues', '/leagues/', '/leagues/*',
  '/teams', '/teams/', '/teams/*', '/players', '/players/', '/players/*',
  '/login', '/register', '/access-denied', '/blog', '/contact', '/pricing', '/features', '/terms', '/privacy'
];

const generalUserPaths = [
  '/account/profile', '/account/security', '/account/preferences'
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow all public paths
  if (
    publicPaths.some(path => pathname === path || (path.endsWith('/*') && pathname.startsWith(path.slice(0, -1)))) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // 2. Check for access token
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }

  // 3. Decode JWT to get user role
  const user = await verifyJWT(accessToken, process.env.JWT_SECRET || 'your-secret');
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }

  // 4. Role-based access control
  // Only match /admin (not /administer, etc.)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (user.role !== Role.SYSTEM_ADMIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/access-denied';
      url.searchParams.set('reason', 'system_admin_only');
      return NextResponse.redirect(url);
    }
  } else if (pathname === '/league' || pathname.startsWith('/league/')) {
    if (user.role !== Role.LEAGUE_ADMIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/access-denied';
      url.searchParams.set('reason', 'league_admin_only');
      return NextResponse.redirect(url);
    }
  } else if (pathname === '/team' || pathname.startsWith('/team/')) {
    if (user.role !== Role.TEAM_ADMIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/access-denied';
      url.searchParams.set('reason', 'team_admin_only');
      return NextResponse.redirect(url);
    }
  } else if (generalUserPaths.some(path => pathname === path || pathname.startsWith(path))) {
    // Any authenticated user can access
    return NextResponse.next();
  }

  // All other routes: allow (public)
  return NextResponse.next();
}