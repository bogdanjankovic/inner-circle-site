import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Whitelist of allowed IPs. 
// ::1 is localhost IPv6, 127.0.0.1 is localhost IPv4
const ALLOWED_IPS = ['::1', '127.0.0.1'];

export function middleware(request: NextRequest) {
    // Check if the path starts with /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // --- 1. IP Restriction (Stealth Mode) ---
        // We get the IP from the request headers or the socket
        let clientIp = request.headers.get('x-forwarded-for') || (request as any).ip;

        // Handle comma-separated headers (x-forwarded-for can be a list)
        if (clientIp && clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }

        // If no IP found (rare locally) or not in whitelist
        // For development safety, if clientIp is null, we might log it but block it to be safe.
        // However, locally 'request.ip' might be undefined in some setups, but usually '::1'.
        if (!clientIp || !ALLOWED_IPS.includes(clientIp)) {
            console.warn(`[Security] Blocked access to /admin from IP: ${clientIp}`);
            // Return 404 to make it invisible
            return NextResponse.rewrite(new URL('/404', request.url));
        }

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
