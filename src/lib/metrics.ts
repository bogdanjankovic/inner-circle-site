import { kv } from '@vercel/kv';

export interface ArticleMetrics {
    views: number;
    lastVisited: string;
}

export interface MetricsData {
    [slug: string]: ArticleMetrics;
}

export async function getMetrics(): Promise<MetricsData> {
    try {
        // Fetch all metrics from the 'site:metrics' hash
        const rawData = await kv.hgetall<Record<string, ArticleMetrics>>('site:metrics');
        return rawData || {};
    } catch (error) {
        console.error('Error fetching metrics from KV:', error);
        return {};
    }
}

export async function incrementView(slug: string): Promise<ArticleMetrics> {
    try {
        const now = new Date().toISOString();

        // Get current metrics for this slug
        // We use hget to get just this field
        const current = await kv.hget<ArticleMetrics>('site:metrics', slug);

        const newMetrics: ArticleMetrics = {
            views: (current?.views || 0) + 1,
            lastVisited: now
        };

        // Save back to the hash
        // In @vercel/kv, hset accepts an object to set multiple fields, or key/value pair
        await kv.hset('site:metrics', { [slug]: newMetrics });

        return newMetrics;
    } catch (error) {
        console.error(`Error incrementing view for ${slug}:`, error);
        return { views: 0, lastVisited: new Date().toISOString() };
    }
}

export interface DailyAnalytics {
    date: string;
    visitors: number;
    totalViews: number;
    topCountries: { country: string; count: number }[];
    topClicks: { url: string; count: number }[];
}

export async function getDailyAnalytics(): Promise<DailyAnalytics> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const pipeline = kv.pipeline();

        // 1. Visitors
        pipeline.pfcount(`analytics:${today}:visitors`);
        // 2. Total Views (Site Wide)
        pipeline.get(`analytics:${today}:total_views`);
        // 3. Top 5 Countries
        pipeline.zrange(`analytics:${today}:country`, 0, 4, { rev: true, withScores: true });
        // 4. Top 5 Clicks
        pipeline.zrange(`analytics:${today}:clicks`, 0, 4, { rev: true, withScores: true });

        const results = await pipeline.exec();

        const visitors = (results[0] as number) || 0;
        const totalViews = (results[1] as number) || 0;

        // Parse Countries (zrange returns [val, score, val, score...])
        const rawCountries = results[2] as (string | number)[];
        const topCountries = [];
        for (let i = 0; i < rawCountries.length; i += 2) {
            topCountries.push({
                country: String(rawCountries[i]),
                count: Number(rawCountries[i + 1])
            });
        }

        // Parse Clicks
        const rawClicks = results[3] as (string | number)[];
        const topClicks = [];
        for (let i = 0; i < rawClicks.length; i += 2) {
            topClicks.push({
                url: String(rawClicks[i]),
                count: Number(rawClicks[i + 1])
            });
        }

        return {
            date: today,
            visitors,
            totalViews,
            topCountries,
            topClicks
        };

    } catch (error) {
        console.error('Error fetching daily analytics:', error);
        return {
            date: new Date().toISOString().split('T')[0],
            visitors: 0,
            totalViews: 0,
            topCountries: [],
            topClicks: []
        };
    }
}
