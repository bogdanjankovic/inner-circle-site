import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { savePost, generateSlug } from '@/lib/storage';
import { Article } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date().toISOString();
        const timestamp = Date.now();
        const title = `Untitled Draft ${new Date().toLocaleDateString()}`;
        const slug = `draft-${timestamp}`;

        const newArticle: Article = {
            slug,
            title,
            excerpt: "Enter a short summary here...",
            date: now,
            status: 'draft',
            tags: [],
            readingTime: "1 min read",
            imageUrl: "",
            imageSearchQuery: "",
            sections: [
                {
                    heading: "Introduction",
                    content: "Start writing your article here..."
                }
            ]
        };

        await savePost(newArticle);

        return NextResponse.json({ success: true, slug });

    } catch (error) {
        console.error("[API/Create] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
