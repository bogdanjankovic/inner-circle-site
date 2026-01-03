
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { getPublishedPosts } from '@/lib/storage';

export async function GET(request: NextRequest) {
    try {
        // Basic Auth Check
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const posts = await getPublishedPosts();

        // Define CSV Headers
        let csvContent = "Slug,Title,Views,Completion Rate (%),Avg Time (s)\n";

        for (const post of posts) {
            // Fetch granular data (Mocking structure for now based on Plan Phase 17)
            // Ideally we iterate ALL keys but that's expensive. 
            // We'll fetch the aggregated counters we plan to build.

            // stats:{slug}:views
            // stats:{slug}:completions
            // stats:{slug}:total_duration

            const [views, completions, totalDuration] = await Promise.all([
                kv.get<number>(`stats:${post.slug}:views`),
                kv.get<number>(`stats:${post.slug}:completions`),
                kv.get<number>(`stats:${post.slug}:total_duration`)
            ]);

            const viewCount = views || 0;
            const completionCount = completions || 0;
            const duration = totalDuration || 0;

            const completionRate = viewCount > 0 ? ((completionCount / viewCount) * 100).toFixed(1) : "0";
            const avgTime = viewCount > 0 ? (duration / viewCount).toFixed(1) : "0";

            // Escape title for CSV
            const safeTitle = `"${post.title.replace(/"/g, '""')}"`;

            csvContent += `${post.slug},${safeTitle},${viewCount},${completionRate}%,${avgTime}\n`;
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="blexout-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
    }
}
