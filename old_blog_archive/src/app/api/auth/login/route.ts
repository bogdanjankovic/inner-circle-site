
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        // In a real app, use a strong environment variable.
        // For this demo, we'll use a default if not set.
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

        if (password === ADMIN_PASSWORD) {
            // Create a response
            const response = NextResponse.json({ success: true });

            // Set a secure, HTTP-only cookie
            // valid for 1 day
            response.cookies.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

            return response;
        } else {
            return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
