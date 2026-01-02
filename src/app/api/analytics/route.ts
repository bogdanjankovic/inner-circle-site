import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, slug, url, sessionId } = body;

        // Extract Geo Headers (Vercel automatically populates these on Edge)
        const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
        const city = req.headers.get('x-vercel-ip-city') || 'Unknown';
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'; // Anonymize in production if needed

        // Date Key for Daily Stats: "2025-12-30"
        const today = new Date().toISOString().split('T')[0];

        const pipeline = kv.pipeline();

        // 1. EVENT: PAGEVIEW
        if (event === 'pageview') {
            // Total Views per Article
            pipeline.hincrby(`analytics:${today}:views`, slug, 1);
            // Unique Visitors (HyperLogLog)
            pipeline.pfadd(`analytics:${today}:visitors`, ip);
            // Geo Stats (Sorted Set)
            pipeline.zincrby(`analytics:${today}:country`, 1, country);
            // Site-wide Views
            pipeline.incr(`analytics:${today}:total_views`);

            // RAW LOGGING (New Requirement)
            const rawEvent = {
                timestamp: new Date().toISOString(),
                ip, // Ideally hash this for privacy, but user asked for individual instance tracking
                country,
                city,
                slug,
                userAgent: req.headers.get('user-agent') || 'Unknown'
            };
            pipeline.lpush(`analytics:raw:${today}`, JSON.stringify(rawEvent));
            pipeline.expire(`analytics:raw:${today}`, 60 * 60 * 24 * 60); // Keep raw logs for 60 days
        }

        // 2. EVENT: HEARTBEAT (Duration)
        if (event === 'heartbeat') {
            // Add 30 seconds to the article's total read time
            pipeline.hincrby(`analytics:${today}:duration`, slug, 30);
        }

        // 3. EVENT: CLICK (Affiliate/Outbound)
        if (event === 'click') {
            // Track which URL was clicked
            pipeline.zincrby(`analytics:${today}:clicks`, 1, url);
        }

        await pipeline.exec();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
