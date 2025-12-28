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
