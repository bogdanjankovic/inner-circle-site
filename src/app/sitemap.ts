import { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/storage';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://blexout.com';
    const posts = await getPublishedPosts();

    const postUrls = posts.map((post) => ({
        url: `${baseUrl}/article/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...postUrls,
    ];
}
