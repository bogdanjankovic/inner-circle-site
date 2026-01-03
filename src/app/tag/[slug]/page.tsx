
import { getPublishedPosts } from '@/lib/storage';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const tag = decodeURIComponent(params.slug);
    return {
        title: `${tag.toUpperCase()} | BLEXOUT Protocol`,
        description: `Analysis and reports regarding ${tag}.`,
    };
}

export default async function TagPage(props: PageProps) {
    const params = await props.params;
    const tagSlug = decodeURIComponent(params.slug);
    const allPosts = await getPublishedPosts();

    // Case-insensitive filtering
    const posts = allPosts.filter(post =>
        post.tags?.some(tag => tag.toLowerCase() === tagSlug.toLowerCase())
    );

    if (posts.length === 0) {
        return (
            <div className="min-h-screen pt-32 px-6 max-w-7xl mx-auto text-center">
                <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
                    Index: {tagSlug}
                </h1>
                <p className="text-gray-500 font-mono">No data found in this sector.</p>
                <Link href="/" className="mt-8 inline-block text-green-500 hover:text-green-400 font-mono text-sm">
                    &larr; Return to Base
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto font-sans">
            <div className="mb-12 border-b border-white/10 pb-6 flex items-baseline justify-between">
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-2">
                    {tagSlug}
                </h1>
                <span className="font-mono text-green-500 text-sm tracking-widest">
                    {posts.length} {posts.length === 1 ? 'FILE' : 'FILES'} FOUND
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <Link key={post.slug} href={`/article/${post.slug}`} className="group block">
                        <div className="relative aspect-video mb-4 overflow-hidden rounded-sm border border-white/10 group-hover:border-green-500/50 transition-colors bg-white/5">
                            {post.imageUrl && (
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                                <span className="text-[10px] font-mono text-green-500 bg-black/80 px-1 py-0.5 border border-green-500/30 mb-2 inline-block">
                                    {post.readingTime || '5 MIN'} READ
                                </span>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-100 group-hover:text-green-400 transition-colors leading-tight mb-2">
                            {post.title}
                        </h2>
                        <p className="text-sm text-gray-500 line-clamp-2">
                            {post.excerpt}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
