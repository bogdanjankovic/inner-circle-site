import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { togglePostArchiveStatus } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        // Robust cookie check using NextRequest
        const adminSession = request.cookies.get('admin_session');

        if (!adminSession || adminSession.value !== 'true') {
            console.warn("[API/Archive] Unauthorized access attempt - missing valid cookie");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slug, action } = body; // action: 'archive' | 'restore'
        console.log(`[API/Archive] Request to ${action}:`, slug);

        if (!slug) {
            return NextResponse.json({ error: 'Slug required' }, { status: 400 });
        }

        const shouldArchive = action !== 'restore'; // Default to archive if not specified
        togglePostArchiveStatus(slug, shouldArchive);

        console.log(`[API/Archive] ${shouldArchive ? 'Archive' : 'Restore'} success`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API/Archive] Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
