import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from './prisma';
import { verifyJWT } from './utils';

// Define your roles (ensure this matches your enum in auth.store)
// Paths that do NOT require authentication
const publicPaths = ['/login', '/register', '/access_denied', ]; // Add any other public routes

// Paths that require SYSTEM_ADMIN role
//Everything under /admin/* is protected and requires SYSTEM_ADMIN role
const systemAdminPaths = ['/admin']; // Adjust as per your admin routes

//Paths that require authentication but not necessarily admin role
const appPaths = [
    '/account/profile', '/account/security',
    '/dashboard', // Generic user dashboard
    '/dashboard/league', // League Admin dashboard (if you create this)
    '/dashboard/team',   // Team Admin dashboard (if you create this)
    '/league/manage',    // New: Manage own league
    '/league/admins'     // New: Manage league admins
];
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Handle public paths - no redirect needed
    if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // 2. Retrieve token/user info from cookies or headers
    // IMPORTANT: In a real app, you'd decode and verify your JWT here.
    // For this example, we'll simulate fetching from a cookie.
    // You'd typically store your access token in a secure, httpOnly cookie.
    const accessToken = request.cookies.get('accessToken')?.value;
    // If no access token, redirect to login
    if (!accessToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
    // Verify JWT (replace 'your-secret' with your actual secret)
    const user = await verifyJWT(accessToken, process.env.JWT_SECRET || 'your-secret');
    if (!user || (user.exp && user.exp * 1000 < Date.now())) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(url);
        response.cookies.set('accessToken', '', { maxAge: 0 });
        return response;
    }

    // const userRole = request.cookies.get('userRole')?.value as Role; // Assuming you store role in a cookie too
    const userRole = user.role;
    // If access token exists, but it's an admin path, check role
    if (systemAdminPaths.some(path => pathname.startsWith(path))) {
        if (userRole !== Role.SYSTEM_ADMIN) { // Only SYSTEM_ADMIN for /admin/*
            // Redirect to a specific "access denied" page or back to login
            const url = request.nextUrl.clone();
            url.pathname = '/access-denied'; // Or '/access-denied'
            console.warn(`Middleware: Access denied for role ${userRole} trying to access ${pathname}`);
            return NextResponse.redirect(url);
        }
    }
    // 
    // Check general authenticated app paths (any logged-in user can access these)
    // No specific role check needed here beyond having an accessToken,
    // unless some appPaths are role-specific (e.g., only PLAYER can see /app/player-dashboard)
    if (appPaths.some(path => pathname.startsWith(path))) {
        // User is authenticated (accessToken exists), allow access
        // Further role-specific logic can be handled within the page/layout components if needed
        
    }

    // If authenticated and authorized, proceed
 
    return NextResponse.next();
}

// Config: specify which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Any public assets in /public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
    ],
};