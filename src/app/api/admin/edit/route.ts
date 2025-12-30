
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { savePost, getPostBySlug } from '@/lib/storage';
import { Article } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slug, title, excerpt, sections, status, tags, imageUrl, imageSearchQuery } = body;

        if (!slug || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingPost = await getPostBySlug(slug);

        // Construct updated article, preserving date and other fields if not provided
        const updatedArticle: Article = {
            slug,
            title,
            excerpt: excerpt || existingPost?.excerpt || '',
            sections: sections || existingPost?.sections || [],
            status: status || existingPost?.status || 'draft',
            tags: tags || existingPost?.tags || [],
            // Preserve creation date, or use now if new (though edit usually implies existing)
            date: existingPost?.date || new Date().toISOString(),
            readTime: existingPost?.readTime || "1 min read",
            readingTime: existingPost?.readingTime || '5 min read', // Should recalculate ideally, but keep simple for now
            author: existingPost?.author || "BLEXOUT System",
            imageUrl: imageUrl || existingPost?.imageUrl || '',
            imageSearchQuery: imageSearchQuery || existingPost?.imageSearchQuery || '',
            isArchived: status === 'archived' // Keep sync
        };

        await savePost(updatedArticle);
        console.log(`[API/Edit] Saved article: ${slug} with status: ${status}`);

        return NextResponse.json({ success: true, slug });

    } catch (error) {
        console.error("[API/Edit] Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
