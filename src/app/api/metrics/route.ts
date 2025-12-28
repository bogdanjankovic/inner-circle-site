
import { NextResponse } from 'next/server';
import { incrementView } from '@/lib/metrics';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug } = body;

        if (!slug) {
            return NextResponse.json({ error: 'Slug required' }, { status: 400 });
        }

        const updatedMetrics = incrementView(slug);
        return NextResponse.json({ success: true, metrics: updatedMetrics });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
