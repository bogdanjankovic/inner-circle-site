
import { NextResponse } from 'next/server';
import { deletePost } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        // Check auth cookie manually here if not using middleware for APIs 
        // (Middleware covers /admin, but APIs might need check if called from elsewhere. 
        // However, usually API routes are protected by middleware too given the matcher)    
        // Config matcher was '/admin/:path*', so '/api/admin/delete' is NOT protected by that specific matcher
        // unless we update middleware matcher or check here.
        // Let's check here for safety.

        // UPDATE: Actually, let's rely on middleware but we must ensure the matcher covers this API.
        // Ideally, we move this API to /api/admin/delete/route.ts. 
        // Middleware config: matcher: '/admin/:path*'. 
        // It does NOT cover /api/admin/...

        // So we verify cookie here.
        const cookie = request.headers.get('cookie');
        console.log("[API/Delete] Cookie:", cookie);
        if (!cookie?.includes('admin_session=true')) {
            console.warn("[API/Delete] Unauthorized access attempt");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slug } = body;
        console.log("[API/Delete] Request to delete:", slug);

        if (!slug) {
            return NextResponse.json({ error: 'Slug required' }, { status: 400 });
        }

        await deletePost(slug);
        console.log("[API/Delete] Delete success");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
