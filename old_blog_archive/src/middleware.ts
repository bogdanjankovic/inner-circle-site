import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IP whitelist removed for cloud deployment

export function middleware(request: NextRequest) {
    // Check if the path starts with /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // --- 1. IP Restriction Removed (Cloud Mode) ---
        // Relying on Cookie Authentication below.

        // --- 2. Authentication Check ---
        // Check for the admin_session cookie
        const adminSession = request.cookies.get('admin_session');

        if (!adminSession) {
            // Redirect to login page if no cookie
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
    matcher: ['/admin/:path*', '/login'],
};
