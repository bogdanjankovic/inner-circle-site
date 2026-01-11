
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateSummary } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
    try {
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const keyPoints = await generateSummary(content);
        return NextResponse.json({ keyPoints });

    } catch (error) {
        console.error("Summary Generation Error:", error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
