
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    // TODO: Replace 'pub-0000000000000000' with your actual Google AdSense Publisher ID.
    // Format: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
    const content = `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
