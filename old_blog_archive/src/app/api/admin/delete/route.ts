
import { NextRequest, NextResponse } from 'next/server';
import { deletePost } from '@/lib/storage';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { slug } = await req.json();

        if (!slug) {
            return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
        }

        await deletePost(slug);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete article error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete article' }, { status: 500 });
    }
}
