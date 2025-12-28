import fs from 'fs';
import path from 'path';
import { Article } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Ensure posts file exists
if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]));
}

export function getAllPosts(): Article[] {
    const fileContent = fs.readFileSync(POSTS_FILE, 'utf-8');
    const posts = JSON.parse(fileContent) as Article[];

    // Normalize status for older posts
    const normalizedPosts = posts.map(p => {
        if (!p.status) {
            if (p.isArchived) p.status = 'archived';
            else p.status = 'published'; // Default to published for existing items
        }
        return p;
    });

    return normalizedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPaginatedPosts(page: number = 1, limit: number = 10): { posts: Article[], total: number, totalPages: number } {
    const allPosts = getAllPosts();
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

export function getPublishedPosts(): Article[] {
    return getAllPosts().filter(p => p.status === 'published');
}

export function getPostBySlug(slug: string): Article | undefined {
    // We get all posts here because we might want to check if an archived one exists
    // The consumer (page.tsx) decides whether to show it.
    const posts = getAllPosts();
    return posts.find(p => p.slug === slug);
}

export function savePost(article: Article): void {
    const posts = getAllPosts();

    // Ensure slug exists
    if (!article.slug) {
        article.slug = generateSlug(article.title);
    }

    // Check for duplicates based on slug or title
    const existingIndex = posts.findIndex(p => p.slug === article.slug || p.title === article.title);

    if (existingIndex >= 0) {
        // Preserve existing archive status if not explicitly overwritten (though savePost usually overwrites)
        // If we want to be safe, we merge. But usually savePost implies "save this state".
        // Let's blindly overwrite for now as the editor likely sends full state, 
        // OR we can merge. For simpler CMS, overwrite is fine.
        posts[existingIndex] = article;
    } else {
        posts.unshift(article);
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

export function togglePostArchiveStatus(slug: string, isArchived: boolean): void {
    const posts = getAllPosts();
    const postIndex = posts.findIndex(p => p.slug === slug);

    if (postIndex >= 0) {
        posts[postIndex].status = isArchived ? 'archived' : 'published';
        posts[postIndex].isArchived = isArchived; // Keep sync for now
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    }
}

export function generateSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
