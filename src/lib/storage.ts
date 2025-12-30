import { kv } from '@vercel/kv';
import { Article } from './types';

export async function getAllPosts(): Promise<Article[]> {
    try {
        const postsMap = await kv.hgetall<Record<string, Article>>('site:posts');
        if (!postsMap) return [];

        const posts = Object.values(postsMap);

        // Normalize status for older posts
        const normalizedPosts = posts.map(p => {
            if (!p.status) {
                if (p.isArchived) p.status = 'archived';
                else p.status = 'published';
            }
            return p;
        });

        return normalizedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

export async function getPaginatedPosts(page: number = 1, limit: number = 10): Promise<{ posts: Article[], total: number, totalPages: number }> {
    const allPosts = await getAllPosts();
    const total = allPosts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const slicedPosts = allPosts.slice(startIndex, startIndex + limit);

    return {
        posts: slicedPosts,
        total,
        totalPages
    };
}

export async function getPublishedPosts(): Promise<Article[]> {
    const posts = await getAllPosts();
    return posts.filter(p => p.status === 'published');
}

export async function getPostBySlug(slug: string): Promise<Article | undefined> {
    try {
        return await kv.hget<Article>('site:posts', slug) || undefined;
    } catch (error) {
        console.error(`Error fetching post ${slug}:`, error);
        return undefined;
    }
}

export async function savePost(article: Article): Promise<void> {
    // Ensure slug exists
    if (!article.slug) {
        article.slug = generateSlug(article.title);
    }

    await kv.hset('site:posts', { [article.slug]: article });
}

export async function deletePost(slug: string): Promise<void> {
    await kv.hdel('site:posts', slug);
}

export async function togglePostArchiveStatus(slug: string, isArchived: boolean): Promise<void> {
    const post = await getPostBySlug(slug);
    if (post) {
        post.status = isArchived ? 'archived' : 'published';
        post.isArchived = isArchived;
        await savePost(post);
    }
}

export function generateSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// --- GLOSSARY STORAGE ---

import { GLOSSARY as DEFAULT_GLOSSARY, TermDefinition } from './glossary'; // fallback import

export async function getGlossary(): Promise<Record<string, TermDefinition>> {
    try {
        const stored = await kv.get<Record<string, TermDefinition>>('site:glossary');
        // Merge stored with default to ensure we always have base terms if KV is empty
        return { ...DEFAULT_GLOSSARY, ...stored };
    } catch (error) {
        console.error("Error fetching glossary:", error);
        return DEFAULT_GLOSSARY;
    }
}

export async function saveGlossary(glossary: Record<string, TermDefinition>): Promise<void> {
    await kv.set('site:glossary', glossary);
}
