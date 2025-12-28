import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Add email to the 'subscribers' set in KV
        // sadd returns the number of elements added (1 if new, 0 if already exists)
        const added = await kv.sadd('subscribers', email);

        if (added === 0) {
            return NextResponse.json({ message: 'Already subscribed' });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[API/Newsletter] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
