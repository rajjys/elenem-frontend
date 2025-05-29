import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from './prisma';

// Define your roles (ensure this matches your enum in auth.store)
// Paths that do NOT require authentication
const publicPaths = ['/login', '/register', '/']; // Add any other public routes

// Paths that require SYSTEM_ADMIN role
const adminPaths = ['/dashboard', '/leagues', '/users', '/settings']; // Adjust as per your admin routes

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Handle public paths - no redirect needed
    if (publicPaths.includes(pathname) || pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    // 2. Retrieve token/user info from cookies or headers
    // IMPORTANT: In a real app, you'd decode and verify your JWT here.
    // For this example, we'll simulate fetching from a cookie.
    // You'd typically store your access token in a secure, httpOnly cookie.
    const accessToken = request.cookies.get('accessToken')?.value;
    const userRole = request.cookies.get('userRole')?.value as Role; // Assuming you store role in a cookie too

    // If no access token, redirect to login
    if (!accessToken) {
        // If trying to access an admin path directly without login, redirect to login page.
        // If trying to access a general authenticated path without login, redirect to login page.
        if (adminPaths.some(path => pathname.startsWith(path)) || !publicPaths.includes(pathname)) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            // You might want to add a redirect param so login knows where to go after success
            // url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next(); // For other public paths, just proceed
    }

    // If access token exists, but it's an admin path, check role
    if (adminPaths.some(path => pathname.startsWith(path))) {
        if (userRole !== Role.SYSTEM_ADMIN) {
            // Redirect to a specific "access denied" page or back to login
            const url = request.nextUrl.clone();
            url.pathname = '/login'; // Or '/access-denied'
            console.warn(`Middleware: Access denied for role ${userRole} trying to access ${pathname}`);
            return NextResponse.redirect(url);
        }
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