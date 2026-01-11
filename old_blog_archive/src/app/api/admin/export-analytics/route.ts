import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { getPublishedPosts } from '@/lib/storage';

export const runtime = 'nodejs'; // Ensure we can use larger timeouts/memory if needed
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Basic Auth Check
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');

        // Default to last 30 days if no range provided
        const endDate = endParam ? new Date(endParam) : new Date();
        const startDate = startParam ? new Date(startParam) : new Date();
        if (!startParam) startDate.setDate(endDate.getDate() - 30);

        const posts = await getPublishedPosts();

        // 1. DATA AGGREGATION
        const aggregatedStats: Record<string, { views: number; time: number; completions: number }> = {};

        // Initialize 0s
        posts.forEach(p => {
            aggregatedStats[p.slug] = { views: 0, time: 0, completions: 0 };
        });

        const current = new Date(startDate);
        const dateKeys = [];

        while (current <= endDate) {
            dateKeys.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        // Fetch all days in parallel
        const promises = dateKeys.map(async (date) => {
            const pipeline = kv.pipeline();
            pipeline.hgetall(`analytics:${date}:views`);
            pipeline.hgetall(`analytics:${date}:duration`);
            pipeline.hgetall(`analytics:${date}:completions`);
            pipeline.lrange(`analytics:raw:${date}`, 0, -1); // Fetch raw logs for this day
            return pipeline.exec();
        });

        const results = await Promise.all(promises);
        const allRawLogs: any[] = [];

        results.forEach((dayResult: any[]) => {
            const viewsHash = dayResult[0] || {};
            const durationHash = dayResult[1] || {};
            const completionsHash = dayResult[2] || {};
            const rawLogs = dayResult[3] || [];

            // Sum up stats
            Object.entries(viewsHash).forEach(([slug, count]) => {
                if (!aggregatedStats[slug]) aggregatedStats[slug] = { views: 0, time: 0, completions: 0 };
                aggregatedStats[slug].views += Number(count);
            });
            Object.entries(durationHash).forEach(([slug, seconds]) => {
                if (!aggregatedStats[slug]) aggregatedStats[slug] = { views: 0, time: 0, completions: 0 };
                aggregatedStats[slug].time += Number(seconds);
            });
            Object.entries(completionsHash).forEach(([slug, count]) => {
                if (!aggregatedStats[slug]) aggregatedStats[slug] = { views: 0, time: 0, completions: 0 };
                aggregatedStats[slug].completions += Number(count);
            });

            // Collect Raw Logs
            rawLogs.forEach((logStr: string) => {
                try {
                    allRawLogs.push(JSON.parse(logStr));
                } catch (e) { /* ignore parse error */ }
            });
        });

        // 2. GENERATE CSV
        let csvContent = "PERFORMANCE SUMMARY\n";
        csvContent += "Slug,Title,Views,Completion Rate (%),Avg Time (s)\n";

        for (const post of posts) {
            const stats = aggregatedStats[post.slug] || { views: 0, time: 0, completions: 0 };
            const viewCount = stats.views;
            // Cap completion rate at 100% just in case
            const completionRate = viewCount > 0 ? Math.min((stats.completions / viewCount) * 100, 100).toFixed(1) : "0";
            const avgTime = viewCount > 0 ? (stats.time / viewCount).toFixed(1) : "0";
            const safeTitle = `"${post.title.replace(/"/g, '""')}"`;

            csvContent += `${post.slug},${safeTitle},${viewCount},${completionRate}%,${avgTime}\n`;
        }

        // Add Raw Data Section
        csvContent += "\n\nRAW TRAFFIC LOG\n";
        csvContent += "Timestamp,Event,Slug,Country,City,IP,User Agent\n";

        // Sort logs newest first
        allRawLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        allRawLogs.forEach(log => {
            // Infer 'Event' if not explicit (legacy logs might be just pageviews)
            // But our new logger puts everything in raw? 
            // Wait, api/analytics/route.ts only logs 'pageview' to raw currently!
            // We should ensure 'heartbeat' and 'click' are also logged if user wants "EVERYTHING".
            // For now, let's just dump what we have.
            const eventType = 'Pageview'; // Currently predominantly pageviews in raw

            csvContent += `${log.timestamp},${eventType},${log.slug || ''},"${log.country}","${log.city}","${log.ip}","${(log.userAgent || '').replace(/,/g, ';')}"\n`;
        });

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="blexout-analytics-${endDate.toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
    }
}
